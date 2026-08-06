import { Component } from '@theme/component';
import { ThemeEvents } from '@theme/events';

const SHOW_AVAILABLE_PARAM = 'avail_show_available';
const SHOW_UNAVAILABLE_PARAM = 'avail_show_unavailable';

/**
 * @typedef {Object} AvailabilityState
 * @property {boolean} showAvailable
 * @property {boolean} showUnavailable
 */

/**
 * Reads a "true"/"false" URL param, falling back to `defaultValue` when the param is
 * absent (a fresh page load, before the shopper has interacted with this control at all).
 * @param {URLSearchParams} params
 * @param {string} name
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function getBoolParam(params, name, defaultValue) {
  const value = params.get(name);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

/**
 * @returns {AvailabilityState}
 */
function currentStateFromURL() {
  const params = new URL(window.location.href).searchParams;
  return {
    showAvailable: getBoolParam(params, SHOW_AVAILABLE_PARAM, true),
    showUnavailable: getBoolParam(params, SHOW_UNAVAILABLE_PARAM, false),
  };
}

/**
 * Collapses the two independent flags into a single key, used only to pick which
 * pre-rendered presentation (item count text, `data-availability-view` attribute) to
 * show — never fed back into the flags themselves.
 * @param {AvailabilityState} state
 * @returns {'available' | 'unavailable' | 'all' | 'none'}
 */
function getPresentationKey({ showAvailable, showUnavailable }) {
  if (showAvailable && showUnavailable) return 'all';
  if (showAvailable) return 'available';
  if (showUnavailable) return 'unavailable';
  return 'none';
}

/**
 * Shows/hides every product card on the page according to the given state, using the
 * `data-product-available` attribute Liquid already renders on each card
 * (sections/main-collection.liquid). Also marks each `results-list` with the current
 * presentation key for potential styling hooks.
 * @param {AvailabilityState} state
 */
function applyAvailabilityState(state) {
  document.querySelectorAll('[data-product-available]').forEach((card) => {
    const isAvailable = card.getAttribute('data-product-available') === 'true';
    const shouldShow = isAvailable ? state.showAvailable : state.showUnavailable;
    card.toggleAttribute('hidden', !shouldShow);
  });

  const key = getPresentationKey(state);
  document.querySelectorAll('results-list').forEach((resultsList) => {
    resultsList.setAttribute('data-availability-view', key);
  });
}

/**
 * Swaps which pre-rendered item-count text is visible (see
 * snippets/collection-item-count.liquid) to match the current state, avoiding
 * re-implementing Shopify's count pluralization/translation rules in JS.
 * @param {AvailabilityState} state
 */
function applyItemCountText(state) {
  const key = getPresentationKey(state);
  document.querySelectorAll('[data-item-count-wrapper]').forEach((wrapper) => {
    wrapper.querySelectorAll('[data-item-count-for]').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.hidden = node.dataset.itemCountFor !== key;
    });
  });
}

/**
 * Restores every *live, currently-attached* availability toggle instance (there can be
 * more than one — e.g. a desktop bar version and a mobile drawer version — each in its
 * own `<form>`) to match the given state, and applies its visible effects.
 *
 * Deliberately a plain function that queries `document` directly, and deliberately
 * re-invoked several times after any filter change rather than relying on a single
 * "morph finished" callback — see `scheduleRestore` for why.
 * @param {AvailabilityState} state
 */
function restoreAllInstances(state) {
  document.querySelectorAll('availability-toggle-inputs-component').forEach((component) => {
    const availableInput = component.querySelector('input[name="avail_available"]');
    const unavailableInput = component.querySelector('input[name="avail_unavailable"]');
    const showAvailableInput = component.querySelector('input[name="avail_show_available"]');
    const showUnavailableInput = component.querySelector('input[name="avail_show_unavailable"]');

    if (availableInput instanceof HTMLInputElement) availableInput.checked = state.showAvailable;
    if (unavailableInput instanceof HTMLInputElement) unavailableInput.checked = state.showUnavailable;
    if (showAvailableInput instanceof HTMLInputElement) showAvailableInput.value = state.showAvailable ? 'true' : 'false';
    if (showUnavailableInput instanceof HTMLInputElement)
      showUnavailableInput.value = state.showUnavailable ? 'true' : 'false';

    const checkedInputs = [availableInput, unavailableInput].filter(
      (input) => input instanceof HTMLInputElement && input.checked
    );
    const statusComponent = component.closest('details')?.querySelector('facet-status-component');
    if (statusComponent && typeof (/** @type {any} */ (statusComponent).updateListSummary) === 'function') {
      /** @type {any} */ (statusComponent).updateListSummary(checkedInputs);
    }
  });

  applyAvailabilityState(state);
  applyItemCountText(state);
}

/**
 * Delays (ms) at which `restoreAllInstances` is re-applied after any filter change.
 *
 * Horizon's morph engine (assets/morph.js) always resets our checkboxes' `checked`
 * property back to Liquid's static default whenever ANY filter change re-renders this
 * section (not just our own), because it patches plain `HTMLInputElement`s directly —
 * that isn't gated behind custom-element upgrading. We can't hook the exact moment this
 * happens: `assets/component.js`'s `updatedCallback()` mechanism (which this component
 * would otherwise use) never fires for us here, because the "new" node the morph diffs
 * against comes from `DOMParser`, whose document is inert and never upgrades custom
 * elements — so `instanceof Component` fails and the hook silently never runs. Section
 * Rendering API responses can also take over a second depending on collection size and
 * network conditions, so a single fixed delay isn't reliable either. Re-applying several
 * times over a generous window is the pragmatic fix without touching the shared,
 * theme-standard morph engine.
 */
const RESTORE_DELAYS_MS = [50, 150, 400, 800, 1500, 2500, 4000];

let filterUpdateListenerRegistered = false;

/**
 * Schedules re-applications of the current URL's availability state after any facet
 * changes (price, brand, sort, or this control itself all dispatch the same event).
 */
function scheduleRestore() {
  const state = currentStateFromURL();
  restoreAllInstances(state);
  for (const delay of RESTORE_DELAYS_MS) {
    setTimeout(() => restoreAllInstances(currentStateFromURL()), delay);
  }
}

function ensureFilterUpdateListener() {
  if (filterUpdateListenerRegistered) return;
  filterUpdateListenerRegistered = true;
  document.addEventListener(ThemeEvents.FilterUpdate, scheduleRestore);
}

/**
 * @typedef {Object} AvailabilityToggleInputsRefs
 * @property {HTMLInputElement[]} facetInputs - The two availability checkboxes
 */

/**
 * Renders and drives the custom "在庫あり / 在庫切れ" availability toggle, replacing
 * Shopify's native (known-broken) Availability filter facet. The two checkboxes are
 * fully independent "show this category" toggles — there's no combined enum to collapse
 * them into, so a shopper's choice can never be second-guessed or overwritten by a
 * re-derived value.
 *
 * @extends {Component<AvailabilityToggleInputsRefs>}
 */
class AvailabilityToggleInputsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    ensureFilterUpdateListener();
    restoreAllInstances(currentStateFromURL());
  }

  /**
   * Handles a checkbox change: the checkbox the shopper just clicked already holds
   * their intended state, so we only ever *read* the current checked states here (never
   * write them back). Applies the resulting state instantly (no server round-trip
   * needed, since every product's availability is already present as a data attribute),
   * writes the two flags into their hidden fields so they're the values actually
   * submitted, then defers to the normal facets form update so the URL/history stays in
   * sync with the rest of the filters (brand, price, etc.) exactly like every other
   * facet. `scheduleRestore` (triggered by the resulting `filter:update` event) takes
   * over from here to keep re-asserting this state while the section re-renders.
   */
  updateFilters() {
    if (Array.isArray(this.refs.facetInputs)) {
      /** @type {AvailabilityState} */
      const state = { showAvailable: false, showUnavailable: false };

      for (const input of this.refs.facetInputs) {
        if (input.name === 'avail_available') state.showAvailable = input.checked;
        if (input.name === 'avail_unavailable') state.showUnavailable = input.checked;
      }

      restoreAllInstances(state);
    }

    const facetsForm = this.closest('facets-form-component');
    if (facetsForm && typeof (/** @type {any} */ (facetsForm).updateFilters) === 'function') {
      /** @type {any} */ (facetsForm).updateFilters();
    }
  }
}

if (!customElements.get('availability-toggle-inputs-component')) {
  customElements.define('availability-toggle-inputs-component', AvailabilityToggleInputsComponent);
}
