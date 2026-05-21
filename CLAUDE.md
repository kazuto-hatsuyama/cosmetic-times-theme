# CLAUDE.md — Shopify テーマ作業ディレクトリ

## ストア・テーマ情報

| 項目 | 値 |
|---|---|
| ストア | cosmetic-times-dev.myshopify.com |
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
