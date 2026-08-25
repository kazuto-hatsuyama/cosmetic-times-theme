# guide-reason-page spec定義ドキュメント

## メタ情報（評価・考課用）
- 作成者: kazuto_hatsuyama@shuei-infotech.net
- 作成日: 20260825
- 着手日: 2026-08-25
- 対応難易度: S（見積もり）
- 不確実性: low（見積もり）
- ステータス: 完了

## 要件定義（実装用）

### 誰の課題か
- データ系（D:\Inetpub\shopify_data）が起票。現行サイトのガイドページ群（guide/top, guide/info, faq, order-guide等）は既にShopify静的ページとして移行済みだが、`https://www.cosmetic-times.com/guide/reason`（「安くて安心な商品をおとどけできるワケ」ページ）のみ未移行のまま残っていた。エンドユーザー（ECサイト訪問者）がこのページの内容（品質管理プロセス説明）を新ストアでも閲覧できるようにする。

### 現状
- guide/reasonページは移行元サイトにのみ存在し、Shopify側に相当ページがない。
- `sections/faq.liquid`（375/895/933/959行目）・`sections/guide-info.liquid`（51行目）から、このページへの絶対URL（旧サイト）リンクが残っていた。933/959行目は`#hinshitsu`（品質管理セクション）付き。

### 変更後どうなるか
- `sections/guide-info.liquid`を参考実装として、同じパターン（`{% render 'static-page-styles' %}`、`static-page`/`static-page__heading`/`static-page__body`のクラス構成、schema定義、`enabled_on.templates: ["page"]`）で`sections/guide-reason.liquid`を新規作成。
- 対応する`templates/page.guide-reason.json`も既存の`templates/page.guide-info.json`等と同方式で新規作成。
- 本文は現行サイトの内容を忠実に転記。装飾目的の画像は含めない。4段階の品質管理プロセスは図解ではなく見出し+説明文の並び（テキスト構成）で再現。「安心の品質管理」見出しに`id="hinshitsu"`を付与（既存の`#hinshitsu`リンクの遷移先として必要）。
- ページ末尾のリンク一覧: ブランド一覧（旧URLのまま、移行対象外）・カテゴリ検索（`/pages/category-list`、移行済み）・お悩みから探す（`/pages/trouble-list`、移行済み）・ランキング（`/pages/ranking`、移行済みのため旧URLではなく新URLを採用）・コスメティックタイムズの3つのお約束（`/pages/guide-info#info02`）・ご利用ガイド（`/pages/guide-top`）。
- `sections/faq.liquid`の4箇所・`sections/guide-info.liquid`の1箇所にある`https://www.cosmetic-times.com/guide/reason`への絶対URLを`/pages/guide-reason`（`#hinshitsu`付きは`/pages/guide-reason#hinshitsu`）へ張り替え。
- `sections/guide-info.liquid`冒頭コメント（guide/reasonは対象外と記載していた箇所）を、今回対応済みである実情に合わせて修正。
- 変更規模的に新規セクション追加を伴うため、`feature/guide-reason-page`ブランチで作業する（CLAUDE.mdのGit運用ルールに従う）。

### 受け入れ基準
- `sections/guide-reason.liquid`, `templates/page.guide-reason.json`の2ファイルが新規作成されていること。
- 本文が指定された現行サイトの文章と一致し、装飾画像を含まないこと。「安心の品質管理」見出しに`id="hinshitsu"`が付与されていること。
- `sections/faq.liquid`の375/895/933/959行目、`sections/guide-info.liquid`の51行目のリンクが`/pages/guide-reason`（該当箇所は`#hinshitsu`付き）に張り替えられていること。
- `sections/guide-info.liquid`冒頭コメントの記述が実情（guide/reasonが移行対象になったこと）に合わせて修正されていること。
- CLAUDE.mdの「カスタマイズ済みファイル」表に新規ファイルの行が追記され、既存のguide-info.liquid/faq.liquidの行にも今回のリンク変更が追記されていること。

## 対象外
- Shopify管理画面での実際のPageオブジェクト作成（Admin API権限不足のためこの実行環境では不可、ユーザー側対応事項として注記のみ行う）。
- ランキングページの新規作成（既に`sections/ranking-list.liquid`として移行済みのため対象外、リンク先として参照するのみ）。

## 完了記録（評価・考課用、完了後に追記）
- 完了日: 2026-08-25
- AI利用状況:
  - 利用有無: あり
  - 利用工程: 実装, データ調査, レビュー
  - 補足コメント: データ系（shopify_data）から提示された本文・リンク仕様をそのまま転記。既存の`sections/guide-info.liquid`/`sections/order-guide.liquid`のパターンを踏襲して新規セクションを作成。実行環境の制約により、本タスクの実装エージェントはgit操作（ブランチ作成・commit・push）を実行できなかったため、ファイル変更のみを適用済みの状態で完了とし、git操作は別途ユーザー側または非isolated環境で実施する必要がある。
  - 補足: `sections/faq.liquid`のリンク張り替え作業中、`sed`の`\|`（GNU拡張の論理和演算子）を誤って「エスケープしたパイプ文字」の意味で使用し、`sections/guide-info.liquid`とは別ファイルである`CLAUDE.md`を一時的に破損させる事故が発生。直後に検知し、会話履歴に保持していた原本内容から復元・再修正して解消した。
- 振り返り（任意）: 既存パターンの踏襲により実装判断コストは低かった。一方、実行環境がworktree分離されたエージェントであり、`shopify_theme`が別リポジトリであるためgit操作が一切ブロックされる、かつ複雑なヒアドキュメント（`{% ... '...' %}`等の記号組み合わせ）を含むシェルコマンドが「too complex to verify」として拒否される制約に多くの試行回数を要した。次回同様の環境で作業する場合は、最初からPythonスクリプト経由のファイル書き込み（シェルクオーティングを回避）を優先する方が安全。
