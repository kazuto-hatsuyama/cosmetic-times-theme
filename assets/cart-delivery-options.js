import { Component } from '@theme/component';
import { debounce, fetchConfig } from '@theme/utilities';
import { CartUpdateEvent } from '@theme/events';

/**
 * A custom element that persists delivery preferences (delivery date / time slot /
 * delivery-box usage) to the cart as cart attributes (`delivery_date`, `delivery_time`,
 * `delivery_box`), so they survive through checkout as order attributes without any
 * checkout customization.
 *
 * The earliest selectable delivery date is calculated on the client from
 * `data-lead-business-days` / `data-blackout-dates`, so operators can adjust lead time and
 * blackout dates (year-end holidays, etc.) from the theme editor without a code change.
 *
 * @typedef {Object} CartDeliveryOptionsComponentRefs
 * @property {HTMLInputElement} dateInput - The delivery date input.
 * @property {HTMLSelectElement} timeSelect - The delivery time slot select.
 * @property {HTMLElement} dateHint - The hint text under the date input.
 * @property {HTMLElement} message - The status message element.
 */

/**
 * @extends {Component<CartDeliveryOptionsComponentRefs>}
 */
class CartDeliveryOptions extends Component {
  requiredRefs = ['dateInput', 'timeSelect', 'dateHint', 'message'];

  /** @type {AbortController | null} */
  #activeFetch = null;

  /** @type {Set<string>} */
  #blackoutDates = new Set();

  /** @type {string} */
  #minDate = '';

  /** @type {string} */
  #maxDate = '';

  /** @type {string} */
  #lastValidDate = '';

  connectedCallback() {
    super.connectedCallback();

    const leadBusinessDays = Number(this.dataset.leadBusinessDays ?? 7);
    const maxAdvanceDays = Number(this.dataset.maxAdvanceDays ?? 90);

    this.#blackoutDates = new Set(
      (this.dataset.blackoutDates ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    );

    const earliest = CartDeliveryOptions.#computeEarliestDate(leadBusinessDays, this.#blackoutDates);
    const latest = new Date();
    latest.setHours(0, 0, 0, 0);
    latest.setDate(latest.getDate() + maxAdvanceDays);

    this.#minDate = CartDeliveryOptions.#toISODate(earliest);
    this.#maxDate = CartDeliveryOptions.#toISODate(latest);
    this.#lastValidDate = this.refs.dateInput.value;

    this.refs.dateInput.min = this.#minDate;
    this.refs.dateInput.max = this.#maxDate;
    this.refs.dateHint.textContent = `${CartDeliveryOptions.#toJapaneseDate(earliest)}以降でご指定いただけます`;
  }

  /**
   * Handles a change on any of the delivery fields (date / time / delivery-box).
   * @param {Event} event
   */
  handleChange = (event) => {
    if (event.target === this.refs.dateInput) {
      this.#handleDateChange();
      return;
    }

    this.#save();
  };

  #handleDateChange() {
    const { dateInput, message } = this.refs;
    const value = dateInput.value;

    if (value === '') {
      this.#lastValidDate = '';
      this.#clearMessage();
      this.#save();
      return;
    }

    const isInRange = value >= this.#minDate && value <= this.#maxDate;
    const isValid = isInRange && CartDeliveryOptions.#isBusinessDay(value, this.#blackoutDates);

    if (!isValid) {
      dateInput.value = this.#lastValidDate;
      message.textContent = message.dataset.errorDateText ?? '';
      message.classList.remove('hidden');
      message.classList.add('cart-delivery-options__message--error');
      return;
    }

    this.#lastValidDate = value;
    this.#clearMessage();
    this.#save();
  }

  #clearMessage() {
    const { message } = this.refs;
    message.textContent = '';
    message.classList.add('hidden');
    message.classList.remove('cart-delivery-options__message--error');
  }

  #save = debounce(async () => {
    const { dateInput, timeSelect, message } = this.refs;
    const checkedBox = this.querySelector('input[name="delivery_box"]:checked');

    const attributes = {
      delivery_date: dateInput.value ?? '',
      delivery_time: timeSelect.value ?? '00',
      delivery_box: checkedBox instanceof HTMLInputElement ? checkedBox.value : '01',
    };

    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }

    const abortController = new AbortController();
    this.#activeFetch = abortController;

    const sectionId = this.dataset.sectionId;

    try {
      const config = fetchConfig('json', {
        body: JSON.stringify({
          attributes,
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
          new CartUpdateEvent(data, this.id, { source: 'cart-delivery-options-component', sections: data.sections })
        );
      }

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

  /**
   * @param {string} isoDate - A date in `YYYY-MM-DD` format.
   * @param {Set<string>} blackoutDates
   * @returns {boolean}
   */
  static #isBusinessDay(isoDate, blackoutDates) {
    const day = CartDeliveryOptions.#parseISODate(isoDate).getDay();
    if (day === 0 || day === 6) return false;
    return !blackoutDates.has(isoDate);
  }

  /**
   * Computes the earliest date that is at least `leadBusinessDays` business days from today,
   * excluding Saturdays, Sundays, and the provided blackout dates.
   * @param {number} leadBusinessDays
   * @param {Set<string>} blackoutDates
   * @returns {Date}
   */
  static #computeEarliestDate(leadBusinessDays, blackoutDates) {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + 1);

    let count = 0;
    // Safety cap (10 years) to guard against a misconfigured blackout list spanning too wide a range.
    for (let i = 0; i < 3650; i++) {
      if (CartDeliveryOptions.#isBusinessDay(CartDeliveryOptions.#toISODate(cursor), blackoutDates)) {
        count++;
        if (count >= leadBusinessDays) break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return cursor;
  }

  /** @param {Date} date */
  static #toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** @param {string} isoDate - A date in `YYYY-MM-DD` format. */
  static #parseISODate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /** @param {Date} date */
  static #toJapaneseDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

if (!customElements.get('cart-delivery-options-component')) {
  customElements.define('cart-delivery-options-component', CartDeliveryOptions);
}
