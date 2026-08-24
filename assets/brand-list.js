/**
 * ブランド一覧ページ（sections/brand-list.liquid）の挙動を担当するスクリプト。
 * 新規・2026-08-24（tasks/20260824-brand-list-page/spec.md）。
 *
 * 役割:
 *  1. Shopifyのcollectionsオブジェクトはpaginateで最大250件までしか一度に取得できないため
 *     （sections/main-collection.liquidに記録済みの既知の上限と同じ）、SSRされた1ページ目
 *     （先頭250件）以外の残りページをSection Rendering API（?section_id=...&page=N）経由で
 *     取得し、透過的にグリッドへ追加する。
 *  2. custom.kanaの先頭1文字から五十音の行（ア行〜ワ行、判定不能は「他」）をこのスクリプト側で
 *     判定する。custom.initialは子音を含むケースの仕様が未確定のため使用しない。
 *  3. 日本語/英語の表示切替（五十音タブ⇔A-Zタブの切替、ブランド名表示・並び順の切替）。
 *  4. 五十音/アルファベットタブによる絞り込み表示。
 *
 * JSが読み込まれない・失敗した場合でも、SSRされた1ページ目分のブランドはリンク・ロゴ・
 * 説明文が表示され続ける（絞り込み・並び替え・2ページ目以降の追加取得のみが効かなくなる）。
 */
(function () {
  'use strict';

  var root = document.querySelector('.brand-list-page');
  if (!root) return;

  var grid = root.querySelector('[data-brand-grid]');
  if (!grid) return;

  var emptyState = root.querySelector('[data-brand-empty]');

  // --- カナ1文字 → 五十音の行(gyou)判定テーブル ---
  var KANA_ROWS = {
    a: 'アイウエオァィゥェォヴ',
    ka: 'カキクケコガギグゲゴヵヶ',
    sa: 'サシスセソザジズゼゾ',
    ta: 'タチツテトダヂヅデドッ',
    na: 'ナニヌネノ',
    ha: 'ハヒフヘホバビブベボパピプペポ',
    ma: 'マミムメモ',
    ya: 'ヤユヨャュョ',
    ra: 'ラリルレロ',
    wa: 'ワヲンヮ',
  };

  var KANA_ROW_MAP = buildKanaRowMap();

  function buildKanaRowMap() {
    var map = {};
    Object.keys(KANA_ROWS).forEach(function (key) {
      KANA_ROWS[key].split('').forEach(function (ch) {
        map[ch] = key;
      });
    });
    return map;
  }

  // ひらがな → カタカナ変換（custom.kanaがひらがなで入っているケースにも対応するため）
  function toKatakana(ch) {
    var code = ch.charCodeAt(0);
    if (code >= 0x3041 && code <= 0x3096) {
      return String.fromCharCode(code + 0x60);
    }
    return ch;
  }

  function kanaRowOf(kana) {
    if (!kana) return 'other';
    var ch = toKatakana(kana.trim().charAt(0));
    return KANA_ROW_MAP[ch] || 'other';
  }

  function getCards() {
    return Array.prototype.slice.call(grid.querySelectorAll('[data-brand-card]'));
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
        var remoteGrid = doc.querySelector('[data-brand-grid]');
        if (!remoteGrid) return;
        var cards = remoteGrid.querySelectorAll('[data-brand-card]');
        cards.forEach(function (card) {
          grid.appendChild(card);
        });
      })
      .catch(function () {
        // ネットワークエラー時は取得できたページ分だけで表示を続行する（全体を止めない）
      });
  }

  function sortCards(lang) {
    var cards = getCards();
    cards.sort(function (a, b) {
      var aKey;
      var bKey;
      if (lang === 'en') {
        aKey = (a.getAttribute('data-en-name') || a.getAttribute('data-ja-name') || '').toLowerCase();
        bKey = (b.getAttribute('data-en-name') || b.getAttribute('data-ja-name') || '').toLowerCase();
      } else {
        aKey = a.getAttribute('data-kana') || a.getAttribute('data-ja-name') || '';
        bKey = b.getAttribute('data-kana') || b.getAttribute('data-ja-name') || '';
      }
      return aKey.localeCompare(bKey, lang === 'en' ? 'en' : 'ja');
    });
    cards.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  function setActiveIndexButton(activeBtn) {
    var group = activeBtn.closest('[data-index-group]');
    if (!group) return;
    var buttons = group.querySelectorAll('[data-index-btn]');
    buttons.forEach(function (btn) {
      var isActive = btn === activeBtn;
      btn.classList.toggle('is-active', isActive);
    });
  }

  function applyFilter(row) {
    var lang = root.getAttribute('data-lang') || 'ja';
    var attr = lang === 'en' ? 'data-row-en' : 'data-row-ja';
    var visibleCount = 0;
    getCards().forEach(function (card) {
      var isAll = row === 'all';
      var matches = isAll || card.getAttribute(attr) === row;
      card.hidden = !matches;
      if (matches) visibleCount++;
    });
    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  function currentActiveRow() {
    var lang = root.getAttribute('data-lang') || 'ja';
    var group = root.querySelector('[data-index-group="' + lang + '"]');
    if (!group) return 'all';
    var activeBtn = group.querySelector('[data-index-btn].is-active');
    return activeBtn ? activeBtn.getAttribute('data-row') : 'all';
  }

  function setLang(lang) {
    root.setAttribute('data-lang', lang);

    root.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('is-active', isActive);
    });

    var jaGroup = root.querySelector('[data-index-group="ja"]');
    var enGroup = root.querySelector('[data-index-group="en"]');
    if (jaGroup) jaGroup.hidden = lang !== 'ja';
    if (enGroup) enGroup.hidden = lang !== 'en';

    // 言語切替時はタブ選択を「すべて」にリセットする（別言語のタブ状態を持ち越さないため）
    var groupToReset = lang === 'en' ? enGroup : jaGroup;
    if (groupToReset) {
      var allBtn = groupToReset.querySelector('[data-row="all"]');
      if (allBtn) setActiveIndexButton(allBtn);
    }

    sortCards(lang);
    applyFilter('all');
  }

  function bindControls() {
    root.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang-btn'));
      });
    });

    root.querySelectorAll('[data-index-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActiveIndexButton(btn);
        applyFilter(btn.getAttribute('data-row'));
      });
    });
  }

  function init() {
    getCards().forEach(function (card) {
      var kana = card.getAttribute('data-kana');
      card.setAttribute('data-row-ja', kanaRowOf(kana));
      if (!card.getAttribute('data-row-en')) {
        card.setAttribute('data-row-en', 'other');
      }
    });

    bindControls();
    sortCards('ja');
    applyFilter(currentActiveRow());
  }

  var totalPages = parseInt(grid.getAttribute('data-total-pages'), 10) || 1;
  var pageUrl = grid.getAttribute('data-page-url') || window.location.pathname;
  var sectionId = grid.getAttribute('data-section-id');

  if (totalPages > 1 && sectionId) {
    fetchRemainingPages(totalPages, pageUrl, sectionId).then(init);
  } else {
    init();
  }
})();
