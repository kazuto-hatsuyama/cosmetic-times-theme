# category-tag-links-to-smartcollection spec定義ドキュメント

## メタ情報（評価・考課用）
- 作成者: kazuto_hatsuyama@shuei-infotech.net
- 作成日: 20260825
- 着手日: 2026-08-25
- 対応難易度: S（見積もり）
- 不確実性: low（見積もり）
- ステータス: 完了

## 要件定義（実装用）

### 誰の課題か
- サイト訪問者（トップページのカテゴリナビ経由で商品カテゴリを探す顧客）
- データ系インスタンス（D:\Inetpub\shopify_data、SmartCollection設計・依頼元）とテーマ系インスタンス（D:\Inetpub\shopify_theme、実装担当）

### 現状
- 従来、商品には「カテゴリ:XXX」「お悩み:XXX」というタグが同期バッチ（sync_product.cfm等、変更なし）で付与されており、これらのタグをそのまま使いShopify標準のタグフィルタURL `/collections/all/{tag}` でカテゴリ・お悩みページを表示する設計だった
- データ系側で、同じタグを収集条件（rules: column=tag, relation=equals）とするSmartCollectionを156件（カテゴリ87件＋お悩み69件）新規作成し、検証ストア(cosmetic-times-prd)に反映・動作確認済み。対応表は D:\Inetpub\shopify_data\others\category_trouble_tag_handle_map.csv（列: tag, handle, title, level）
- 調査の結果、テーマ内で実際に `/collections/all/{tag}` 形式のタグフィルタURLを使っている箇所は `templates/index.json` の `category_grid` セクション（type: custom-liquid、名前「カテゴリナビ」）1箇所のみと判明。ここに5つの画像リンクがハードコードされており、それぞれ href="/collections/all/カテゴリ:スキンケア" / "...カテゴリ:メイクアップ" / "...カテゴリ:ボディケア" / "...カテゴリ:ヘアケア" / "...カテゴリ:雑貨・その他" となっている（img srcは旧サイトドメイン https://www.cosmetic-times.com/image/common/navitopic_*.jpg へのホットリンクで、これはCLAUDE.mdの「未対応事項」に別課題として既に記載済み・本タスクの対象外）
- 商品詳細ページのタグ表示（sections/product-extra-info.liquid）はcustom.skin_concern等のメタフィールドをリンクなしのプレーンテキストで表示しているのみで、タグフィルタURLは生成していない。パンくず（sections/breadcrumbs.liquid）はproduct.collectionsのみを参照しておりタグ経由のURLは使用していない。「お悩み:」タグを使った導線・リンク生成ロジックはテーマ内のどこにも存在しない（liquid/json/js全体を検索して確認済み）

### 変更後どうなるか
- templates/index.json の category_grid セクション内、5つの `<a href="/collections/all/カテゴリ:XXX">` を、対応表(category_trouble_tag_handle_map.csv)に基づき `<a href="/collections/{handle}">` へ張り替える: カテゴリ:スキンケア→/collections/skincare、カテゴリ:メイクアップ→/collections/makeup、カテゴリ:ボディケア→/collections/bodycare-care（対応表ではlevel=category_lv2、title=ボディケア）、カテゴリ:ヘアケア→/collections/haircare、カテゴリ:雑貨・その他→/collections/other
- img src・alt・その他のマークアップ・CSSは変更しない（画像の旧サイトホットリンク自体は別課題として現状維持）

### 受け入れ基準
- templates/index.json内のcategory_gridセクションの5つのhrefが上記の新URLに変更されている
- 変更後もliquid/JSON構文エラーがなくGitHub Actions経由のshopify theme pushが成功する
- デプロイ後、実際に各リンクをクリックして対応するSmartCollectionページ（該当商品一覧）が表示されることを確認する

## 対象外
- category_grid画像（img src）の旧サイトからShopify CDNへの移行（既存の別課題としてCLAUDE.md「未対応事項」に記載済み）
- 商品詳細ページへの新規タグリンクUI追加（現状リンクなしのプレーン表示のみで、本タスクは既存タグフィルタURLの張り替えが対象のため対象外）
- お悩みタグを使ったナビゲーションの新規追加（現状テーマ内に該当導線・リンクが一切存在しないため、張り替え対象が存在しない。将来的に新規導線を作る場合は別タスクとして起票する）

## 完了記録（評価・考課用、完了後に追記）
- 完了日: 2026-08-25
- AI利用状況:
  - 利用有無: あり
  - 利用工程: データ調査,実装,テスト
  - 補足コメント: task-init/spec-writerでのspec.md作成、Exploreサブエージェントによるテーマ内のタグフィルタURL使用箇所調査（templates/index.jsonのcategory_gridセクション1箇所のみと特定）、templates/index.json内5箇所のhref書き換え（Edit）、JSON構文検証・pushを通じたGitHub Actions Deploy to Shopify成功確認（run 32821469098）まで一貫してClaude Codeで実施。実施内容: category_trouble_tag_handle_map.csvの対応表に基づき、/collections/all/カテゴリ:XXX形式の5つのhrefを/collections/{handle}形式（skincare, makeup, bodycare-care, haircare, other）に張り替え。img srcの旧サイトホットリンクは別課題のため対象外のまま維持。CLAUDE.mdのカスタマイズ済みファイル表も更新し、main直pushでコミット・デプロイ成功済み。
- 振り返り（任意）: 事前のExploreエージェント調査により、テーマ内で/collections/all/{tag}形式のタグフィルタURLを使っていた箇所がtemplates/index.jsonのcategory_gridセクション1箇所（5リンク）のみと判明し、商品詳細ページのタグ表示・パンくず・お悩みタグ導線には該当箇所が存在しないと確認できた。これにより当初想定していた複数箇所（商品詳細・パンくず等）の改修は不要と分かり、実装スコープを最小限（1ファイル・5行の書き換え）に絞り込めた。事前の網羅調査が過剰実装を防いだ好例。
