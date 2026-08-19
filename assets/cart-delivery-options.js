import { Component } from '@theme/component';
import { debounce, fetchConfig } from '@theme/utilities';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * A custom element that persists delivery preferences (delivery date / time slot /
 * delivery-box usage) to the cart as cart attributes (`delivery_date`, `delivery_time`,
 * `delivery_box`), so they survive through checkout as order attributes without any
 * checkout customization.
 *
 * The delivery date is chosen from a select box (matching the legacy site's UI) listing
 * `data-selectable-days` consecutive calendar dates starting `data-lead-days` days from today.
 * Both are theme settings, so operators can adjust the window (e.g. push it out over year-end)
 * without a code change.
 *
 * @typedef {Object} CartDeliveryOptionsComponentRefs
 * @property {HTMLSelectElement} dateSelect - The delivery date select.
 * @property {HTMLSelectElement} timeSelect - The delivery time slot select.
 * @property {HTMLElement} message - The status message element.
 */

/**
 * @extends {Component<CartDeliveryOptionsComponentRefs>}
 */
class CartDeliveryOptions extends Component {
  requiredRefs = ['dateSelect', 'timeSelect', 'message'];

  /** @type {AbortController | null} */
  #activeFetch = null;

  connectedCallback() {
    super.connectedCallback();

    const leadDays = Number(this.dataset.leadDays ?? 7);
    const selectableDays = Number(this.dataset.selectableDays ?? 14);
    const selectedDate = this.dataset.selectedDate ?? '';

    this.#populateDateOptions(leadDays, selectableDays, selectedDate);
  }

  /**
   * Builds the `delivery_date` select's options: one per calendar day in the configured
   * window, plus the previously saved date if it falls outside that window (so a stale
   * selection isn't silently discarded).
   * @param {number} leadDays
   * @param {number} selectableDays
   * @param {string} selectedDate - A date in `YYYY-MM-DD` format, or `''` for 指定なし.
   */
  #populateDateOptions(leadDays, selectableDays, selectedDate) {
    const { dateSelect } = this.refs;

    const dates = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + leadDays);

    for (let i = 0; i < selectableDays; i++) {
      dates.push(CartDeliveryOptions.#toISODate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    if (selectedDate && !dates.includes(selectedDate)) {
      dates.push(selectedDate);
      dates.sort();
    }

    for (const isoDate of dates) {
      const option = document.createElement('option');
      option.value = isoDate;
      option.textContent = CartDeliveryOptions.#toLabel(isoDate);
      if (isoDate === selectedDate) option.selected = true;
      dateSelect.appendChild(option);
    }
  }

  /**
   * Handles a change on any of the delivery fields (date / time / delivery-box).
   * @param {Event} event
   */
  handleChange = () => {
    this.#save();
  };

  #save = debounce(async () => {
    const { dateSelect, timeSelect, message } = this.refs;
    const checkedBox = this.querySelector('input[name="delivery_box"]:checked');

    const attributes = {
      delivery_date: dateSelect.value ?? '',
      delivery_time: timeSelect.value ?? '00',
      delivery_box: checkedBox instanceof HTMLInputElement ? checkedBox.value : '01',
    };

    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }

    const abortController = new AbortController();
    this.#activeFetch = abortController;

    try {
      // Note: deliberately not requesting `sections` / dispatching a CartUpdateEvent here.
      // Delivery preferences don't affect totals, item count, or any other rendered cart UI,
      // and doing so previously caused `component-cart-items.js`'s global cartUpdate listener
      // to morph this section with the server's raw (pre-JS) <select> markup, wiping out the
      // client-generated <option> list and making the just-picked date appear to revert to
      // 指定なし until the next full page load.
      const config = fetchConfig('json', {
        body: JSON.stringify({ attributes }),
      });

      const response = await fetch(Theme.routes.cart_update_url, {
        ...config,
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('Failed to update cart attributes');

      message.textContent = message.dataset.successText ?? '';
      message.classList.remove('hidden');
      message.classList.remove('cart-delivery-options__message--error');
    } catch (error) {
      if (abortController.signal.aborted) return;

      message.textContent = message.dataset.errorText ?? '';
      message.classList.remove('hidden');
      message.classList.add('cart-delivery-options__message--error');
    } finally {
      this.#activeFetch = null;
    }
  }, 200);

  /** @param {Date} date */
  static #toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** @param {string} isoDate - A date in `YYYY-MM-DD` format. */
  static #toLabel(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}（${WEEKDAY_LABELS[date.getDay()]}）`;
  }
}

if (!customElements.get('cart-delivery-options-component')) {
  customElements.define('cart-delivery-options-component', CartDeliveryOptions);
}
