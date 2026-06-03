# CLAUDE.md — Shopify テーマ作業ディレクトリ

## ストア・テーマ情報

| 項目 | 値 |
|---|---|
| ストア | cosmetic-times-dev.myshopify.com |
| 現行サイト（移行元） | https://www.cosmetic-times.com/ |
| テーマ名 | Horizon（公開中・liveテーマ） |
| テーマID | 158415487204 |

## GitHubリポジトリ

| 項目 | 値 |
|---|---|
| URL | https://github.com/kazuto-hatsuyama/cosmetic-times-theme |
| ブランチ | main |
| ローカルパス | D:\Inetpub\shopify_theme\ |

## 作業フロー

> **ユーザーは指示を出すだけ。ファイル編集・コマンド実行はすべてClaudeが行う。**

```
1. ユーザーが変更内容を指示
2. Claude がファイルを編集
3. Claude が git add / commit / push を実行
4. GitHub Actions が自動で shopify theme push を実行（Shopify へ反映）
```

### GitHub Actions 自動デプロイ（2026-05-21 設定済み）
- `.github/workflows/deploy.yml` を配置済み
- `main` ブランチへの push をトリガーに自動デプロイ
- GitHub Secrets に `SHOPIFY_CLI_THEME_TOKEN` 登録済み
- Actions 確認: https://github.com/kazuto-hatsuyama/cosmetic-times-theme/actions

## サイト概要・デザイン方針

| 項目 | 内容 |
|---|---|
| 業種 | 化粧品EC（デパコス・ブランドコスメ） |
| ターゲット | 30〜50代女性 |
| ブランド方向性 | 高級感・デパコス（クリームホワイト×ゴールド、明るい高級感） |
| 取扱ブランド数 | 151ブランド（CHANEL, DIOR, SHISEIDO 等） |

## トップページ構成（templates/index.json）

現在のセクション順（2026-05-22 リニューアル後）：

1. **ヒーロースライドショー**（`hero_jVaWmY`）- `type:custom-liquid` / CSSフェードアニメーション3枚スライド
   - Shopify CDN画像3枚を15秒サイクルで切り替え（animation-delay: 0s / 5s / 10s）
   - `@keyframes ctFade` による純CSS実装（JS不使用）
   - キャッチコピー「デパコスが驚きの価格で」・CTAボタン「今すぐショッピング」付き
2. **カテゴリナビ**（`category_grid`）- 現行サイト画像を使った5カテゴリグリッド
   - スキンケア / メイクアップ / ボディケア / ヘアケア / コフレ・雑貨
   - 画像元: `https://www.cosmetic-times.com/image/common/navitopic_*.jpg`
   - `.ct-cat-item` の `aspect-ratio: 1/1`（正方形）で表示
3. **商品一覧**（`product_list_fa6P9H`）- 新着商品、4カラムグリッド
   - 新着画像 `max-height: 220px`（CSS section 19）で制約
4. **ブランドマーキー**（`marquee_brands`）- 12ブランド横スクロール
5. **プロモーションバナー**（`promo_banners`）- 2カラム横並び（`type:custom-liquid`）
   - SALE: Shopify CDN `outlet_banner.png` 使用（最大80%OFF）
   - 新着商品: Shopify CDN `20200623deo_slide.jpg` を背景に使用

## カスタマイズ済みファイル

### assets/custom-luxury.css
- Luxury Design System **v4.0**（2026-05-22）
- 方針: **レイアウトは変えない** / 色・フォント・ホバーのみ上書き
- `body [class*="color-scheme"]` セレクタで specificity (0,1,1) → Shopify の `.color-scheme-1` (0,1,0) を確実に上書き
- Cream White (`#FAFAF7`) + Gold (`#C9A84C`) + Cormorant Garamond / **Noto Sans JP**（v3.0 の Noto Serif JP から変更）
- Section 18: 商品詳細ページ画像 `max-width: 440px`（デスクトップのみ）
- Section 19: 新着商品カード画像 `max-height: 220px`

### sections/product-list.liquid
- 商品ループを在庫あり優先ソートに変更（2026-05-22）
- `available: true` の商品を先頭、`false` を末尾に並べ替え
- `paginate` の取得件数を `fetch_limit = 50` に拡張してからソート

### templates/index.json
- トップページ全体を高級感デパコスデザインにリニューアル（2026-05-22）
- ヒーローを `type:hero` → `type:custom-liquid` に変更（CDN URL直接指定のため）
- Shopify CDN登録済み画像を全面採用
- セクション順: hero → category_grid → **product_list** → marquee_brands → promo_banners（商品一覧を上位に移動）
- category_grid の `.ct-cat-item` に `aspect-ratio: 1/1`（正方形）を適用

### layout/theme.liquid
- Google Fonts（Cormorant Garamond + **Noto Sans JP**）を `<head>` 先頭に追加
- `custom-luxury.css` を `color-schemes` の後に読み込み

## Shopify CDN 登録済み画像URL

```
# ヒーロー・バナー用
https://cdn.shopify.com/s/files/1/0807/5821/0788/files/1000_320.png?v=1779421972
https://cdn.shopify.com/s/files/1/0807/5821/0788/files/outlet_banner.png?v=1779421975
https://cdn.shopify.com/s/files/1/0807/5821/0788/files/20200623deo_slide.jpg?v=1779421972
```

## 現行サイトから流用できる画像URL

```
# カテゴリ画像
https://www.cosmetic-times.com/image/common/navitopic_skincare.jpg
https://www.cosmetic-times.com/image/common/navitopic_makeup.jpg
https://www.cosmetic-times.com/image/common/navitopic_body.jpg
https://www.cosmetic-times.com/image/common/navitopic_haircare.jpg
https://www.cosmetic-times.com/image/common/navitopic_coffret.jpg

# ロゴ
https://www.cosmetic-times.com/image/common/header_logo_ct2.png

# LINE
https://www.cosmetic-times.com/image/top/line_frends.png
```

## 既知の注意事項（ハマりやすい点）

### `type:hero` は CDN URL を JSON で指定できない
- Shopify の `hero` セクションタイプは画像IDをShopify管理画面経由でのみ設定可能
- CDN URLを直接使いたい場合は `type:custom-liquid` でHTMLを書く

### `shopify theme pull` は絶対に単独実行しない
- フル pull を実行すると `templates/index.json` がサーバー版（シンプル版）に上書きされる
- 実行前に必ず `git stash` → pull 後に `git checkout -- <ファイル名>` で復元
- 通常は不要。緊急時のみ `--only` で特定ファイルのみpull

### `backdrop-filter` はヘッダーに使わない
- `backdrop-filter: blur()` はスタッキングコンテキストを生成しヘッダーレイアウトを破壊する
- 透明ヘッダーモードが機能しなくなるため禁止

## よく使うコマンド

### テーマ取得（Shopify → ローカル）
```powershell
shopify theme pull --store cosmetic-times-dev.myshopify.com --theme 158415487204
```

### テーマ反映（手動・緊急時）
```powershell
# 全ファイル
shopify theme push --store cosmetic-times-dev.myshopify.com --theme 158415487204 --allow-live

# 1ファイルだけ（例: layout/theme.liquid）
shopify theme push --store cosmetic-times-dev.myshopify.com --theme 158415487204 --allow-live --only 'layout/theme.liquid'
```

> 通常は git push で自動デプロイされるため手動実行は不要。
> `--allow-live` は公開中テーマへのプッシュに必須。

### Git
```powershell
git add <ファイルパス>
git commit -m "変更内容"
git push origin main
```

## .gitignore 除外対象
- `.shopify`（Shopify CLI設定、環境固有）
- `config/settings_data.json`（テーマエディタ設定、環境固有）
