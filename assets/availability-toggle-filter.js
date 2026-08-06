import { Component } from '@theme/component';

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
 * @param {URLSearchParams} params
 * @returns {AvailabilityState}
 */
function getStateFromParams(params) {
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
 * @typedef {Object} AvailabilityToggleInputsRefs
 * @property {HTMLInputElement[]} facetInputs - The two availability checkboxes
 * @property {HTMLInputElement} [showAvailableInput] - Hidden field mirroring the "available" checkbox
 * @property {HTMLInputElement} [showUnavailableInput] - Hidden field mirroring the "unavailable" checkbox
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
    this.#restoreFromURL();
  }

  /**
   * Called after this component is re-rendered by the Section Rendering API (e.g. when
   * another filter like Brand changes and the whole section morphs). Liquid always
   * re-renders this component with its static default markup — it has no way to know
   * the shopper's previous availability choice, since that state is intentionally kept
   * outside Shopify's own (broken) filter system. We restore it here from the URL,
   * which was already updated correctly by facets-form-component before the morph ran.
   */
  updatedCallback() {
    this.#restoreFromURL();
  }

  /**
   * Restores checkbox checked state from the URL. Only called when the checkboxes
   * themselves were just replaced/reset by Liquid (initial load, or after another
   * filter's section re-render) — never from this component's own `updateFilters`,
   * where the checkboxes already hold the shopper's just-made choice and must not be
   * overwritten by a re-derived value.
   */
  #restoreFromURL() {
    const params = new URL(window.location.href).searchParams;
    const state = getStateFromParams(params);

    if (Array.isArray(this.refs.facetInputs)) {
      for (const input of this.refs.facetInputs) {
        if (input.name === 'avail_available') input.checked = state.showAvailable;
        if (input.name === 'avail_unavailable') input.checked = state.showUnavailable;
      }
    }

    this.#applyEffects(state);
  }

  /**
   * Applies the given state's visible effects (product visibility, item count text,
   * hidden form fields, facet summary). Deliberately does not touch the checkboxes'
   * `checked` state — the caller is responsible for that when appropriate.
   * @param {AvailabilityState} state
   */
  #applyEffects(state) {
    if (this.refs.showAvailableInput instanceof HTMLInputElement) {
      this.refs.showAvailableInput.value = state.showAvailable ? 'true' : 'false';
    }
    if (this.refs.showUnavailableInput instanceof HTMLInputElement) {
      this.refs.showUnavailableInput.value = state.showUnavailable ? 'true' : 'false';
    }

    applyAvailabilityState(state);
    applyItemCountText(state);
    this.#updateStatus();
  }

  #updateStatus() {
    if (!Array.isArray(this.refs.facetInputs)) return;

    const details = this.closest('details');
    const statusComponent = details?.querySelector('facet-status-component');
    if (!statusComponent || typeof (/** @type {any} */ (statusComponent).updateListSummary) !== 'function') return;

    const checked = this.refs.facetInputs.filter((input) => input.checked);
    /** @type {any} */ (statusComponent).updateListSummary(checked);
  }

  /**
   * Handles a checkbox change: the checkbox the shopper just clicked already holds
   * their intended state, so we only ever *read* the current checked states here (never
   * write them back). Applies the resulting state instantly (no server round-trip
   * needed, since every product's availability is already present as a data attribute),
   * writes the two flags into their hidden fields so they're the values actually
   * submitted, then defers to the normal facets form update so the URL/history stays in
   * sync with the rest of the filters (brand, price, etc.) exactly like every other facet.
   */
  updateFilters() {
    if (Array.isArray(this.refs.facetInputs)) {
      /** @type {AvailabilityState} */
      const state = { showAvailable: false, showUnavailable: false };

      for (const input of this.refs.facetInputs) {
        if (input.name === 'avail_available') state.showAvailable = input.checked;
        if (input.name === 'avail_unavailable') state.showUnavailable = input.checked;
      }

      this.#applyEffects(state);
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
