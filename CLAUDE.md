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
| `assets/component-cart-items.js` | `onLineItemRemove` でカートが空になった際、`points_used`カート属性とディスカウントコードをクリアする処理を追加（2026-07-30） |
| `assets/cart-discount.js` | `applyDiscount`にクーポン適用時の`points_used`クリア処理を追加後、削除（2026-07-31。詳細は下記カスタマイズ済みファイル一覧参照） |
| `assets/quick-add.js` | クイック追加モーダルが商品ページのHTMLを流用する際、そのページ専用の`{% stylesheet %}` CSS（`compiled_assets/styles.css`のsubset）が現在のページに含まれておらずスタイル崩れが起きる問題を修正するため、取得した商品ページのstylesheetリンクを`<head>`に追加注入する処理を追加（2026-08-07） |

---

## 作業フロー

> ユーザーは指示を出すだけ。ファイル編集・コマンド実行はすべてClaudeが行う。

1. ユーザーが変更内容を指示
2. Claude がファイルを編集
3. Claude が `git add` / `commit` / `push` を実行
4. GitHub Actions が自動で `shopify theme push` を実行（Shopifyへ反映）

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

| 項目 | 内容 |
|---|---|
| 設定日 | 2026-05-21（push先を2026-07-23に cosmetic-times-prd へ切替） |
| ファイル | `.github/workflows/deploy.yml` |
| トリガー | main ブランチへの push |
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
| `assets/component-cart-items.js` | カートが空になった際に`points_used`属性・ディスカウントコードをクリア（2026-07-30・※テーマ更新で上書きリスク） |
| `assets/cart-discount.js` | クーポン適用時に`points_used`を強制クリアする処理を追加（2026-07-30）→**削除（2026-07-31）**。理由: 当初はクーポン+ポイント併用時の入力欄表示値を正しく計算するのが困難だったための暫定対応だったが、`cart-summary.liquid`にクーポン考慮のキャップ計算を実装したことで不要になった。現在はクーポン適用時もポイントはクリアされず、適用可能な額に自動でキャップ表示される（併用は許可する方針・※テーマ更新で上書きリスク） |
| `snippets/scripts.liquid` | `cart-points.js`のグローバル読み込みを追加（2026-07-30）。理由: 元々`cart-summary.liquid`（カートが空でない時のみレンダリング）内にscriptタグがあり、カートが空の状態でページ読込→遷移せず商品追加すると、scriptタグがmorphでDOM挿入されるだけで実行されず`cart-points-component`が never upgrade にならない不具合があったため、`cart-discount.js`と同じくグローバル読み込みに変更 |
| `snippets/customer-sync.liquid` | ログイン顧客のポイント/ランク連携用データ埋め込み（新規・2026-07-24） |
| `assets/customer-sync.js` | 顧客ID/emailを外部エンドポイントへ送信（セッション中1回・tokenベタ書き、新規・2026-07-24） |
| `sections/breadcrumbs.liquid` | 商品詳細ページに「ホーム > コレクション名 > 商品名」形式のパンくずリストを表示する新規セクション（新規・2026-08-07、`templates/product.json`の`order`先頭に配置）。**判明した既知の制約**: このストアは`/collections/{handle}/products/{handle}`形式のURLを常に`/products/{handle}`へリダイレクトする設定になっており（原因はテーマコード外・管理画面のURLリダイレクト設定か何らかのSEOアプリと推測、未特定）、Shopify標準の`collection`オブジェクトがproductテンプレートで常に`nil`になる。そのため`collection`が`nil`の場合、`product.collections`から`all`ハンドルを除いた最初のコレクションを代表コレクションとして表示するフォールバックで対応している |
| `sections/footer.liquid`, `sections/footer-group.json` | フッターの「メールマガジン登録」欄一式（見出し・説明文・メールアドレス入力欄・送信ボタン）を、ログイン状態を問わず常時非表示に変更（2026-08-18）。データ系（`D:\Inetpub\shopify_data`）からの依頼: この送信がShopifyの`customers/create`イベントを発火させ、バックエンド側で意図しない重い処理（既存会員なら過去注文の一括同期、未登録メールなら新規会員レコード作成）を引き起こしていたため。当初は「ログイン中・未登録会員向けボタン化」で対応する予定で`blocks/newsletter-optin-button.liquid`を実装・デプロイしたが、Shopifyの新カスタマーアカウント機能（マイページ）に同等の「マーケティング設定」トグルが標準で用意されていることが判明したため不要となり撤去済み。`footer-group.json`の`footer_m9NzUG`セクションの`blocks`/`block_order`は空に変更（`footer_utilities_jLGE8U`＝著作権表示・利用規約・SNSリンクは変更なし） |

---

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
| customer-sync の外部エンドポイント | `assets/customer-sync.js` の送信先 `https://arnulfo-fordable-pipingly.ngrok-free.dev/...` はngrok無料枠のため**URLが変わる/停止する可能性あり**。tokenもクライアント側にベタ書き（データ系了承済みだが、本番公開前に恒久的なエンドポイント・認証方式への切替を推奨） |
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

