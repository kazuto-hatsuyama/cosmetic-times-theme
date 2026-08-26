/**
 * 特集一覧ページ（sections/feature-list.liquid）の挙動を担当するスクリプト。
 * 新規・2026-08-26（tasks/20260826-feature-list-page/spec.md）。
 *
 * 役割:
 *  Shopifyのcollectionsオブジェクトはpaginateで最大250件までしか一度に取得できないため
 *  （sections/main-collection.liquid・sections/brand-list.liquidに記録済みの既知の上限と同じ）、
 *  SSRされた1ページ目（先頭250件）以外の残りページをSection Rendering API
 *  （?section_id=...&page=N）経由で取得し、透過的にグリッドへ追加する。
 *  絞り込み・並び替えは行わない（brand-listの五十音/A-Zタブのような機能は特集一覧では不要と
 *  依頼元から明示されているため）。
 *
 * JSが読み込まれない・失敗した場合でも、SSRされた1ページ目分の特集はリンク・画像・説明文が
 * 表示され続ける（2ページ目以降の追加取得のみが効かなくなる）。
 */
(function () {
  'use strict';

  var root = document.querySelector('.feature-list-page');
  if (!root) return;

  var grid = root.querySelector('[data-feature-grid]');
  if (!grid) return;

  var emptyState = root.querySelector('[data-feature-empty]');

  function getCards() {
    return Array.prototype.slice.call(grid.querySelectorAll('[data-feature-card]'));
  }

  function fetchRemainingPages(totalPages, pageUrl, sectionId) {
    var requests = [];
    for (var page = 2; page <= totalPages; page++) {
      requests.push(fetchPage(pageUrl, sectionId, page));
    }
    return Promise.all(requests);
  }

  function fetchPage(pageUrl, sectionId, page) {
    var sep = pageUrl.indexOf('?') > -1 ? '&' : '?';
    var url = pageUrl + sep + 'section_id=' + encodeURIComponent(sectionId) + '&page=' + page;

    return fetch(url)
      .then(function (response) {
        return response.ok ? response.text() : '';
      })
      .then(function (html) {
        if (!html) return;
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var remoteGrid = doc.querySelector('[data-feature-grid]');
        if (!remoteGrid) return;
        var cards = remoteGrid.querySelectorAll('[data-feature-card]');
        cards.forEach(function (card) {
          grid.appendChild(card);
        });
      })
      .catch(function () {
        // ネットワークエラー時は取得できたページ分だけで表示を続行する（全体を止めない）
      });
  }

  function updateEmptyState() {
    if (!emptyState) return;
    emptyState.hidden = getCards().length !== 0;
  }

  var totalPages = parseInt(grid.getAttribute('data-total-pages'), 10) || 1;
  var pageUrl = grid.getAttribute('data-page-url') || window.location.pathname;
  var sectionId = grid.getAttribute('data-section-id');

  if (totalPages > 1 && sectionId) {
    fetchRemainingPages(totalPages, pageUrl, sectionId).then(updateEmptyState);
  } else {
    updateEmptyState();
  }
})();
