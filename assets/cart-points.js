import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { morphSection } from '@theme/section-renderer';
import { CartUpdateEvent } from '@theme/events';

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

    pointsMessage.classList.add('hidden');
    pointsMessage.classList.remove('cart-points__message--error');
    pointsMessage.textContent = '';

    const showError = (text) => {
      pointsMessage.textContent = text ?? '';
      pointsMessage.classList.remove('hidden');
      pointsMessage.classList.add('cart-points__message--error');
    };

    // 空欄・0以下は「未使用」として扱う（エラーにはしない）
    const rawValue = pointsInput.value.trim();
    let pointsUsed = 0;

    if (rawValue !== '') {
      if (!/^-?\d+$/.test(rawValue)) {
        showError(pointsMessage.dataset.errorInvalidText);
        return;
      }

      const parsed = Number(rawValue);
      pointsUsed = parsed > 0 ? parsed : 0;
    }

    const pointBalance = Number(this.dataset.pointBalance ?? 0);
    const cartSubtotal = Number(this.dataset.cartSubtotal ?? 0);

    if (pointsUsed > pointBalance) {
      showError(pointsMessage.dataset.errorBalanceText);
      return;
    }

    if (pointsUsed > cartSubtotal) {
      showError(pointsMessage.dataset.errorSubtotalText);
      return;
    }

    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }

    const abortController = new AbortController();
    this.#activeFetch = abortController;

    const sectionId = this.dataset.sectionId;

    try {
      const config = fetchConfig('json', {
        body: JSON.stringify({
          attributes: { points_used: pointsUsed },
          sections: sectionId ? [sectionId] : undefined,
        }),
      });

      const response = await fetch(Theme.routes.cart_update_url, {
        ...config,
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('Failed to update cart attributes');

      const data = await response.json();

      if (sectionId && data.sections?.[sectionId]) {
        document.dispatchEvent(
          new CartUpdateEvent(data, this.id, { source: 'cart-points-component', sections: data.sections })
        );
        morphSection(sectionId, data.sections[sectionId]);
      }

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
