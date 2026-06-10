# CLAUDE.md — Shopify テーマ作業ディレクトリ

---

## ストア・テーマ情報

| 項目 | 値 |
|---|---|
| ストア | cosmetic-times-dev.myshopify.com |
| 現行サイト（移行元） | https://www.cosmetic-times.com/ |
| テーマ名 | Horizon（公開中・liveテーマ） |
| テーマID | 158415487204 |

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

## ⚠️ テーマ標準ファイルへの変更（上書きリスクあり）

以下のファイルは Horizon テーマ標準ファイルを改変したもの。Shopify管理画面でテーマをアップデートすると**上書きされて修正が消える**。アップデート後は必ず再適用すること。

| ファイル | 変更内容 |
|---|---|
| `assets/variant-picker.js` | `buildRequestUrl` に `data-section-id` フォールバックを追加（バリアント切り替え画像更新修正） |

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
| 設定日 | 2026-05-21 |
| ファイル | `.github/workflows/deploy.yml` |
| トリガー | main ブランチへの push |
| 認証 | GitHub Secrets に `SHOPIFY_CLI_THEME_TOKEN` 登録済み |
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
| `sections/product-list.liquid` | 在庫あり優先ソート・スキーマ修正3件（2026-06-10） |
| `templates/index.json` | トップページ全体リニューアル・ctFade修正・h1→h2 |
| `templates/product.json` | icons_style を "arrow" に修正 |
| `layout/theme.liquid` | Google Fonts + custom-luxury.css 追加 |

---

## 未対応事項（次回以降に対応）

| 項目 | 内容 |
|---|---|
| category_grid 画像 | 5枚のカテゴリ画像が旧サーバー `https://www.cosmetic-times.com/image/common/navitopic_*.jpg` を参照中。旧サーバー停止前にShopify CDNへ移行が必要 |
| バリアント説明文切り替え | `text` ブロックはバリアント変更時の自動更新非対応。`type: "product-description"` ブロックへ変更すれば対応可能 |

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
