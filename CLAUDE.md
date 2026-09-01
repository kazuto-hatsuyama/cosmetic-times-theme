# CLAUDE.md — Shopify テーマ作業ディレクトリ

---

## ストア・テーマ情報

| 項目 | 値 |
|---|---|
| ストア | cosmetic-times-prd.myshopify.com（※将来の本番ストア。現時点では未公開の検証ストア。旧デプロイ先 cosmetic-times-dev.myshopify.com からは2026-07-23に切替） |
| 現行サイト（移行元） | https://www.cosmetic-times.com/ |
| テーマ名 | Horizon（liveテーマ） |
| テーマID | 138815832273 |

---

## GitHubリポジトリ

| 項目 | 値 |
|---|---|
| URL | https://github.com/kazuto-hatsuyama/cosmetic-times-theme |
| ブランチ | main |
| ローカルパス | D:\Inetpub\shopify_theme\ |

---

## データ系との連携（ハイブリッド運用、2026-08-19〜）

データ系（`D:\Inetpub\shopify_data`）とテーマ系（このインスタンス）は別セッションで直接会話できない。
そのため以下のハイブリッドで連携する。

- **具体的な実装依頼**（liquid修正・新機能追加など）は、データ系インスタンスが`Agent`ツールで
  このディレクトリをスコープにしたサブエージェントを直接起動してくることがある
  （このCLAUDE.mdを読んだ上で依頼してくる想定）。ユーザーが直接このセッションに指示する通常の
  作業フローと並行して発生しうる
- **すぐ着手しない情報共有・気づき・仕様確認**は `D:\Inetpub\HANDOFF.md` に非同期メモとして残る
  （「データ系 → テーマ系」セクション）。作業開始時、未対応項目がないか確認する
- データ系に伝えたいこと（実装した仕様・データ系側で対応が必要な内容・不具合報告等）は
  `HANDOFF.md`の「テーマ系 → データ系」セクション先頭に追記する
- 詳細は`HANDOFF.md`冒頭の使い方を参照

---

## ⚠️ 禁止事項（必ず守ること）

- **`shopify theme pull` は絶対実行禁止**
  （理由：index.json がShopify側の状態で上書きされ、カスタマイズが全て消える）
- **`backdrop-filter` はヘッダーに使用禁止**
- `type:hero` のCDN URLはJSONで直接指定不可（別の方法で対応すること）
- **大きな変更（セクション追加・CSS大幅変更など）はmain直pushではなく、featureブランチを切ってユーザー確認後にマージすること**
- **Liquidの`{% assign %}`（`{% liquid %}`ブロック内含む）で`==`等の比較演算子を直接使わない**
  （理由：`assign foo = bar == "baz"`はLiquid構文エラーになる。`shopify theme push --nodelete`はアセット単位でアップロード失敗しても**ジョブ全体は成功扱い（GitHub Actions上は緑✓）になり気づけない**。比較が必要な場合は`{% if bar == "baz" %}{% assign foo = true %}{% endif %}`のようにif文で分岐すること。デプロイ後は必ず実機で表示・動作を確認する）

## ⚠️ テーマ標準ファイルへの変更（上書きリスクあり）

以下のファイルは Horizon テーマ標準ファイルを改変したもの。Shopify管理画面でテーマをアップデートすると**上書きされて修正が消える**。アップデート後は必ず再適用すること。

| ファイル | 変更内容 |
|---|---|
| `assets/variant-picker.js` | `buildRequestUrl` に `data-section-id` フォールバックを追加（バリアント切り替え画像更新修正） |
| `assets/component-cart-items.js` | `onLineItemRemove` でカートが空になった際、`points_used`カート属性とディスカウントコードをクリアする処理を追加（2026-07-30）。同箇所で`delivery_date`/`delivery_time`/`delivery_box`カート属性もクリアするよう追加（2026-08-19。古い配送希望日が次回の注文に残らないようにするため） |
| `assets/cart-discount.js` | `applyDiscount`にクーポン適用時の`points_used`クリア処理を追加後、削除（2026-07-31。詳細は下記カスタマイズ済みファイル一覧参照） |
| `assets/quick-add.js` | クイック追加モーダルが商品ページのHTMLを流用する際、そのページ専用の`{% stylesheet %}` CSS（`compiled_assets/styles.css`のsubset）が現在のページに含まれておらずスタイル崩れが起きる問題を修正するため、取得した商品ページのstylesheetリンクを`<head>`に追加注入する処理を追加（2026-08-07） |
| `sections/product-information.liquid` | Shopify標準の`structured_data`フィルタ出力の直後に、`aggregateRating`補足JSON-LDを追加（2026-08-19。詳細は下記カスタマイズ済みファイル一覧参照） |
| `blocks/_header-menu.liquid` | デスクトップのメガメニュー/オーバーフローメニュー（`else`分岐）とモバイル用ナビゲーションバー（`navigation_bar`分岐）の末尾に、`/pages/ranking`（売れ筋ランキングページ）への固定リンク「ランキング」を追加（2026-08-21）。**2026-09-01: `navigation_bar`分岐に新着/セール/ブランド/カテゴリの固定リンクも追加**（詳細は下記カスタマイズ済みファイル一覧参照） |
| `snippets/header-drawer.liquid` | モバイルのヘッダードロワーメニュー（ハンバーガーメニュー）の末尾に、`/pages/ranking`への固定リンク「ランキング」を追加（2026-08-21）。**2026-09-01: 新着/セール/ブランド/カテゴリの固定リンクも追加**（詳細は下記カスタマイズ済みファイル一覧参照） |
| `sections/header.liquid` | ログイン中会員向け挨拶文＋ランク表示＋ログアウト（未ログイン時は会員登録訴求）の行（`header-member-bar-row`）を新規追加（2026-09-01。詳細は下記カスタマイズ済みファイル一覧参照） |

---

## 作業フロー

> ユーザーは指示を出すだけ。ファイル編集・コマンド実行はすべてClaudeが行う。

1. ユーザーが変更内容を指示
2. Claude がファイルを編集
3. Claude が `git add` / `commit` / `push` を実行
4. **2026-09-01〜: mainへのpushだけでは本番liveテーマへ自動反映されない**（下記「GitHub Actions 自動デプロイ」参照）。本番へ反映する場合は手動でワークフローを実行する

### Git運用ルール

| 変更規模 | 運用 |
|---|---|
| 軽微な修正（テキスト・色・軽微なCSS） | main 直push可 |
| 大きな変更（セクション追加・CSS大幅変更・構造変更） | `feature/` ブランチ作成 → ユーザー確認 → main にマージ |

コミットメッセージ形式:
```
fix: カートボタンのモバイル表示を修正
feat: ブランドマーキーセクションを追加
style: ヒーロースライドショーのフォントサイズ調整
```

---

## GitHub Actions 自動デプロイ

⚠️ **2026-09-01〜: mainへのpush/マージによる自動デプロイは停止中**（下記「トリガー」参照）。
理由: `feature/static-page-design-alignment`マージ（コミット`59912fe`）のpushが本番の
公開（live）テーマ（cosmetic-times-prd / テーマID 138815832273、`--allow-live`指定）へ
そのまま自動反映されてしまい、ユーザーから「mainへのpushだけでは本番liveテーマに
自動反映されないようにしてほしい」と明示的な依頼があったため、トリガーを
`push`から`workflow_dispatch`（手動実行）に変更した。

**本番へ反映したい場合の手動実行手順**:
```
gh workflow run "Deploy to Shopify" --ref main
```
または GitHub Actions画面（下記URL）→「Deploy to Shopify」→「Run workflow」ボタンから
`main`ブランチを指定して実行する。ワークフロー自体の内容（`shopify theme push --allow-live`
で本番liveテーマ 138815832273 へ反映する処理）は変更していない。

| 項目 | 内容 |
|---|---|
| 設定日 | 2026-05-21（push先を2026-07-23に cosmetic-times-prd へ切替）。**2026-09-01: トリガーをpush→workflow_dispatch（手動実行）に変更** |
| ファイル | `.github/workflows/deploy.yml` |
| トリガー | **手動実行のみ（`workflow_dispatch`）**。~~main ブランチへの push~~（2026-09-01廃止） |
| 認証 | GitHub Secrets に `SHOPIFY_CLI_THEME_TOKEN` 登録済み。**⚠️ トークンはストア単位で発行されるため、push先をprdストアに切り替えた際は、prdストア用のテーマアクセストークンに再登録が必要**（旧devストア用トークンのままだとpush失敗する） |
| Actions確認 | https://github.com/kazuto-hatsuyama/cosmetic-times-theme/actions |

**⚠️ 重要な仕様: `config/settings_data.json` はこの自動デプロイでライブテーマに同期されない**（2026-08-04判明）。`shopify theme push`（`--only`なしのフルpush）は、ライブ（公開中）テーマに対してマーチャントの管理画面編集を保護するため`config/settings_data.json`を自動ではアップロードしない。そのため、2026-07-23のdev→prdストア切替以降、Git管理下のカラースキーム定義（`scheme-1`等・タイポグラフィ・ロゴ設定を含む）が長期間ライブに反映されていなかった不具合が発生した（詳細は下記「色スキーム未反映」の顛末を参照）。`config/settings_data.json`を変更した場合は、必ずローカルから明示的に以下を実行して同期すること：
```
shopify theme push --only "config/settings_data.json" --allow-live --theme 138815832273 --store cosmetic-times-prd.myshopify.com
```
実行前に必ずAdmin Theme Customizer（テーマ設定）で現状を確認し、他の設定を上書きしないか確認すること。

---

## サイト概要・デザイン方針

| 項目 | 内容 |
|---|---|
| 業種 | 化粧品EC（デパコス・ブランドコスメ） |
| ターゲット | 30〜50代女性 |
| ブランド方向性 | 高級感・デパコス（クリームホワイト×ゴールド、明るい高級感） |
| 取扱ブランド数 | 151ブランド（CHANEL, DIOR, SHISEIDO 等） |

---

## トップページ構成（templates/index.json）

現在のセクション順（2026-05-22 リニューアル後）:

1. ヒーロースライドショー（hero_jVaWmY）
2. カテゴリナビ（category_grid）
3. 商品一覧（product_list_fa6P9H）
4. ブランドマーキー（marquee_brands）
5. プロモーションバナー（promo_banners）

---

## カスタマイズ済みファイル

※ファイルを追加・変更したら必ずこのリストも更新すること

| ファイル | 内容 |
|---|---|
| `assets/custom-luxury.css` | Luxury Design System v4.0（section19 は object-fit:cover） |
| `assets/variant-picker.js` | バリアント切り替え画像更新修正（※テーマ更新で上書きリスク） |
| `sections/product-list.liquid` | 在庫あり優先ソート・スキーマ修正3件（2026-06-10）。売り切れ商品を薄く表示する2パス目のフォールバックを削除し、在庫あり商品のみ表示に変更（2026-08-03）。`visible_if`の括弧によるLiquid構文エラーを分配形に書き換えて解消（2026-08-03。詳細は下記参照） |
| `sections/main-collection.liquid` | カテゴリ一覧ページの商品グリッドループに`product.available`チェックを追加し、売り切れ商品を非表示に変更（新規・2026-08-03）。上記チェックがAvailabilityフィルター（在庫あり/在庫切れチェックボックス）を無効化していた不具合を修正 — `collection.filters`でAvailabilityフィルターが明示的に選択されているか判定し、選択時はShopify側の絞り込み結果をそのまま表示、未選択時（デフォルト）のみ`product.available`で追加フィルタするよう変更（2026-08-03）。デフォルト表示時の「n個のアイテム」件数表示を、コレクション全体の在庫あり件数に修正（`{% paginate collection.products by 1000 %}`の専用カウント用パスで算出。`collection.products`はpaginateタグ外だと50件でキャップされるため。**既知の制約**: paginateの上限が1000件のため、1000件を超えるコレクション（例: 全商品「all」＝3,100件）は先頭1000件分までしか集計されず、件数が実際より少なく出る。1ページあたりの表示件数が`products_per_page`設定より少なくなる場合がある点も既知の制約として残る、2026-08-03）。**2026-08-06: Availabilityフィルターの絞り込み結果自体がShopify側の既知の不具合で誤っている（表示件数だけでなく実際に返る商品リストが壊れている）ことが判明したため、Shopify標準のAvailabilityフィルターに一切依存しない実装に変更**（詳細は`snippets/availability-toggle-filter.liquid`の項・`tasks/20260806-custom-availability-filter/spec.md`参照）。全商品を常にレンダリングし`data-product-available`属性を付与、在庫あり/在庫切れの正確な件数を`{% paginate collection.products by 1000 %}`で常時算出して`filters`ブロックへ渡すよう変更。旧`filter.v.availability`パラメータが付いた古いリンクを検知して自動的にURLから除去・リロードする自己修復スクリプトを追加。**2026-08-07: 在庫あり・在庫切れ両方表示時、コレクション全体（最大1000件）を`available`/`where: 'available', false`+`concat`で「在庫あり→在庫切れ」の順に並び替えてからページ分割するよう変更**（ページの境目をまたいでも在庫ありが先に来る。各グループ内の相対順序はコレクションのソート設定を維持。詳細は`tasks/20260807-collection-availability-sort/spec.md`参照）。**2026-08-07（再修正）: Shopifyの`paginate`タグは`by`の指定値に関わらず実際の上限が250件と判明**（上記「1000件」という前提は誤りだった）。250件を超えるコレクション（「商品」全商品=3,100件等）では、上記の全件ソート用配列がpaginate不可と判定されLiquidランタイムエラー（`Array 'sorted_products' is not paginateable`）が発生し、251件目以降が一覧から欠落していたため、`paginate.items`で算出した総件数が250件を超える場合（`large_collection`）は全件ソート・件数集計を諦め、実際にpaginate可能な`collection.products`を使ったページ単位のみのソート・`paginate.items`による正確な合計件数に切り替えるよう分岐を追加（250件以下は従来通り）。詳細は`tasks/20260807-large-collection-pagination-fix/spec.md`参照 |
| `blocks/filters.liquid` | Availabilityフィルター（`param_name`に`availability`を含むもの）をShopify標準の`list-filter`ではなく独自スニペット`availability-toggle-filter`で描画するよう分岐追加。件数表示（「n個のアイテム」）を新スニペット`collection-item-count`経由に変更し、在庫あり/在庫切れ/両方の3状態をJSで切り替え可能に（新規・2026-08-06。`sections/search-results.liquid`など`available_count`/`unavailable_count`を渡さない他の呼び出し元向けに、渡されない場合は従来の`results_size`にフォールバックする安全策あり）。**2026-08-07: `counts_unknown`パラメータを追加**（250件超コレクションでは在庫あり/在庫切れの正確な内訳が算出できないため、件数を偽らず`available_count`/`unavailable_count`を渡さないことを明示するフラグ。`availability-toggle-filter`へ伝播）。**2026-08-07（追加修正）: 「n個のアイテム」件数表示自体を、コレクションサイズを問わず一旦全て非表示に**（`{% render 'collection-item-count', ... %}`を`{% comment %}`でコメントアウト。250件超で在庫あり/在庫切れを切り替えても件数が変わらないことがバグに見えるとの指摘のため。フィルタリング機能自体は維持。詳細は`tasks/20260807-large-collection-pagination-fix/spec.md`参照） |
| `snippets/availability-toggle-filter.liquid` | Shopify標準のAvailabilityフィルター（在庫状況の絞り込み）が内部同期の既知の不具合により絞り込み結果自体を誤って返す問題（Shopifyサポートに既知の不具合と認定・恒久修正なし、セルフ回避策も無効と確認済み）に対応するため、`filter.v.availability`というShopify認識パラメータを一切使わない独自の在庫あり/在庫切れチェックボックスを新規作成（2026-08-06）。実際の絞り込みは全て`assets/availability-toggle-filter.js`によるクライアントサイド処理（`product.available`ベース、確実に信頼できる）で行う。**2026-08-07: チェックボックス横の「(N)」件数表記を削除**（250件超コレクションでは正確な内訳が算出できず、250件以下でも上部の「n個のアイテム」表示と数字が重複するため、コレクションサイズを問わず統一してラベルのみ表示に変更。`counts_unknown`時は件数ベースの`disabled`判定もスキップ） |
| `snippets/collection-item-count.liquid` | 「n個のアイテム」表示を在庫あり/在庫切れ/両方の3状態分あらかじめ翻訳付きでレンダリングしておき、JS側でどれを表示するか切り替えるための新規スニペット（Shopifyの件数複数形ルールをJSで再実装せずに済むため、2026-08-06） |
| `assets/availability-toggle-filter.js` | 上記Availabilityフィルター独自実装のクライアントサイド挙動を担当する新規Web Component（新規・2026-08-06）。チェックボックス変更時の即時表示切り替え、`avail_show_available`/`avail_show_unavailable`という2つの独立したbool値によるURL同期を担当。**⚠️ 重要な実装知見（2026-08-06）**: Horizon標準の`assets/morph.js`はSection Rendering APIのレスポンスを`DOMParser`（不活性なdocument）でパースするため、生成される要素はカスタム要素として実際のクラスにアップグレードされず、`assets/component.js`の`updatedCallback()`ライフサイクルフックはセクション再描画後に一度も呼ばれない（`onAfterUpdate`内の`node instanceof Component`判定が常にfalseになるため）。この制約はHorizonのモーフ機構自体の仕様であり、他のカスタム要素で同様の「再描画後に自前の状態を復元する」実装をする場合にも影響しうる。本ファイルでは`updatedCallback()`に頼らず、`ThemeEvents.FilterUpdate`イベント（`assets/events.js`、どのフィルター変更でも発火）を`document`レベルで購読し、数秒間にわたり複数回`document`から実際に表示されている要素を探して状態を再適用する方式で対応している。**2026-08-07: 在庫あり/在庫切れ両方チェック時に、共通の`facet-status-component`（絞り込み中の件数を示すバッジ）へチェック済み入力をそのまま渡していたため「2」と表示されてしまう不具合を修正**。`getEffectiveKey`が'all'（両方 or どちらもチェックなし＝絞り込みなしと同義）を返す場合は空配列を渡し、バッジを非表示にするよう変更 |
| `templates/index.json` | トップページ全体リニューアル・ctFade修正・h1→h2 |
| `templates/product.json` | icons_style を "arrow" に修正・説明文ブロックを product-description タイプに変更（2026-06-10）。`hide_variants`を無効化し、全バリアントの画像を常にギャラリーに表示するよう変更（2026-08-04、下記参照）。"main"セクションの`color_scheme`が空文字になっておりバリアント選択の色分け・売り切れ表示が効かなくなっていたため`"scheme-1"`に修正（2026-08-04）。→ この修正だけではライブに反映されず、真因は`config/settings_data.json`がライブテーマに一度も同期されていなかったこと（カラースキームの実体が未定義）と判明。`--only`指定で個別pushして解決（2026-08-04、詳細は本ファイル冒頭「GitHub Actions 自動デプロイ」参照）。**2026-08-07: `slideshow_mobile_controls_style`を"counter"→"thumbnails"に変更**し、SP版商品詳細ページでもPC版と同じくサムネイル表示になるよう統一（`tasks/20260807-unify-gallery-desktop-style/spec.md`参照） |
| `snippets/product-media-gallery-content.liquid` | 商品詳細ページのメイン画像スクロール矢印が表示されるのに反応しない不具合を修正（2026-08-04）。`hide_variants`設定が有効かつ全画像がバリアント専用（共通画像なし）の商品では実際の表示枚数が1枚になるが、矢印・サムネイル表示判定がhide_variants適用前の生の画像枚数（`selected_product.media.size`）を見ていたため矢印だけ表示され続けていた。判定をフィルタ後の`sorted_media.size`に統一。各スライドに、対応するバリアントの`featured_media`と一致する場合`data-variant-id`属性を付与する新機能を追加（画像スクロールでバリアントを自動選択、2026-08-04）。**2026-08-07: スライド送り矢印から`mobile:hidden`クラスを削除**し、SP幅でも矢印を表示するよう変更（PC版と統一） |
| `snippets/quick-add-modal-styles.liquid` | クイック追加モーダル専用に、画像ギャラリーを縦積み表示にする独自CSS（矢印非表示・サムネイル非表示・スクロール無効化・`pointer-events: none`による操作無効化）が入っていたが、2026-08-04の`hide_variants`無効化により全バリアントの画像が同時に縦積み表示されてしまう不具合の原因となっていたため、これらの上書きCSSを撤去（2026-08-07）。これにより商品詳細ページのデフォルトのスライドショー挙動（矢印・サムネイル表示、スライド送り・サムネイルクリック・カラーボタンでの連動）がモーダル内でもPC/SP問わずそのまま機能するようになる（`tasks/20260807-quick-add-variant-image-fix/spec.md`, `tasks/20260807-unify-gallery-desktop-style/spec.md`参照）。選択中サムネイルの枠線（`outline`、`currentcolor`参照）がモーダルの配色設定の影響で白くなり見えなくなっていたため、`color`をテーマの前景色に固定。`assets/quick-add.js`が注入する商品ページ側の別スタイルシートが後から読み込まれ同等以上の詳細度で上書きしてくるため、`!important`で確実に効かせている（2026-08-07） |
| `assets/media-gallery.js` | ユーザー操作（スクロール・ドラッグ・クリック）によるスライド変更時、表示中スライドに`data-variant-id`があれば対応するバリアントピッカーのラジオを自動選択し、価格・在庫状況・カートボタンを連動更新する機能を追加（新規・2026-08-04）。バリアント変更のたびにギャラリー自体を丸ごと置き換えると、選択中バリアントの画像が先頭に並び替わりスクロール位置がリセットされる不具合があったため、ギャラリースクロール自身が引き金となった変更の場合はギャラリーの置き換えをスキップするよう修正（2026-08-04） |
| `snippets/quick-add-styles.liquid` | 商品一覧カード（ホバー時表示の丸型「カートに追加」ボタン）でカートアイコンが白背景に白色になり見えなくなっていた不具合を修正（2026-08-07）。ボタン自体は`color: var(--color-foreground)`を正しく指定していたが、`assets/custom-luxury.css`の`[class*="quick-add"] button { color: #fff !important }`（本来はモーダル内の大きい「カートに追加する」ボタン向け）がセレクタが広すぎてこの丸型ボタンにも適用されてしまっていた。`!important`を追加し`--add`/`--choose`修飾クラス込みの詳細度で確実に上書きするよう修正 |
| `snippets/variant-main-picker.liquid` | インポート商品の一部で、バリアントが実質1つのみ（Shopify内部の英語プレースホルダーではなく日本語の literal な「タイトル」/「デフォルト」がオプション名・値として保存されている）にもかかわらず、`has_only_default_variant`が`false`と判定されバリアントピッカー（`variant_style: buttons`設定によりフィールドセット+ボタンとして描画）が表示されてしまう不具合を修正（2026-08-04）。オプション名が`タイトル`かつオプション値・バリアントが1つのみの場合を`has_only_default_variant`同様に扱い、バリアントピッカー全体を非表示にするよう変更 |
| `layout/theme.liquid` | Google Fonts + custom-luxury.css 追加。`{% render 'customer-sync' %}` 追加（2026-07-24） |
| `snippets/cart-summary.liquid` | ポイント使用検証UI追加（入力欄+適用ボタン、`points_used`カート属性セット）（2026-07-23）。保有ポイント/カート合計をdata属性で渡すよう追加（2026-07-30）。`cart-points-component`に`data-section-id`追加（2026-07-30）。`cart-points.js`のscriptタグを削除しグローバル読み込みへ移行（2026-07-30、下記参照）。ポイント上限チェックの`data-cart-subtotal`単位不一致（セント/円）を修正（2026-07-31）。ポイント入力欄の表示値を、Function（`cosmetic-discount`）と同じランク割引・上限計算式で独立に再計算しキャップするよう修正（`cart.total_price`からの逆算はキャップ時に0にフロアされ機能しないため、`cart.items_subtotal_price`ベースで再現、2026-07-31）。上記キャップ計算にクーポン割引額（cart-level・line-level のdiscount_code割引合算）も考慮するよう追加修正（2026-07-31） |
| `assets/cart-points.js` | 上記UIのAjax Cart API呼び出し処理（新規・2026-07-23）。入力値バリデーション（保有ポイント超過・カート合計超過・不正な数値）を追加（2026-07-30）。適用後にセクションを再取得し小計・ディスカウント行・見積もり合計をその場で再描画するよう修正（2026-07-30） |
| `assets/component-cart-items.js` | カートが空になった際に`points_used`属性・ディスカウントコードをクリア（2026-07-30・※テーマ更新で上書きリスク）。同処理で`delivery_date`/`delivery_time`/`delivery_box`属性もクリアするよう追加（2026-08-19） |
| `assets/cart-discount.js` | クーポン適用時に`points_used`を強制クリアする処理を追加（2026-07-30）→**削除（2026-07-31）**。理由: 当初はクーポン+ポイント併用時の入力欄表示値を正しく計算するのが困難だったための暫定対応だったが、`cart-summary.liquid`にクーポン考慮のキャップ計算を実装したことで不要になった。現在はクーポン適用時もポイントはクリアされず、適用可能な額に自動でキャップ表示される（併用は許可する方針・※テーマ更新で上書きリスク） |
| `snippets/scripts.liquid` | `cart-points.js`のグローバル読み込みを追加（2026-07-30）。理由: 元々`cart-summary.liquid`（カートが空でない時のみレンダリング）内にscriptタグがあり、カートが空の状態でページ読込→遷移せず商品追加すると、scriptタグがmorphでDOM挿入されるだけで実行されず`cart-points-component`が never upgrade にならない不具合があったため、`cart-discount.js`と同じくグローバル読み込みに変更 |
| `snippets/customer-sync.liquid` | ログイン顧客のポイント/ランク連携用データ埋め込み（新規・2026-07-24） |
| `assets/customer-sync.js` | 顧客ID/emailを外部エンドポイントへ送信（セッション中1回・tokenベタ書き、新規・2026-07-24）。**2026-08-28: 送信先`ENDPOINT`をngrok無料枠URL（`https://arnulfo-fordable-pipingly.ngrok-free.dev/...`）から本番URL`https://www2.cosmetic-times.com/Manage/shopify/link_customer.cfm`へ変更**（`feature/switch-to-production-endpoint`ブランチ）。お気に入り機能の実装過程でngrok無料プランでは実際の登録動作がNGと判明したため、必要なCFM一式をユーザーが本番www2へ配置し、テーマ側の参照先もwww2へ切替。**2026-08-31: `ngrok-skip-browser-warning`ヘッダーを削除**（当初「本番URLでは不要だが実害はない」と判断していたが誤りで、この独自ヘッダーが原因でブラウザがCORSプリフライト(OPTIONS)を送信し、`toggle_favorite.cfm`/`link_customer.cfm`側がOPTIONSを考慮していないため実処理がプリフライト時に走った上で本来のGETがブロックされる不具合を実機確認で検出・修正） |
| `sections/breadcrumbs.liquid` | 商品詳細ページに「ホーム > コレクション名 > 商品名」形式のパンくずリストを表示する新規セクション（新規・2026-08-07、`templates/product.json`の`order`先頭に配置）。**判明した既知の制約**: このストアは`/collections/{handle}/products/{handle}`形式のURLを常に`/products/{handle}`へリダイレクトする設定になっており（原因はテーマコード外・管理画面のURLリダイレクト設定か何らかのSEOアプリと推測、未特定）、Shopify標準の`collection`オブジェクトがproductテンプレートで常に`nil`になる。そのため`collection`が`nil`の場合、`product.collections`から`all`ハンドルを除いた最初のコレクションを代表コレクションとして表示するフォールバックで対応している |
| `sections/footer.liquid`, `sections/footer-group.json` | フッターの「メールマガジン登録」欄一式（見出し・説明文・メールアドレス入力欄・送信ボタン）を、ログイン状態を問わず常時非表示に変更（2026-08-18）。データ系（`D:\Inetpub\shopify_data`）からの依頼: この送信がShopifyの`customers/create`イベントを発火させ、バックエンド側で意図しない重い処理（既存会員なら過去注文の一括同期、未登録メールなら新規会員レコード作成）を引き起こしていたため。当初は「ログイン中・未登録会員向けボタン化」で対応する予定で`blocks/newsletter-optin-button.liquid`を実装・デプロイしたが、Shopifyの新カスタマーアカウント機能（マイページ）に同等の「マーケティング設定」トグルが標準で用意されていることが判明したため不要となり撤去済み。`footer-group.json`の`footer_m9NzUG`セクションの`blocks`/`block_order`は空に変更（`footer_utilities_jLGE8U`＝著作権表示・利用規約・SNSリンクは変更なし） |
| `config/settings_data.json` | `cart_type`を`"drawer"`→`"page"`に変更（新規・2026-08-19）。カートアイコン押下時にドロワーを開かず`/cart`へ遷移させるための変更（`snippets/header-actions.liquid`側の分岐は既存のまま、設定値のみで挙動が切り替わる）。配送設定機能の新設定`show_delivery_options`/`delivery_lead_days`/`delivery_selectable_days`のデフォルト値も追加。**⚠️ このファイルはライブテーマへの自動デプロイで同期されない仕様のため、mainへのpush後、別途`--only`指定での個別pushが必要**（詳細は本ファイル冒頭「GitHub Actions 自動デプロイ」参照。タスク詳細: `tasks/20260819-cart-delivery-options/spec.md`） |
| `config/settings_schema.json` | カート設定グループに配送設定（お届け希望日・時間・宅配ボックス）の管理画面設定項目を追加（新規・2026-08-19）: `show_delivery_options`（表示有無）、`delivery_lead_days`（お届け希望日の選択肢の開始日＝本日から何日後か、デフォルト7）、`delivery_selectable_days`（選択肢に表示する日数、デフォルト14）。年末年始等はこの開始日数を一時的に増やすことでコード修正なしに調整できる。**2026-08-19（再修正）: 当初`delivery_lead_business_days`（営業日ベース）＋`delivery_max_advance_days`＋`delivery_blackout_dates`（配送不可日リスト）という設計だったが、ユーザーから旧サイトの実際のUI（`set.png`参照）は土日を除外しない暦日ベースの連続した日付一覧（開始日から14日分）であるとの指摘を受け、シンプルな暦日ベースの2設定に置き換え。配送不可日リストの個別除外機能は撤去（旧サイトの参照UIにも存在しないため）** |
| `snippets/cart-delivery-options.liquid` | カートページに「お届け希望日」「お届け希望時間」「宅配ボックス利用」の入力UIを追加する新規スニペット（新規・2026-08-19）。値はカート属性`delivery_date`（YYYY-MM-DD、空文字＝指定なし）／`delivery_time`（コード値 00=指定しない/08=午前中/12=12-14時/14=14-16時/16=16-18時/18=18-20時/19=19-21時）／`delivery_box`（コード値 00=利用する/01=利用しない）として保持し、基幹DB（`OM_OrderDT.AppointDate`/`AppointTime`/`DeliveryBoxFlg`）との連携を想定してコード値のままカート属性に保持する（ラベル変換はしない）。いずれも任意項目（未入力可）。**2026-08-19（再修正）: お届け希望日の入力を`<input type="date">`（カレンダー）からセレクトボックス方式に変更**。旧サイトの実際の仕様（`set.png`参照）に合わせ、「指定なし（指定なしの場合は最短でお届け）」＋本日から`delivery_lead_days`日後を起点に`delivery_selectable_days`日分の連続した日付（土日も含む）を選択肢として一覧表示する方式に変更。**2026-08-19（同日中に再修正）: 日付の`<option>`をJS動的生成からLiquidでの静的レンダリングに変更**（お届け希望時間と同じ作り）。ポイント適用等でカートセクションが再描画（morph）されると、JSが追加した`<option>`がサーバーの生HTML（「指定なし」のみ）で消えて選択できなくなる不具合が発生したため。日付一覧は`{% liquid %}`ブロック内で`'now' | date: '%s'`のUnixタイムスタンプ演算（`plus`/`times`/`minus`）により算出。**既知の制約**: カートを`delivery_selectable_days`日（デフォルト14日）以上放置すると、以前選択した日付が選択肢ウィンドウ外に落ち、表示上「指定なし」にフォールバックする（カート属性自体は古い日付を保持したままのため、選び直さずチェックアウトすると古い日付が注文属性に渡る可能性がある。意図した簡略化の副作用として許容）。詳細: `tasks/20260819-cart-delivery-options/spec.md` |
| `assets/cart-delivery-options.js` | 上記UIのカート属性更新処理を担当する新規Web Component（新規・2026-08-19）。値は`points_used`（`cart-points.js`）と同様に`attributes`キー経由で`/cart/update.js`へ送信（Shopifyの仕様上、他のカート属性はマージされ上書きされないため、ランク割引・ポイント利用・クーポン利用への影響はない）。**2026-08-19（再修正・同日中に再々修正）: お届け希望日をLiquid側で静的レンダリングする方式に変更したことに伴い、日付option生成ロジック（`connectedCallback`・最短日算出・営業日判定・配送不可日除外等）を全て撤去し、単純な保存処理のみに簡略化**。保存後の`sections`取得・`CartUpdateEvent`のdispatchも撤去済み（配送設定は他のカートUIに影響しないため不要。以前はこれが原因で保存直後に選択表示が「指定なし」に戻って見える不具合があった） |
| `snippets/cart-summary.liquid` | `cart-delivery-options`スニペットの呼び出しを追加（新規・2026-08-19）。ポイント入力欄の直前に配置 |
| `snippets/scripts.liquid` | `cart-delivery-options.js`のグローバル読み込みを追加（`show_delivery_options`が有効な場合のみ、新規・2026-08-19）。理由は既存の`cart-points.js`と同様（カートが空の状態からの遷移でscriptタグがmorph挿入のみとなり実行されない問題を避けるため） |
| `sections/product-extra-info.liquid` | 「SE向け実装指示書_20260817.docx」対応の新規セクション（新規・2026-08-19）。悩み・肌タイプ・仕上がりタグ（`custom.skin_concern`/`custom.skin_type`/`custom.finish_type`）、使い方（`custom.usage_steps`）、全成分（`custom.ingredients`）、並行輸入の信頼性説明（`custom.parallel_import_info`、テキストのみ・バナー画像は使用しない）、購買実績（`custom.sales_record`）を縦並び・SSR静的出力する。タブ・アコーディオンは使用しない。いずれも`custom`名前空間のメタフィールドは2026-08-19時点でShopifyストアに未作成（データ系が別途対応予定）のため、各項目を個別にblank判定しており、値が無い項目・全項目が無い場合は何も出力しない。`templates/product.json`の`order`に`main`の直後で追加。**2026-08-27（仕様変更、`feature/product-faq-parallel-import-shop-metafields`ブランチ）: 担当者HYからの回答により全成分（`custom.ingredients`）表示ブロックを完全撤去**（フレキシブルに変更できず業務上使えないため表示自体不要と確定。データ投入もしない）。**並行輸入の信頼性説明の参照先を商品単位`product.metafields.custom.parallel_import_info`からShop単位`shop.metafields.custom.parallel_import_info`に変更**（「商品ごと」から「全商品共通」の固定テキストに訂正されたため）。データ系がShop単位メタフィールド定義を作成済みだが2026-08-27時点で確定テキストは未投入・値は空のため、空なら非表示の挙動は維持 |
| `sections/product-faq.liquid` | 同指示書対応のFAQセクション（新規・2026-08-19）。`custom.faq_items`（json型、`[{"q":...,"a":...}]`想定）を質問・回答セットとして常時表示（タブ・アコーディオン不使用）でSSR出力し、FAQPageのJSON-LD（`mainEntity`にQuestion/Answerを列挙）を付与。メタフィールド未作成・空の場合はセクションごと何も出力しない。データ系が商品ごとにQ&A内容を投入する運用（SE側はメタフィールドを読み取ってSSR表示する仕組みの実装のみが担当範囲）。`templates/product.json`の`order`で`product_extra_info`の直後・`product_recommendations`の手前に配置。**本来は指示書の推奨構成ではクチコミSSRセクションがこの直前に来る想定だが、2026-08-19時点でJudge.meレビューウィジェットが商品ページに未設置のため未実装**（詳細は`D:\Inetpub\HANDOFF.md`参照）。**2026-08-27（仕様変更、`feature/product-faq-parallel-import-shop-metafields`ブランチ）: 参照先を商品単位`product.metafields.custom.faq_items`からShop単位`shop.metafields.custom.faq_items`に変更**（指示書原案の「商品ごと」Q&Aから「全商品共通」の内容に訂正されたため、担当者HYからの回答）。FAQPageのJSON-LDも同じ`faq_items`変数を参照しているため自動的に追従。データ系がShop単位メタフィールド定義を作成済みだが2026-08-27時点で確定FAQ文言は未投入・値は空のため、空ならセクション非表示の挙動は維持 |
| `sections/product-information.liquid` | Shopify標準の`structured_data`フィルタによるProduct JSON-LD出力の直後に、`aggregateRating`（`reviews.rating`/`reviews.rating_count`メタフィールドから算出）を明示的に補足出力するJSON-LDブロックを追加（新規・2026-08-19、初めての本ファイル改変につき上記「テーマ標準ファイルへの変更」表にも追記要）。値が無ければ何も出力しない。**2026-08-19（同日中に追加）: 個々のレビューを`review`配列として同じProductスキーマに統合**。データソースは`product.metafields.judgeme.review_widget_data`（json）の`reviews[]`（直近10件まで）。`rating`→`reviewRating.ratingValue`、`body`（無ければ`body_html | strip_html`）→`reviewBody`、`reviewer_name`（空なら「匿名」）→`author.name`、`created_at`→`datePublished`。**⚠️ `judgeme.review_widget_data`はJudge.meアプリが自社ウィジェット再描画用にキャッシュしている非公開・内部実装依存のフィールドであり、アプリ側の仕様変更で将来動かなくなる可能性がある**（値が取れない場合はreview配列を省略するだけで、aggregateRatingの出力自体は壊れない）。詳細は`D:\Inetpub\HANDOFF.md`参照 |
| `templates/product.json` | 上記2セクション（`product_extra_info`, `product_faq`）を`order`に追加（新規・2026-08-19） |
| `sections/ranking-list.liquid` | 「売れ筋ランキング」ページ用の新規セクション（新規・2026-08-21、`feature/ranking-page`ブランチ）。データ系（`D:\Inetpub\shopify_data`）が投入した`shop.metafields.custom.sales_ranking`（list.product_reference、Shop単位・配列の並び順=ランキング順位）をループし、順位（`forloop.index`）・商品画像・商品名（リンク）・価格（`snippets/price.liquid`を`render`）を縦一列にSSR表示。1〜3位は`data-rank`属性＋CSSでゴールド/シルバー/ブロンズ配色に強調。件数はハードコードせず配列の実件数分ループ、0件/blankの場合は「ランキングを準備中です」と表示。タブ・アコーディオン不使用（`product-extra-info.liquid`等と同方針）。見出し文言は`heading`設定（デフォルト「売れ筋ランキング」）、`color_scheme`設定あり。`enabled_on.templates`は`["page"]`。**2026-08-21（同日中に修正）: 当初`{% stylesheet %}`で書いていたところ、プレビュー確認で商品画像がサムネイルにならずほぼフルサイズ表示される不具合を確認。原因調査の結果、Shopifyのコンパイル済みCSSバンドル（`compiled_assets/styles.css`、ページ単位のsubsetにも完全版のdictionaryにも）にこのセクションのCSSルールが一切含まれていなかったことが判明（同じ`{% stylesheet %}`方式の`product-extra-info.liquid`等は正しくバンドルに含まれており、原因不明のプラットフォーム側の挙動と判断）。`{% style %}`（インライン`<style>`としてその場に出力される、バンドル非依存の方式）に変更して解消。1ページに1インスタンスのみ配置する前提のセクションのため、`{% stylesheet %}`のような自動スコープが無くても実害はない** |
| `templates/page.ranking.json` | 上記`ranking-list`セクションのみを配置した新規ページテンプレート（新規・2026-08-21、`feature/ranking-page`ブランチ）。Shopify管理画面で新規ページ作成時にテンプレート`page.ranking`を割り当てることで表示される想定 |
| `blocks/_header-menu.liquid` | ランキングページ（`/pages/ranking`）へのヘッダーからの導線を追加（新規・2026-08-21、`feature/ranking-page`ブランチ、初めての本ファイル改変につき上記「テーマ標準ファイルへの変更」表にも追記済み）。ヘッダーのメインメニューはAdmin管理の`main-menu`リンクリスト（Online Store > Navigation）を参照しており、既存の「ランキング」項目が無かった。Admin GraphQL API（`menuUpdate`）でメニューへ項目追加を試みたが、このストアで使える既存のAdmin APIトークン（`cosmetic-times-app-back`用、`D:\Inetpub\Manage\shopify\shopify_config.cfm`）には`write_online_store_navigation`スコープが無く`ACCESS_DENIED`となり実行不可と確認。ブラウザでのAdmin UI操作もこの実行環境では不可のため、代替としてテーマ側（Liquid）に固定リンクを追加する方式を採用。デスクトップのメガメニュー/オーバーフローメニュー（`else`分岐）の末尾と、モバイル用ナビゲーションバー（`navigation_bar`分岐、有効時のみ）の末尾に「ランキング」→`/pages/ranking`の固定`<li>`を追加。main-menuの実データやその並び順には一切依存しないため、Admin側でmain-menuの構成が変わっても影響を受けない一方、Admin側でメニューを編集してもこのリンクは連動しない（将来Admin API権限が使えるようになった場合は、こちらの固定リンクを外してAdmin管理のメニュー項目に置き換えるのが望ましい） |
| `snippets/header-drawer.liquid` | 上記と同じ理由・同じ導線追加（新規・2026-08-21、`feature/ranking-page`ブランチ、初めての本ファイル改変につき上記「テーマ標準ファイルへの変更」表にも追記済み）。モバイルのヘッダードロワー（ハンバーガーメニュー）の`<ul class="menu-drawer__menu ...">`末尾、`linklist.levels`による分岐（3階層未満/以上）の`{% endif %}`直後・`</ul>`直前に「ランキング」→`/pages/ranking`の固定`<li>`を追加。どちらの分岐でも共通してこの位置を通るため、分岐ごとに重複実装する必要がなかった |
| `sections/brand-list.liquid` | ブランド一覧ページ用の新規セクション（新規・2026-08-24、`feature/brand-list-page`ブランチ、`tasks/20260824-brand-list-page/spec.md`）。データ系（`D:\Inetpub\shopify_data`）が全567件のブランドSmartCollectionに設定した`custom.kana`/`custom.ename`/`custom.initial_e`メタフィールドを使用。「ブランドのコレクションかどうか」の判定は`custom.kana`の有無で行い（コレクションの`tags`・SmartCollectionの`rules`はLiquidから参照できないため一切依存しない）、日本語/英語の表示切替トグルで五十音タブ（`custom.kana`先頭1文字を`assets/brand-list.js`側で行判定、`custom.initial`は子音を含む値の仕様未確定のため不使用）⇔A-Zタブ（`custom.initial_e`をそのまま使用）に切り替わる。各カードはロゴ画像（未設定時は`placeholder_svg_tag`）・ブランド名・簡易説明文（`collection.description`）を表示しクリックで`/collections/{handle}`へ遷移。`collections`オブジェクトの`paginate`上限が250件（`sections/main-collection.liquid`と同じ既知の制約）のため、SSRは1ページ目のみ描画し残りは`assets/brand-list.js`がSection Rendering API経由で自動取得・統合する。**2026-08-24（同日中に追加修正、`feature/brand-list-hide-empty`ブランチ）: 該当商品が0件のブランド（例: 3M、3Wクリニック等）も表示されてしまっていた不具合を修正**（データ系からの依頼）。表示条件を`custom.kana`の有無のみから、`custom.kana != blank and collection.products_count > 0`（両方満たす）に変更。Liquidの`{% assign %}`で比較演算子を直接使えない制約があるため、ループの絞り込み自体を`{% unless kana == blank %}`から`{% if kana != blank and collection.products_count > 0 %}`に置き換える形で対応（`{% if %}`タグの条件式内での`and`/`!=`は問題なく使える）。**ページング件数（`data-total-pages="{{ paginate.pages }}"`）の再計算は不要と判断・確認済み**: `paginate.pages`は`collections`（店舗の全コレクション、ブランド以外も含む）を250件区切りで数えたページ数であり、ループ内のカード描画条件（kana/products_count）とは独立している。今回のフィルタ追加は表示条件のみに影響し店舗の全コレクション数自体は変えないため、`assets/brand-list.js`の`fetchRemainingPages`が叩くページ数はそのままで正しい（各ページのレスポンスHTML自体がフィルタ後のカードのみを含む） |
| `assets/brand-list.js` | 上記セクションの挙動一式を担当する新規スクリプト（新規・2026-08-24）。残ページの自動取得（`?section_id=...&page=N`）、カナ1文字→五十音行のマッピング判定、日本語/英語切替（並び替え・タブ切替・表示名切替はCSSの`[data-lang]`属性セレクタ併用）、タブ絞り込みを担当。JS未読み込み時もSSR分（1ページ目）のブランドはリンク・ロゴ・説明文が表示され続ける設計 |
| `templates/page.brand-list.json` | 上記`brand-list`セクションのみを配置した新規ページテンプレート（新規・2026-08-24、`feature/brand-list-page`ブランチ）。`sections/ranking-list.liquid`/`templates/page.ranking.json`と同じ方式。Shopify管理画面で新規ページ作成時にテンプレート`page.brand-list`を割り当てることで表示される想定。**Admin API/ブラウザ操作いずれもこの実行環境からは不可のため（`blocks/_header-menu.liquid`の項に既出の制約と同じ）、実際のPageオブジェクト（タイトル・ハンドル`brand-list`・テンプレート割り当て）の作成はユーザーまたはデータ系側での対応が必要**。想定URL: `/pages/brand-list` |
| `snippets/scripts.liquid` | `template.name == 'page' and template.suffix == 'brand-list'`の場合のみ`brand-list.js`を読み込む条件分岐を追加（新規・2026-08-24。既存の`show_delivery_options`条件分岐と同じ理由でページ限定読み込み） |
| `snippets/static-page-styles.liquid` | ガイド・法務系静的ページ11件（下記参照）共通のタイポグラフィ・表・FAQ項目CSS（新規・2026-08-24、`feature/guide-legal-pages`ブランチ、`tasks/20260824-static-guide-legal-pages/spec.md`）。`sections/ranking-list.liquid`/`sections/brand-list.liquid`で判明した`{% stylesheet %}`がコンパイル済みCSSバンドルに含まれないことがある不具合を踏まえ、`{% style %}`方式を採用。各ページのセクションから`{% render 'static-page-styles' %}`で読み込む |
| `sections/guide-top.liquid` + `templates/page.guide-top.json` | 「ご利用ガイド トップ」静的ページ（新規・2026-08-24）。現行 `/guide/top` の本文（ご注文/お支払い/お届け・送料/返品交換キャンセル/会員サービス・ポイント各カテゴリへのリンク一覧＋初めての方へ）を転記。想定URL: `/pages/guide-top` |
| `sections/guide-info.liquid` + `templates/page.guide-info.json` | 「コスメティックタイムズについて（3つのお約束）」静的ページ（新規・2026-08-24）。現行 `/guide/info` の本文を転記（装飾目的のpromiseItem画像は含めていない）。想定URL: `/pages/guide-info`。**2026-08-25追記**: `sections/guide-reason.liquid`の新規作成に伴い、guide/reasonへの絶対URLリンク（「詳しくはコチラ」）を`/pages/guide-reason`へ張り替え、冒頭コメントの記述も実情に合わせ修正（`tasks/20260825-guide-reason-page/spec.md`） |
| `sections/faq.liquid` + `templates/page.faq.json` | 「よくいただくご質問」静的ページ（新規・2026-08-24）。現行 `/guide/faq` は質問一覧のみで回答本文が個別の `/guide/faq/detail?faqcd=N` ページに分散していたため、8カテゴリ・67件全てのdetailページを個別取得し質問と回答を統合。各項目に`id="faq-{faqcd}"`を付与し、他ページから`/pages/faq#faq-54`のようにアンカー直リンク可能。回答文中の内部リンク（マイページ・お問い合わせフォーム等、本タスク対象外の機能）は旧サイトへの絶対URLに変換済み。想定URL: `/pages/faq`。**2026-08-25追記**: guide/reasonへの絶対URLリンク（375/895/933/959行目、計4箇所。933/959行目は`#hinshitsu`付き）を`sections/guide-reason.liquid`の新規作成に伴い`/pages/guide-reason`（`#hinshitsu`付きのものは`/pages/guide-reason#hinshitsu`）へ張り替え（`tasks/20260825-guide-reason-page/spec.md`） |
| `sections/order-guide.liquid` + `templates/page.order-guide.json` | 「ご注文について」静的ページ（新規・2026-08-24）。現行 `/guide/orderflow` の本文（購入金額・商品の探し方・注文の流れSTEP1〜4）を転記。画像は移行元サーバーへのホットリンクのまま（Shopify CDN未移行、category_grid画像と同種の既知の課題）。想定URL: `/pages/order-guide` |
| `sections/payment-guide.liquid` + `templates/page.payment-guide.json` | 「お支払いについて」静的ページ（新規・2026-08-24）。現行 `/guide/payment` の本文（クレジットカード/ｄ払い/AmazonPay/PayPay/コンビニ後払い/代金引換の説明・クーポン・領収書）を転記。想定URL: `/pages/payment-guide` |
| `sections/shipping-guide.liquid` + `templates/page.shipping-guide.json` | 「商品のお届けと送料」静的ページ（新規・2026-08-24）。現行 `/guide/carriage` の本文（送料・翌着サービス対象地域・日時指定・配送先・お届け状況確認）を転記。想定URL: `/pages/shipping-guide` |
| `sections/return-guide.liquid` + `templates/page.return-guide.json` | 「返品・交換・キャンセル」静的ページ（新規・2026-08-24）。現行 `/guide/return` の本文（返品条件・初期不良対応・30日間返品保証の条件と流れ）を転記。想定URL: `/pages/return-guide` |
| `sections/member-guide.liquid` + `templates/page.member-guide.json` | 「会員サービス・ポイント」静的ページ（新規・2026-08-24）。現行 `/guide/member` の本文を転記。会員ステータス早見表・変動シミュレーション表は元ページがGIF画像2枚だったため画像を目視確認して`<table>`として再現（数値は公開前に業務側での確認を推奨）。**注意**: ここで説明する「会員ステータス」（Member/Friend/Heartful/Lovely/CT VIP、半年利用金額に応じたポイント還元率1〜5%）はDB側のRankCD（00〜04、RankCD=04が5%OFF自動適用）とは別概念、転記のみで混同なきよう別注記済み。想定URL: `/pages/member-guide` |
| `sections/company.liquid` + `templates/page.company.json` | 「会社概要」＋「特定商取引に基づく表示」統合ページ（新規・2026-08-24）。現行 `/guide/company`（`#company`/`#transaction`の2アンカー）をユーザー指示どおり分割せず1ページ内2セクションとして再現。特定商取引法に基づく表示は法的必須事項のため要約せず全項目を逐語転記。想定URL: `/pages/company` |
| `sections/terms-of-service.liquid` + `templates/page.terms-of-service.json` | 「ご利用規約」静的ページ（新規・2026-08-24）。現行 `/guide/termsofservice` の全12条を要約・改変せず逐語転記。想定URL: `/pages/terms-of-service` |
| `sections/privacy-policy.liquid` + `templates/page.privacy-policy.json` | 「プライバシーポリシー」静的ページ（新規・2026-08-24）。現行 `/guide/policy` の全文を要約・改変せず逐語転記（元ページに制定日・改定日の記載なし）。想定URL: `/pages/privacy-policy` |
| `templates/index.json` | `category_grid`セクション（トップページ「カテゴリナビ」）内の5つの画像リンクのhrefを、タグフィルタURL `/collections/all/カテゴリ:XXX`（Shopify標準のタグフィルタ形式）から、データ系が新設したSmartCollection URL `/collections/{handle}` へ張り替え（2026-08-25、`tasks/20260825-category-tag-links-to-smartcollection/spec.md`）。対応: カテゴリ:スキンケア→`/collections/skincare`、カテゴリ:メイクアップ→`/collections/makeup`、カテゴリ:ボディケア→`/collections/bodycare-care`（対応表ではlevel=category_lv2）、カテゴリ:ヘアケア→`/collections/haircare`、カテゴリ:雑貨・その他→`/collections/other`。img src（旧サイト`https://www.cosmetic-times.com/image/common/navitopic_*.jpg`へのホットリンク）は本タスクの対象外で変更なし（既存の「未対応事項」参照）。**調査の結果、他にタグフィルタURLを使っている箇所（商品詳細ページのタグ表示・パンくず等）はテーマ内に存在せず、「お悩み:」タグを使った導線も現状テーマ内に一切存在しないため対応不要と判断** |

| `sections/category-list.liquid` + `templates/page.category-list.json` | 「カテゴリ一覧」静的ページ（新規・2026-08-25、`feature/category-trouble-listing-pages`ブランチ、`tasks/20260825-category-trouble-listing-pages/spec.md`）。データ系（`D:\Inetpub\shopify_data`）が作成済みの第1カテゴリ7件・第2カテゴリ27件・第3カテゴリ53件（合計87件）のSmartCollectionへの入れ子リンク一覧を、現行サイト（移行元）の`/category`を参考に再現。`sections/brand-list.liquid`と異なりコレクション件数が今後増減しない前提のため、`collections`オブジェクトからの動的取得（paginate等）を行わず、カテゴリ名・handle・階層構造を本ファイルに直接ハードコードした静的HTML（JSファイル無し）とした。リンク先は`collection.url`ではなく`/collections/{handle}`の固定文字列。想定URL: `/pages/category-list` |
| `sections/trouble-list.liquid` + `templates/page.trouble-list.json` | 「お悩み一覧」静的ページ（新規・2026-08-25、`feature/category-trouble-listing-pages`ブランチ、`tasks/20260825-category-trouble-listing-pages/spec.md`）。データ系が作成済みの69件のお悩みタグSmartCollectionへのリンク一覧を、6グループ見出し（スキンケア/ベースメイク/メイクアップ/ボディケア/ヘアケア/その他のお悩み）ごとに現行サイトの`/trouble`を参考に再現。同様に静的ハードコード方式（JSファイル無し）。旧サイトの`/trouble`では「ムダ毛除去」が欠落していたが、データ系マスタでは正しく69件中の1件として含まれているため今回は表示する。想定URL: `/pages/trouble-list` |
| `sections/guide-reason.liquid` + `templates/page.guide-reason.json` | 「安くて安心な商品をおとどけできるワケ」静的ページ（新規・2026-08-25、`feature/guide-reason-page`ブランチ、`tasks/20260825-guide-reason-page/spec.md`）。現行 `/guide/reason` の本文を転記。4段階の品質管理プロセスは元ページの図解ではなく見出し+説明文の並び（テキスト構成）で再現。装飾目的の画像は含めていない（`sections/guide-info.liquid`と同方針）。`id="hinshitsu"`を「安心の品質管理」見出しに付与し、`sections/faq.liquid`（4箇所）・`sections/guide-info.liquid`（1箇所）からの`#hinshitsu`付き旧URLリンクの遷移先として使用。想定URL: `/pages/guide-reason` |

**上記14ページ共通の制約**: Admin GraphQL APIでの`pageCreate`は、このストアで使える既存トークン（`cosmetic-times-app-back`用）に`write_content`/`write_online_store_pages`スコープが無く`ACCESS_DENIED`で実行不可と確認済み（`blocks/_header-menu.liquid`のメニュー追加時と同種の制約）。ブラウザでのAdmin UI操作もこの実行環境からは不可のため、実際のPageオブジェクト（タイトル・ハンドル・テンプレート割り当て）の作成はユーザー側での対応が必要。作成すべきハンドル一覧は上表の「想定URL」列を参照（`/pages/{handle}`のhandle部分をそのままPage作成時のハンドルに指定すること）。

| `sections/feature-list.liquid` | 「特集一覧」ページ用の新規セクション（新規・2026-08-26、`feature/feature-list-page`ブランチ、`tasks/20260826-feature-list-page/spec.md`）。データ系（`D:\Inetpub\shopify_data`）が2026-08-26に30件の特集をShopify Custom Collectionとして移行済み（handle形式`feature-{FeatureCD}`、例: `feature-179`、今後の追加分も同じ命名規則が続く前提）。「特集のコレクションかどうか」の判定は`collection.handle`が`feature-`で始まるかどうかのみで行う（tags・SmartCollectionのrulesはLiquidから参照できないため一切依存しない。`{% assign handle_prefix = collection.handle | slice: 0, 8 %}`のあと`{% if handle_prefix == 'feature-' %}`で判定、CLAUDE.mdの`{% assign %}`内での比較演算子直接使用禁止ルールに抵触しない形）。件数が今後も増減しうる点、およびストア全体のコレクション数（ブランド567+カテゴリ87+お悩み69+特集30=750件超）が250件を大きく超える点から、`sections/category-list.liquid`/`sections/trouble-list.liquid`のような静的ハードコード方式ではなく`sections/brand-list.liquid`と同じ動的取得方式を採用（`collections`オブジェクトをループ、`paginate`は1ページ目のみSSR）。各カードはコレクション画像・タイトル・簡易説明文（`collection.description`を`strip_html`+`truncate: 80`）を表示し`collection.url`へリンク。デザインは`brand-list`のカードデザイン（画像枠→名称→簡易説明文）を踏襲、画像比率は特集バナーらしく16:9・`object-fit: cover`。0件時は「該当する特集が見つかりませんでした」を表示。`{% stylesheet %}`がコンパイル済みCSSバンドルに含まれない既知の不具合（`ranking-list`/`brand-list`で確認済み）を踏まえ`{% style %}`方式を採用。`enabled_on.templates`は`["page"]` |
| `assets/feature-list.js` | 上記セクションの残りページ自動取得を担当する新規スクリプト（新規・2026-08-26）。`assets/brand-list.js`と同方式のSection Rendering API（`?section_id=...&page=N`）呼び出しだが、特集一覧では五十音/A-Zタブ絞り込みや言語切替が不要なため、それらの機能は持たずページ取得・グリッドへの追加・空状態表示切替のみを行う単純な実装。JS未読み込み時もSSR分（1ページ目、最大250件）の特集は表示され続ける |
| `templates/page.feature-list.json` | 上記`feature-list`セクションのみを配置した新規ページテンプレート（新規・2026-08-26、`feature/feature-list-page`ブランチ）。`sections/brand-list.liquid`/`templates/page.brand-list.json`と同方式。**Admin API/ブラウザ操作いずれもこの実行環境からは不可のため、実際のPageオブジェクト（タイトル・ハンドル`feature-list`・テンプレート割り当て）の作成はユーザー側での対応が必要**（上記14ページ・`brand-list`と同種の制約）。想定URL: `/pages/feature-list` |
| `snippets/scripts.liquid` | `template.name == 'page' and template.suffix == 'feature-list'`の場合のみ`feature-list.js`を読み込む条件分岐を追加（新規・2026-08-26。既存の`brand-list`/`show_delivery_options`条件分岐と同じ理由でページ限定読み込み） |
| `blocks/favorite-button.liquid` | 商品ページ用「お気に入り」トグルボタンの新規theme block（新規・2026-08-27、`feature/favorite-products`ブランチ）。データ系（`D:\Inetpub\shopify_data`）が実装・検証済みの`customer.metafields.custom.favorite_items`（list.product_reference、最大128件・上限管理はサーバー側実装済み。Liquid上は`.value`がProductオブジェクトの配列としてそのまま解決される）と、バックエンドAPI `toggle_favorite.cfm`（`customer_id`/`product_id`/共有token、GETクエリ）を利用する。`templates/product.json`の`main`（product-information）→`product-details`ブロックの子ブロックとして`buy_buttons_eYQEYi`直後（`favorite_button_9wLmQ2`）に配置（`blocks/_product-details.liquid`のschema.blocksが`"@theme"`を許可しているため追加可能、下線始まりでない独自ブロックファイルとして新規作成）。ログイン時: SSRで`customer.metafields.custom.favorite_items.value`に`product.id`が含まれるかを判定し初期状態（塗りつぶし/アウトラインのハートSVGをインラインで直接記述、アイコン用アセットファイルは追加していない）を出し分け、クリックで`assets/favorite-button.js`が`toggle_favorite.cfm`を呼び出しレスポンスの`favorited`値で見た目を更新（サーバー側の値を信頼、楽観的更新はしない）。`limit_reached: true`時はボタン付近にメッセージを表示。未ログイン時: APIを一切呼ばず`routes.account_login_url`への通常リンクとして描画。`{% stylesheet %}`がコンパイル済みCSSバンドルに含まれない既知の不具合（`ranking-list`/`brand-list`/`feature-list`で確認済み）を踏まえ`{% style %}`方式を採用（セクションだけでなく本ブロックにも予防的に適用） |
| `assets/favorite-button.js` | 上記ブロックのクリック挙動を担当する新規Web Component（`favorite-button-component`、新規・2026-08-27）。`assets/customer-sync.js`と同じ共有token（`bee15c758842afe80a460a8d1d899e88323163105c99946f`）を使い回す（データ系了承済みの既存方式を踏襲）。ログイン済みの場合のみこのコンポーネントがDOMに存在する（未ログイン時は`blocks/favorite-button.liquid`側で通常リンクとして描画されAPIは呼ばれない設計のため、このJS内では未ログイン分岐を持たない）。**2026-08-28: 送信先`ENDPOINT`をngrok無料枠URL（`https://arnulfo-fordable-pipingly.ngrok-free.dev/...`）から本番URL`https://www2.cosmetic-times.com/Manage/shopify/toggle_favorite.cfm`へ変更**（`feature/switch-to-production-endpoint`ブランチ。ngrok無料プランでは実際の登録動作がNGだったための切替）。**2026-08-31: `ngrok-skip-browser-warning`ヘッダーを削除**（CORSプリフライトが原因で「サーバー側は成功するがブラウザのfetch()は失敗扱いになる」不具合を実機確認で検出・修正。詳細は`customer-sync.js`の行と同じ） |
| `templates/product.json` | `main`セクションの`product-details`ブロックに`favorite_button_9wLmQ2`（`favorite-button`タイプ）を`buy_buttons_eYQEYi`の直後・`text_aEtTtq`（商品説明）の手前に追加（新規・2026-08-27、`feature/favorite-products`ブランチ） |
| `snippets/scripts.liquid` | 商品ページ判定ブロック（`template == 'product' or template.name == 'product' or request.page_type == 'product'`、既存の`RecentlyViewed`呼び出しと同じ分岐）内に`favorite-button.js`のグローバル読み込みを追加（新規・2026-08-27。ブロックは商品ページ専用のため、他ページでは読み込まれない） |
| `sections/favorite-list.liquid` | 「お気に入り一覧」ページ用の新規セクション（新規・2026-08-27、`feature/favorite-products`ブランチ）。`customer.metafields.custom.favorite_items.value`（Productオブジェクトの配列）をループし、閲覧専用（追加・削除操作は持たない。トグル操作は商品ページの`favorite-button`ブロックのみ）で商品カードを表示する。**2026-08-31（`fix/favorite-list-product-card`ブランチ）: 商品カードが画像・商品名・価格とも全て空白のプレースホルダーになる不具合を修正**。当初は`sections/product-list.liquid`と同じ`{% content_for 'block', type: '_product-card', id: 'static-product-card', ... %}`手法（`UniqueStaticBlockId`チェック無効化コメント付き）でHorizonネイティブの商品カードを描画していたが、この方式は「static-product-card」IDに対応する子ブロック構成（image/product-title/price）がテンプレートJSON側（`templates/page.favorite-list.json`）に実体として存在して初めて機能する。`product-list.liquid`でこの構成が存在するのは、セクションschemaの`presets[].blocks`がテーマエディタの「セクション追加」操作時にテンプレートJSONへ自動的に書き込まれるため。今回のように新規ページテンプレートを直接JSONで作成した場合はその書き込みが発生せず、`closest.product`自体は正しく解決される（デバッグ出力で確認済み）のに子ブロックが1つも描画されず、商品カードの中身が常に空白になっていた。修正としてcontent_for/closestの仕組みへの依存をやめ、Horizon標準の汎用リソースカード`snippets/resource-card.liquid`（`snippets/header-drawer.liquid`・`snippets/mega-menu-list.liquid`・`snippets/predictive-search-products-list.liquid`等でも使われている、ブロック設定不要でproduct/collectionオブジェクトを渡すだけで描画できるsnippet）を直接renderする方式に変更。0件/メタフィールド未設定時は「お気に入り商品はまだありません。」を表示。参照先商品が削除済み等でblankの要素は`sections/ranking-list.liquid`と同様にスキップ。未ログイン時はLiquidでサーバーサイドリダイレクトができないため、`customer`が`nil`の場合はページ本体を描画せず`window.location.href = {{ routes.account_login_url | json }}`のインラインscriptのみを出力（新規JSアセットは作らずページ内に直接記述、`noscript`時のフォールバックリンクあり）。`{% stylesheet %}`がコンパイル済みCSSバンドルに含まれない既知の不具合を踏まえ`{% style %}`方式を採用。`enabled_on.templates`は`["page"]` |
| `templates/page.favorite-list.json` | 上記`favorite-list`セクションのみを配置した新規ページテンプレート（新規・2026-08-27、`feature/favorite-products`ブランチ）。`sections/brand-list.liquid`/`templates/page.brand-list.json`と同方式。**Admin API/ブラウザ操作いずれもこの実行環境からは不可のため、実際のPageオブジェクト（タイトル・ハンドル`favorite-list`・テンプレート割り当て）の作成はユーザー側での対応が必要**（上記14ページ・`brand-list`・`feature-list`と同種の制約）。想定URL: `/pages/favorite-list`。ページ限定JSは無し（閲覧専用でトグル操作を持たないため、`snippets/scripts.liquid`側の条件分岐追加は不要と判断） |
| `config/settings_data.json` | 新規カラースキーム`scheme-7`（ヘッダー下段ナビバー用、背景`#635d4d`・文字白・アクセント`#c83564`）/`scheme-8`（フッター本体用、背景`#f8f5ec`クリーム・文字`#7b7052`タウプブラウン）/`scheme-9`（フッター最下部コピーライトバー用、背景`#524e43`ダークブラウン）を`current`/`presets.Horizon`両方に追加（新規・2026-09-01、`feature/static-page-design-alignment`ブランチ、ヘッダー・フッターを現行SPサイト`renew_header_s.cfm`/`new_footer_s.cfm`のデザインに合わせる作業の一環。データ系からの依頼で、今回に限りトップ/商品詳細ページを含む全ページ共通のヘッダー・フッターを対象とすることが承認されている）。**注意**: `assets/custom-luxury.css`の全スキーム強制ゴールド上書き（下記参照）により、ここで定義した背景色・前景色は単体では反映されない。実際の配色は`custom-luxury.css`側の`.color-scheme-7/8/9`個別上書きで確定させている |
| `sections/header-group.json` | `header_section`の`color_scheme_bottom`を空→`scheme-7`に変更し、`header-menu`ブロックの`navigation_bar`を`false`→`true`、`color_scheme_navigation_bar`を`scheme-7`に変更（新規・2026-09-01）。Horizon標準の「モバイルナビゲーションバー」機能（トップ行の直下に出るタブ状メニュー行）を有効化することで、現行SPサイトの`.head_menu`（新着/セール/ランキング/ブランド/カテゴリの横並びバー）に相当する要素を再現。**2026-09-01（同日中に追加修正）: 中身がAdmin管理の`main-menu`リンクリストにそのまま追従する設計だったが、実機確認で`main-menu`がHome/Catalog/Contactのみ（実質空）で、ナビバー・ドロワーメニューとも「ランキング」1項目しか表示されない不具合が発覚**。詳細は`blocks/_header-menu.liquid`・`snippets/header-drawer.liquid`の行参照 |
| `blocks/_header-menu.liquid` | `navigation_bar`ケースに新着(`/collections/new-arrivals`)・セール(`/collections/outlet`、専用コレクション未作成のため暫定)・ブランド(`/pages/brand-list`)・カテゴリ(`/pages/category-list`)の固定リンクを追加（新規・2026-09-01）。既存の`/pages/ranking`固定リンク（2026-08-21対応）と同じ方式・同じ理由（`main-menu`がAdmin側で空／Home・Catalog・Contactのみのため、`main-menu.links`をループしても何も表示されない。Admin GraphQL API`menuUpdate`は`write_online_store_navigation`スコープが無くACCESS_DENIED、実行不可のため理論側で固定リンク化）。5項目の並び順は新着→セール→ランキング→ブランド→カテゴリで現行SPサイトの`.head_menu`と一致させた |
| `snippets/header-drawer.liquid` | モバイルドロワー（ハンバーガーメニュー）末尾の固定リンクを、`/pages/ranking`のみ→新着/セール/ランキング/ブランド/カテゴリの5項目に拡張（新規・2026-09-01）。理由は`blocks/_header-menu.liquid`と同じ（`main-menu`が実質空でドロワーにも「ランキング」しか表示されていなかったため） |
| `sections/header.liquid` | 現行SPサイト`renew_header_s.cfm`の2段目（ログイン中会員向け挨拶文＋ランク表示＋ログアウト、未ログイン時は会員登録訴求）を再現する`header-member-bar-row`を新規追加（新規・2026-09-01、初めての本ファイル改変につき上記「テーマ標準ファイルへの変更」表にも追記要）。`customer`オブジェクトでログイン判定し、ランク名は`customer.metafields.custom.rank.value`（`snippets/cart-summary.liquid`と同じRankCD 00〜04のメタフィールド）を`sections/member-guide.liquid`に転記済みの名称（メンバー/フレンド/ハートフル/ラブリー/CT VIP）にマッピングして表示。ログアウトは`routes.account_logout_url`、未ログイン時の新規会員登録は`routes.account_register_url`を使用 |
| `sections/footer-group.json` | `footer_m9NzUG`（フッター本体）に新規`group`ブロック1個（`footer_sp_group_Kq3nR7`）を追加し、その子として`text`（SNS訴求見出し）・`social-links`（Twitter/Facebook/Instagram実URL＋LINEをcustom_urlで追加）・`button`×2（ご注文専用ダイヤル`tel:03-5759-6912`／お問い合わせ専用ダイヤル`tel:0120-88-7565`）・`text`（お問い合わせ/よくいただくご質問/ご利用ガイド/営業・配送日カレンダー/会社概要・規約/プライバシーポリシーへのリンク集、リッチテキスト）を配置（新規・2026-09-01）。`color_scheme`を`scheme-1`→`scheme-8`に変更。`footer_utilities_jLGE8U`は既存の`social-links`ブロック（プレースホルダーURLのみで実質未使用状態だった）を削除しコピーライト＋ポリシーリストのみに整理、`color_scheme`を空→`scheme-9`に変更（現行サイトの著作権バーと同じくSNSアイコンを持たないダークブラウン単色バーに統一するため）。以上により現行SPサイト`new_footer_s.cfm`のSNS訴求文＋SNSアイコン→電話CTA×2→クイックリンク一覧→著作権バーという縦積み構成をHorizon標準ブロックの組み合わせで再現 |
| `assets/custom-luxury.css` | 「20. Header & Footer」セクションを新規追加（2026-09-01）。ファイル冒頭の「2. Color Scheme Overrides」が`body [class*="color-scheme"]`という広いセレクタで全カラースキームをゴールド/白/黒に強制上書きしているため、新設した`scheme-7`/`scheme-8`/`scheme-9`の配色がそのままでは反映されない問題があり、`.color-scheme-7`/`.color-scheme-8`/`.color-scheme-9`にクラスを1つ足してspecificityを上げる形でこの3スキームだけ上書きを打ち消す対応を追加。合わせて`.header__navigation-bar-row`の背景色、`.header-actions__cart-icon .cart-bubble__background`（カート件数バッジをゴールド系ではなく現行サイトのピンク`#c83564`に）、モバイル時のヘッダー上段アイコン色（タウプ系`#8b8471`）、フッター本体（scheme-8）内ボタンの角丸をハードコードで追加。**ガイド系静的ページ調査時と同じ結論（現行サイトのアクセントは実際はピンク`#c83564`）をヘッダー・フッターにも適用**した。**2026-09-01（同日中に追加修正、ユーザー要望）: 「20-1」セクションを追加し、Horizon標準の`@media (min-width:750px){ [data-menu-style=menu] .header__navigation-bar-row{display:none} }`（PC幅でナビバーを隠す仕様）を`!important`で打ち消し、画面幅に関わらずナビバーを常時表示に変更**（SP版デザインをベースにPC/SP問わず反映してほしいとの指示のため）。**「20-2」セクションを追加し、`sections/header.liquid`に新設した`header-member-bar-row`（ログイン挨拶文・ランク・ログアウト行）の配色（白背景・上端罫線・ランク名/リンクのピンク強調）を実装** |

**ヘッダー・フッターSPデザイン統一の既知の制約（2026-09-01）**: 現行サイトの`renew_header_s.cfm`にある「問い合わせ」アイコン（`/guide/top`への専用リンク）・カート/新着/セールの「UP!」ピンクバッジ（表示日付入りバッジ）・検索窓は、Horizonの標準コンポーネント構成に対応する箇所がなく本タスクでは追加していない（検索アイコン自体はHorizon標準機能として別途存在）。同じく`new_footer_s.cfm`の「PCサイトへ」リンク（PC/SP別テンプレート運用前提の機能）はShopify側に存在しないため対象外。電話CTAボタンの丸型アイコン（電話マーク付き円形バッジ）もHorizonの`button`ブロックには対応するスロットがなく、テキストのみのボタンで代替した。**「セール」の遷移先（`/collections/outlet`）は暫定対応**：現行サイトの「セール」（EcDiscountFlg基準の値引き商品一覧、`/sale`）に対応する専用コレクションがShopify側に未作成のため、既存の`/collections/outlet`（アウトレット、`templates/index.json`のpromo_bannersで"OUTLET SALE"として既に使用）を代用している。データ系で専用の「セール」コレクションを作成後、`blocks/_header-menu.liquid`・`snippets/header-drawer.liquid`のリンク先を差し替える必要がある（`D:\Inetpub\HANDOFF.md`に申し送り記載）。**main-menu（Online Store > Navigation）自体はHome/Catalog/Contactのみで実質空のまま**（Admin API書き込み権限が無く本タスクでは編集不可）。新着/セール/ランキング/ブランド/カテゴリはナビバー・ドロワーいずれもテーマ側の固定リンクで表示しているため実害はないが、将来的にAdmin側でmain-menuに実項目を追加した場合、固定リンクと重複表示される可能性がある点に留意（`blocks/_header-menu.liquid`のコメント参照）。これらは1:1移植ができなかった箇所として記録する。

## MCPサーバー設定

| サーバー名 | 用途 | 設定場所 | 状態 |
|---|---|---|---|
| Chrome DevTools MCP | ブラウザ操作・スクリーンショット・JS実行・ネットワーク検証 | Claude Code 組み込み | ✅ 使用可能（推奨） |
| Playwright MCP | フォーム操作・クリックなど複雑なブラウザ自動化 | `C:\Users\1213\.claude.json` | ✅ 登録済み（2026-06-10）※セッション再起動後に有効 |

### ブラウザ操作の使い分け

- **スクリーンショット・ページ確認** → Chrome DevTools MCP を使う（フォント読み込み待ちタイムアウトなし）
- **フォーム入力・クリック操作** → Playwright MCP を使う

### Playwright MCP の設定メモ

- `--no-sandbox` 警告対策として `--browser-args=--disable-setuid-sandbox --no-sandbox` を追加済み（2026-06-12）
- 設定ファイル: `C:\Users\1213\.claude.json` の `D:/Inetpub/shopify_theme` プロジェクト内
- **変更反映にはClaudeセッションの再起動が必要**

### devストアへのアクセス（パスワード保護）

- ストアパスワード: `1shuei`（cosmetic-times-dev用。cosmetic-times-prdへの切替後は同じパスワードか要確認）
- Playwright でアクセスする手順:
  1. `/password` ページを開く
  2. 「パスワードを入力してアクセスする」ボタンをクリック（パスワード入力欄が折りたたまれているため）
  3. パスワードを入力して Enter
  4. 認証後は同セッション内でそのままページ遷移可能

---

## 未対応事項（次回以降に対応）

| 項目 | 内容 |
|---|---|
| category_grid 画像 | 5枚のカテゴリ画像が旧サーバー `https://www.cosmetic-times.com/image/common/navitopic_*.jpg` を参照中。旧サーバー停止前にShopify CDNへ移行が必要 |
| ~~バリアント説明文切り替え~~ | ~~`text` ブロックはバリアント変更時の自動更新非対応。`type: "product-description"` ブロックへ変更すれば対応可能~~ → **2026-06-10 対応済み** |
| バリアント画像割り当て（admin作業） | 商品 `/products/06900044` の全8バリアントで `featured_image: null`。Shopify管理画面でバリアント編集→画像選択が必要。引き継ぎ: `C:\Users\1213\handover.md` |
| バリアント説明文登録（admin作業） | 同商品のバリアント個別説明文が未登録。管理画面でバリアントの `description` メタフィールドに入力。テーマ側（product-description ブロック）は対応済み。引き継ぎ: `C:\Users\1213\handover.md` |
| favicon設定 | `favicon.ico 404`（機能影響なし）。対応は管理画面→テーマカスタマイズ→ファビコン設定 |
| ~~customer-sync の外部エンドポイント~~ | ~~`assets/customer-sync.js` の送信先がngrok無料枠のためURLが変わる/停止する可能性あり~~ → **2026-08-28対応済み**: 送信先を本番URL`https://www2.cosmetic-times.com/Manage/shopify/link_customer.cfm`へ変更（`feature/switch-to-production-endpoint`ブランチ）。ngrokトンネル自体は廃止・停止済み。tokenのクライアント側ベタ書き自体は残存課題（本番公開前に恒久的な認証方式への切替を推奨） |
| お気に入り一覧ページ（admin作業） | `templates/page.favorite-list.json`（新規・2026-08-27、`feature/favorite-products`ブランチ）に対応する実際のPageオブジェクト（タイトル・ハンドル`favorite-list`・テンプレート割り当て）の作成が必要。Admin API/ブラウザ操作いずれもこの実行環境からは不可のため、`brand-list`/`feature-list`等と同種の制約でユーザー側での対応が必要。想定URL: `/pages/favorite-list`。ヘッダーメニュー等への導線追加は本タスクでは未実施（`ranking`ページの固定リンク方式を踏襲する場合は別途対応要） |
| ~~お気に入り機能の外部エンドポイント（`toggle_favorite.cfm`）~~ | ~~`assets/favorite-button.js`も`customer-sync.js`と同じngrok無料枠エンドポイントを使い回している~~ → **2026-08-28対応済み**: 送信先を本番URL`https://www2.cosmetic-times.com/Manage/shopify/toggle_favorite.cfm`へ変更。tokenのベタ書き自体は残存課題（上記customer-syncの行と同じ） |
| お気に入り機能の実機検証未実施 | 本機能（`blocks/favorite-button.liquid`・`sections/favorite-list.liquid`等、2026-08-27）は`shopify theme check`によるlint検証とコードレビューのみ実施。ブラウザでの実機確認（ログイン状態でのトグル動作・`toggle_favorite.cfm`との疎通・限度到達メッセージ表示・お気に入り一覧ページの表示）は本タスクの実行環境からは未実施。**2026-08-31: 実機確認（ユーザー提供の`set.png`）でお気に入り一覧ページの商品カードが全て空白になる不具合が発覚し`fix/favorite-list-product-card`ブランチで修正済み（詳細は`sections/favorite-list.liquid`の項参照）。この修正自体もコードレビューベースのみで、修正後の実機再確認は未実施**。マージ前にプレビュー環境等での実機確認を推奨 |
| ~~配送不可日リストの初期値未設定~~ | ~~`config/settings_data.json`の`delivery_blackout_dates`は空で実装（2026-08-19）~~ → **2026-08-19（同日中に再修正）**: お届け希望日を旧サイト仕様（暦日ベースのセレクトボックス）に合わせたことにより、個別の配送不可日リスト機能自体を撤去。年末年始等の調整は`delivery_lead_days`（開始日数）をテーマ設定から一時的に増やすことで対応する運用に変更 |
| **⚠️ 商品一覧のAvailabilityフィルター件数が実在庫と乖離する（Shopify既知の不具合・恒久修正なし）** | 在庫状況フィルター（在庫あり/在庫切れ）の表示件数が実データと大きくズレる不具合をShopifyサポートに確認したところ、「在庫ステータスデータの内部同期に関する既知の問題」と回答（2026-08-04）。**本番運用で在庫が頻繁に変動すると再発する可能性があり、恒久修正はされていない**。再発時のセルフ回避策：管理画面 → アプリ → Search & Discovery → フィルター で在庫状況フィルターを削除して保存 → 再度追加して保存（問い合わせなしで同期リセットされる場合がある）。改善しなければShopifyサポートへ追加問い合わせ。テーマ側の実装ミスではないため、コード修正は不要 |
| ~~`sections/product-list.liquid`のスキーマがpushの度にサイレント失敗~~ | ~~`icons_shape`設定の`visible_if`が括弧を含みLiquid構文エラーとなり、2026-06-10以降全pushでこのファイルのアップロードが失敗し続けていた~~ → **2026-08-03 対応済み**（`visible_if`を`X and (Y or Z)`から`(X and Y) or (X and Z)`の分配形に書き換えて解消。pushログで`Asset upload failed`が出ないことを確認済み。これにより2026-06-10の「スキーマ修正3件」も今回初めて実際にShopifyへ反映された） |

---

## 作業完了時の報告フォーマット

作業完了後は必ず以下の形式で報告すること:

```
【完了】
- 変更ファイル: （ファイル名・パス）
- 変更内容: （何をどう変えたか）
- GitHubへのpush: （完了 or 未実施・理由）
- 確認事項: （ユーザーが次に確認・判断すべきこと）
- 注意点: （あれば）
```

<!-- spec-driven:start -->
## docs/ 運用ルール（全プロジェクト共通・開発手法非依存）

このプロジェクトは `docs/` でプロジェクト知識（product/tech/structure/その他ドメイン知識）を管理している。内容が古くなったと感じたら `spec-steering-init`（core3種）/ `spec-steering-custom`（database/infrastructure/security/glossary/api/integrations）Skillで同期すること。

以下は常に前提知識として参照する:
@docs/product.md
@docs/tech.md
@docs/structure.md
@docs/glossary.md
<!-- spec-driven:end -->

<!-- spec-driven-workflow:start -->
## tasks/ 運用ルール（spec駆動開発を採用するプロジェクトのみ）

このプロジェクトはspec駆動開発を採用している。

- タスク着手前に `task-init` Skillを実行し、「このタスクで何を行うか」を必須クエリとして入力すること
- `task-init`が `tasks/{YYYYMMDD}-{feature-name}/spec.md` を自動生成する（フォルダ作成・日付採番は自動）
- 実装完了後、`task-close` Skillを実行し、`spec.md`に完了記録（完了日・AI利用状況・振り返り）を追記すること
<!-- spec-driven-workflow:end -->
