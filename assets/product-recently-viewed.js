import { Component } from '@theme/component';
import { RecentlyViewed } from '@theme/recently-viewed-products';
import { sectionRenderer } from '@theme/section-renderer';

/**
 * 商品ページの「最近チェックした商品」セクション（sections/product-recently-viewed.liquid）の
 * 描画を担当するWeb Component（新規・2026-09-02、
 * tasks/20260902-product-page-discovery-and-support-sections/spec.md）。
 *
 * assets/predictive-search.js の #getRecentlyViewedProductsMarkup と同じ手法
 * （Theme.routes.search_url に `q=id:X OR id:Y` + `resources[type]=product` を付与し、
 * Section Rendering API でこのセクション自身を再取得する）で、現在の商品を除いた
 * 閲覧履歴商品のカードを取得して差し替える。SSR時点ではlocalStorageを参照できないため、
 * このセクションは初期状態 hidden。結果が1件以上あれば hidden を解除して表示する。
 *
 * @extends {Component}
 */
class RecentlyViewedProducts extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.#render();
  }

  async #render() {
    const sectionId = this.dataset.sectionId;
    if (!sectionId) return;

    const currentProductId = this.dataset.currentProductId;
    const viewedIds = RecentlyViewed.getProducts().filter((id) => id !== currentProductId);
    if (viewedIds.length === 0) return;

    const url = new URL(Theme.routes.search_url, location.origin);
    url.searchParams.set('q', viewedIds.map((/** @type {string} */ id) => `id:${id}`).join(' OR '));
    url.searchParams.set('resources[type]', 'product');

    let html;
    try {
      html = await sectionRenderer.getSectionHTML(sectionId, false, url);
    } catch (error) {
      return;
    }

    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const newGrid = parsed.querySelector('[data-recently-viewed-grid]');
    const currentGrid = this.querySelector('[data-recently-viewed-grid]');

    if (!newGrid || !currentGrid || newGrid.children.length === 0) return;

    currentGrid.replaceWith(newGrid);
    this.hidden = false;
  }
}

if (!customElements.get('recently-viewed-products-component')) {
  customElements.define('recently-viewed-products-component', RecentlyViewedProducts);
}
