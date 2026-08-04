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
| `sections/main-collection.liquid` | カテゴリ一覧ページの商品グリッドループに`product.available`チェックを追加し、売り切れ商品を非表示に変更（新規・2026-08-03）。上記チェックがAvailabilityフィルター（在庫あり/在庫切れチェックボックス）を無効化していた不具合を修正 — `collection.filters`でAvailabilityフィルターが明示的に選択されているか判定し、選択時はShopify側の絞り込み結果をそのまま表示、未選択時（デフォルト）のみ`product.available`で追加フィルタするよう変更（2026-08-03）。デフォルト表示時の「n個のアイテム」件数表示を、コレクション全体の在庫あり件数に修正（`{% paginate collection.products by 1000 %}`の専用カウント用パスで算出。`collection.products`はpaginateタグ外だと50件でキャップされるため。**既知の制約**: paginateの上限が1000件のため、1000件を超えるコレクション（例: 全商品「all」＝3,100件）は先頭1000件分までしか集計されず、件数が実際より少なく出る。1ページあたりの表示件数が`products_per_page`設定より少なくなる場合がある点も既知の制約として残る、2026-08-03） |
| `templates/index.json` | トップページ全体リニューアル・ctFade修正・h1→h2 |
| `templates/product.json` | icons_style を "arrow" に修正・説明文ブロックを product-description タイプに変更（2026-06-10）。`hide_variants`を無効化し、全バリアントの画像を常にギャラリーに表示するよう変更（2026-08-04、下記参照）。"main"セクションの`color_scheme`が空文字になっておりバリアント選択の色分け・売り切れ表示が効かなくなっていたため`"scheme-1"`に修正（2026-08-04） |
| `snippets/product-media-gallery-content.liquid` | 商品詳細ページのメイン画像スクロール矢印が表示されるのに反応しない不具合を修正（2026-08-04）。`hide_variants`設定が有効かつ全画像がバリアント専用（共通画像なし）の商品では実際の表示枚数が1枚になるが、矢印・サムネイル表示判定がhide_variants適用前の生の画像枚数（`selected_product.media.size`）を見ていたため矢印だけ表示され続けていた。判定をフィルタ後の`sorted_media.size`に統一。各スライドに、対応するバリアントの`featured_media`と一致する場合`data-variant-id`属性を付与する新機能を追加（画像スクロールでバリアントを自動選択、2026-08-04） |
| `assets/media-gallery.js` | ユーザー操作（スクロール・ドラッグ・クリック）によるスライド変更時、表示中スライドに`data-variant-id`があれば対応するバリアントピッカーのラジオを自動選択し、価格・在庫状況・カートボタンを連動更新する機能を追加（新規・2026-08-04）。バリアント変更のたびにギャラリー自体を丸ごと置き換えると、選択中バリアントの画像が先頭に並び替わりスクロール位置がリセットされる不具合があったため、ギャラリースクロール自身が引き金となった変更の場合はギャラリーの置き換えをスキップするよう修正（2026-08-04） |
| `snippets/variant-main-picker.liquid` | インポート商品の一部で、バリアントが実質1つのみ（Shopify内部の英語プレースホルダーではなく日本語の literal な「タイトル」/「デフォルト」がオプション名・値として保存されている）にもかかわらず、`has_only_default_variant`が`false`と判定されバリアントピッカー（`variant_style: buttons`設定によりフィールドセット+ボタンとして描画）が表示されてしまう不具合を修正（2026-08-04）。オプション名が`タイトル`かつオプション値・バリアントが1つのみの場合を`has_only_default_variant`同様に扱い、バリアントピッカー全体を非表示にするよう変更 |
| `layout/theme.liquid` | Google Fonts + custom-luxury.css 追加。`{% render 'customer-sync' %}` 追加（2026-07-24） |
| `snippets/cart-summary.liquid` | ポイント使用検証UI追加（入力欄+適用ボタン、`points_used`カート属性セット）（2026-07-23）。保有ポイント/カート合計をdata属性で渡すよう追加（2026-07-30）。`cart-points-component`に`data-section-id`追加（2026-07-30）。`cart-points.js`のscriptタグを削除しグローバル読み込みへ移行（2026-07-30、下記参照）。ポイント上限チェックの`data-cart-subtotal`単位不一致（セント/円）を修正（2026-07-31）。ポイント入力欄の表示値を、Function（`cosmetic-discount`）と同じランク割引・上限計算式で独立に再計算しキャップするよう修正（`cart.total_price`からの逆算はキャップ時に0にフロアされ機能しないため、`cart.items_subtotal_price`ベースで再現、2026-07-31）。上記キャップ計算にクーポン割引額（cart-level・line-level のdiscount_code割引合算）も考慮するよう追加修正（2026-07-31） |
| `assets/cart-points.js` | 上記UIのAjax Cart API呼び出し処理（新規・2026-07-23）。入力値バリデーション（保有ポイント超過・カート合計超過・不正な数値）を追加（2026-07-30）。適用後にセクションを再取得し小計・ディスカウント行・見積もり合計をその場で再描画するよう修正（2026-07-30） |
| `assets/component-cart-items.js` | カートが空になった際に`points_used`属性・ディスカウントコードをクリア（2026-07-30・※テーマ更新で上書きリスク） |
| `assets/cart-discount.js` | クーポン適用時に`points_used`を強制クリアする処理を追加（2026-07-30）→**削除（2026-07-31）**。理由: 当初はクーポン+ポイント併用時の入力欄表示値を正しく計算するのが困難だったための暫定対応だったが、`cart-summary.liquid`にクーポン考慮のキャップ計算を実装したことで不要になった。現在はクーポン適用時もポイントはクリアされず、適用可能な額に自動でキャップ表示される（併用は許可する方針・※テーマ更新で上書きリスク） |
| `snippets/scripts.liquid` | `cart-points.js`のグローバル読み込みを追加（2026-07-30）。理由: 元々`cart-summary.liquid`（カートが空でない時のみレンダリング）内にscriptタグがあり、カートが空の状態でページ読込→遷移せず商品追加すると、scriptタグがmorphでDOM挿入されるだけで実行されず`cart-points-component`が never upgrade にならない不具合があったため、`cart-discount.js`と同じくグローバル読み込みに変更 |
| `snippets/customer-sync.liquid` | ログイン顧客のポイント/ランク連携用データ埋め込み（新規・2026-07-24） |
| `assets/customer-sync.js` | 顧客ID/emailを外部エンドポイントへ送信（セッション中1回・tokenベタ書き、新規・2026-07-24） |

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
