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
| ブランド方向性 | 高級感・デパコス（ゴールドアクセント、ダーク系） |
| 取扱ブランド数 | 151ブランド（CHANEL, DIOR, SHISEIDO 等） |

## トップページ構成（templates/index.json）

現在のセクション順：

1. **ヒーロー**（`hero_jVaWmY`）- 「デパコスが驚きの価格で」フルwidth背景画像
2. **カテゴリナビ**（`category_grid`）- 現行サイト画像を使った5カテゴリグリッド
   - スキンケア / メイクアップ / ボディケア / ヘアケア / コフレ・雑貨
   - 画像元: `https://www.cosmetic-times.com/image/common/navitopic_*.jpg`
3. **プロモーションバナー**（`promo_banners`）- 2カラム横並び
   - SALE: `https://www.cosmetic-times.com/image/sale/outlet_banner.png` 使用（最大80%OFF）
   - 新着商品: ダークネイビー系グラデーション
4. **ブランドマーキー**（`marquee_brands`）- 12ブランド横スクロール
5. **商品一覧**（`product_list_fa6P9H`）- 新着商品、4カラムグリッド

## カスタマイズ済みファイル

### sections/product-list.liquid
- 商品ループを在庫あり優先ソートに変更（2026-05-22）
- `available: true` の商品を先頭、`false` を末尾に並べ替え
- `paginate` の取得件数を `fetch_limit = 50` に拡張してからソート

### templates/index.json
- トップページ全体を現行サイト（cosmetic-times.com）を参考にリニューアル（2026-05-22）
- 現行サイトの画像（navitopic, outlet_banner）をそのまま使用

## 現行サイトから流用できる画像URL

```
# カテゴリ画像
https://www.cosmetic-times.com/image/common/navitopic_skincare.jpg
https://www.cosmetic-times.com/image/common/navitopic_makeup.jpg
https://www.cosmetic-times.com/image/common/navitopic_body.jpg
https://www.cosmetic-times.com/image/common/navitopic_haircare.jpg
https://www.cosmetic-times.com/image/common/navitopic_coffret.jpg

# バナー
https://www.cosmetic-times.com/image/sale/outlet_banner.png

# ロゴ
https://www.cosmetic-times.com/image/common/header_logo_ct2.png

# LINE
https://www.cosmetic-times.com/image/top/line_frends.png
```

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
