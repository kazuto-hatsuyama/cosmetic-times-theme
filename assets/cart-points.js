import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';

/**
 * A custom element that applies a point-usage amount to the cart as a cart attribute
 * (`points_used`), consumed by the `cosmetic-discount` Shopify Function at checkout.
 *
 * @typedef {Object} CartPointsComponentRefs
 * @property {HTMLInputElement} pointsInput - The points amount input.
 * @property {HTMLElement} pointsMessage - The status message element.
 */

/**
 * @extends {Component<CartPointsComponentRefs>}
 */
class CartPoints extends Component {
  requiredRefs = ['pointsInput', 'pointsMessage'];

  /** @type {AbortController | null} */
  #activeFetch = null;

  /**
   * Applies the entered points amount to the cart.
   * @param {SubmitEvent} event - The submit event on our form.
   */
  applyPoints = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { pointsInput, pointsMessage } = this.refs;
    const pointsUsed = pointsInput.value;

    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }

    const abortController = new AbortController();
    this.#activeFetch = abortController;

    pointsMessage.classList.add('hidden');
    pointsMessage.classList.remove('cart-points__message--error');
    pointsMessage.textContent = '';

    try {
      const config = fetchConfig('json', {
        body: JSON.stringify({ attributes: { points_used: pointsUsed } }),
      });

      const response = await fetch(Theme.routes.cart_update_url, {
        ...config,
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('Failed to update cart attributes');

      pointsMessage.textContent = pointsMessage.dataset.successText ?? '';
      pointsMessage.classList.remove('hidden');
    } catch (error) {
      if (abortController.signal.aborted) return;

      pointsMessage.textContent = pointsMessage.dataset.errorText ?? '';
      pointsMessage.classList.add('cart-points__message--error');
      pointsMessage.classList.remove('hidden');
    } finally {
      this.#activeFetch = null;
    }
  };
}

if (!customElements.get('cart-points-component')) {
  customElements.define('cart-points-component', CartPoints);
}
