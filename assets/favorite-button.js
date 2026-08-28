import { Component } from '@theme/component';

/**
 * 商品ページの「お気に入り」トグルボタン（blocks/favorite-button.liquid）の挙動を担当する
 * Web Component（新規・2026-08-27、feature/favorite-productsブランチ）。
 *
 * customer-sync.js と同じ共有トークン方式で、データ系（D:\Inetpub\shopify_data）実装の
 * toggle_favorite.cfm を呼び出す。サーバーが返す `favorited` の値を信頼して見た目を更新する
 * （楽観的更新は行わない）。ログイン済みの場合のみこのコンポーネントが描画される
 * （未ログイン時はblocks/favorite-button.liquid側でAPIを呼ばない通常リンクとして描画される）。
 *
 * @typedef {Object} FavoriteButtonRefs
 * @property {HTMLButtonElement} toggleButton
 * @property {HTMLElement} message
 *
 * @extends {Component<FavoriteButtonRefs>}
 */
class FavoriteButton extends Component {
  requiredRefs = ['toggleButton', 'message'];

  // customer-sync.js と同一の共有トークン（データ系了承済み・本番公開前に恒久的な認証方式への
  // 切替を推奨、詳細は D:\Inetpub\HANDOFF.md 参照）
  static TOKEN = 'bee15c758842afe80a460a8d1d899e88323163105c99946f';
  static ENDPOINT = 'https://www2.cosmetic-times.com/Manage/shopify/toggle_favorite.cfm';

  #busy = false;

  /**
   * @param {Event} event
   */
  toggle = async (event) => {
    event.preventDefault();
    if (this.#busy) return;

    const customerId = this.dataset.customerId;
    const productId = this.dataset.productId;
    if (!customerId || !productId) return;

    const { toggleButton, message } = this.refs;

    this.#busy = true;
    toggleButton.disabled = true;
    message.classList.add('hidden');
    message.textContent = '';

    const params = new URLSearchParams({
      token: FavoriteButton.TOKEN,
      customer_id: customerId,
      product_id: productId,
    });

    try {
      const response = await fetch(`${FavoriteButton.ENDPOINT}?${params.toString()}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) throw new Error('toggle_favorite request failed');

      const data = await response.json();

      if (!data.ok) throw new Error(data.error || 'toggle_favorite returned ok:false');

      this.#applyFavorited(Boolean(data.favorited));

      if (data.limit_reached) {
        message.textContent = message.dataset.limitText ?? '';
        message.classList.remove('hidden');
      }
    } catch (error) {
      message.textContent = message.dataset.errorText ?? '';
      message.classList.remove('hidden');
    } finally {
      toggleButton.disabled = false;
      this.#busy = false;
    }
  };

  /**
   * @param {boolean} favorited
   */
  #applyFavorited(favorited) {
    this.dataset.favorited = String(favorited);
    this.classList.toggle('is-favorited', favorited);

    const { toggleButton, message } = this.refs;
    toggleButton.setAttribute('aria-pressed', String(favorited));
    toggleButton.setAttribute('aria-label', favorited ? 'お気に入りから削除' : 'お気に入りに追加');

    const label = toggleButton.querySelector('.favorite-button__label');
    if (label) {
      label.textContent = favorited ? 'お気に入り登録済み' : 'お気に入りに追加';
    }

    // 上限到達メッセージ以外は、状態が正常に切り替わったら非表示に戻す
    if (!message.dataset.limitText || message.textContent !== message.dataset.limitText) {
      message.classList.add('hidden');
    }
  }
}

if (!customElements.get('favorite-button-component')) {
  customElements.define('favorite-button-component', FavoriteButton);
}
