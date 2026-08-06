import { Component } from '@theme/component';

/**
 * @typedef {'available' | 'unavailable' | 'all'} AvailabilityView
 */

const AVAILABLE_PARAM = 'avail_available';
const UNAVAILABLE_PARAM = 'avail_unavailable';
/** Single source of truth for the current view, kept in a hidden form field. Using one
 * explicit field (rather than inferring the view from which of the two checkboxes are
 * present in the URL) avoids an unresolvable ambiguity: an unchecked checkbox is simply
 * absent from form data, so "neither box checked" and "fresh page load, untouched" would
 * otherwise look identical and couldn't be told apart. */
const VIEW_PARAM = 'avail_view';

/**
 * Determines the view from the two checkboxes' current checked state. Both checked (or
 * neither checked) means "no restriction" — consistent with how Shopify's own other list
 * facets behave when zero values are selected.
 * @param {boolean} showAvailable
 * @param {boolean} showUnavailable
 * @returns {AvailabilityView}
 */
function computeView(showAvailable, showUnavailable) {
  if (showAvailable && !showUnavailable) return 'available';
  if (showUnavailable && !showAvailable) return 'unavailable';
  return 'all';
}

/**
 * Reads the desired view from the URL. Absent means a fresh page load (the shopper
 * hasn't interacted with this control yet), which defaults to hiding out-of-stock
 * products, matching the site's default collection browsing behavior.
 * @param {URLSearchParams} params
 * @returns {AvailabilityView}
 */
function getViewFromParams(params) {
  const value = params.get(VIEW_PARAM);
  if (value === 'available' || value === 'unavailable' || value === 'all') return value;
  return 'available';
}

/**
 * Shows/hides every product card on the page according to the given view, using the
 * `data-product-available` attribute Liquid already renders on each card
 * (sections/main-collection.liquid). Also marks each `results-list` with the current
 * view for potential styling hooks.
 * @param {AvailabilityView} view
 */
function applyAvailabilityView(view) {
  document.querySelectorAll('[data-product-available]').forEach((card) => {
    const isAvailable = card.getAttribute('data-product-available') === 'true';
    let shouldHide = false;

    if (view === 'available') shouldHide = !isAvailable;
    else if (view === 'unavailable') shouldHide = isAvailable;

    card.toggleAttribute('hidden', shouldHide);
  });

  document.querySelectorAll('results-list').forEach((resultsList) => {
    resultsList.setAttribute('data-availability-view', view);
  });
}

/**
 * Swaps which pre-rendered item-count text is visible (see
 * snippets/collection-item-count.liquid) to match the current view, avoiding
 * re-implementing Shopify's count pluralization/translation rules in JS.
 * @param {AvailabilityView} view
 */
function applyItemCountText(view) {
  document.querySelectorAll('[data-item-count-wrapper]').forEach((wrapper) => {
    wrapper.querySelectorAll('[data-item-count-for]').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.hidden = node.dataset.itemCountFor !== view;
    });
  });
}

/**
 * @typedef {Object} AvailabilityToggleInputsRefs
 * @property {HTMLInputElement[]} facetInputs - The two availability checkboxes
 * @property {HTMLInputElement} [viewInput] - Hidden field carrying the authoritative view
 */

/**
 * Renders and drives the custom "在庫あり / 在庫切れ" availability toggle, replacing
 * Shopify's native (known-broken) Availability filter facet.
 *
 * @extends {Component<AvailabilityToggleInputsRefs>}
 */
class AvailabilityToggleInputsComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.#syncFromURL();
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
    this.#syncFromURL();
  }

  #syncFromURL() {
    const params = new URL(window.location.href).searchParams;
    const view = getViewFromParams(params);
    this.#applyView(view);
  }

  /**
   * @param {AvailabilityView} view
   */
  #applyView(view) {
    if (Array.isArray(this.refs.facetInputs)) {
      for (const input of this.refs.facetInputs) {
        if (input.name === AVAILABLE_PARAM) input.checked = view === 'available' || view === 'all';
        if (input.name === UNAVAILABLE_PARAM) input.checked = view === 'unavailable' || view === 'all';
      }
    }

    if (this.refs.viewInput instanceof HTMLInputElement) {
      this.refs.viewInput.value = view;
    }

    applyAvailabilityView(view);
    applyItemCountText(view);
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
   * Handles a checkbox change: applies the new view instantly (no server round-trip
   * needed, since every product's availability is already present as a data attribute),
   * writes the resolved view into the hidden field so it's the value actually submitted,
   * then defers to the normal facets form update so the URL/history stays in sync with
   * the rest of the filters (brand, price, etc.) exactly like every other facet.
   */
  updateFilters() {
    if (Array.isArray(this.refs.facetInputs)) {
      const checkedNames = new Set(this.refs.facetInputs.filter((input) => input.checked).map((input) => input.name));
      const view = computeView(checkedNames.has(AVAILABLE_PARAM), checkedNames.has(UNAVAILABLE_PARAM));
      this.#applyView(view);
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
