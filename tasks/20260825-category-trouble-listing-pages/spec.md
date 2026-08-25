# category-trouble-listing-pages spec定義ドキュメント

## メタ情報（評価・考課用）
- 作成者: kazuto_hatsuyama@shuei-infotech.net
- 作成日: 20260825
- 着手日: 2026-08-25
- 対応難易度: M（見積もり）
- 不確実性: low（見積もり）
- ステータス: 進行中

## 要件定義（実装用）

### 誰の課題か
- データ系（D:\Inetpub\shopify_data）が156件のSmartCollection（カテゴリ87件＋お悩み69件）を作成済み。テーマ系（このプロジェクト）がそれらへのリンク一覧ページを新規作成する。エンドユーザー（ECサイト訪問者）が新設ページからカテゴリ・お悩みタグの一覧を閲覧し、該当コレクションへ遷移できるようにする。

### 現状
- 現行サイト（移行元 https://www.cosmetic-times.com/）には /category（カテゴリ一覧）・/trouble（お悩み一覧）という一覧ページが存在するが、Shopify側にはまだ同等の一覧ページが存在しない。
- データ系がShopify側にカテゴリ87件（第1階層7・第2階層27・第3階層53）・お悩み69件のSmartCollectionを作成済みだが、それらへ一括で辿れる導線ページがない。

### 変更後どうなるか
- sections/brand-list.liquid + templates/page.brand-list.json（2026-08-24作成のブランド一覧ページ）と同じ方式・命名パターンを踏襲し、新規セクション2件（category-list, trouble-list）とページテンプレート2件（page.category-list.json, page.trouble-list.json）を作成する。
- カテゴリ一覧ページ（sections/category-list.liquid）: 第1カテゴリ（7件）→第2カテゴリ（27件）→第3カテゴリ（53件）の入れ子階層をそのまま再現し、各項目（全階層）が/collections/{handle}への静的リンクになる。
- お悩み一覧ページ（sections/trouble-list.liquid）: 6グループ見出し（スキンケア/ベースメイク/メイクアップ/ボディケア/ヘアケア/その他のお悩み）ごとに69項目全件を列挙し、各項目が/collections/{handle}への静的リンクになる。
- brand-listと異なり、コレクション件数が今後増減しない前提のため、カテゴリ・お悩みのデータ（名称・handle・階層構造）はcollectionsオブジェクトからの動的取得ではなく、Liquidに直接ハードコードした静的HTMLとする（JSファイルは不要）。リンク先はcollection.urlのような動的解決ではなく/collections/{handle}の固定文字列。
- CSSは{% stylesheet %}ではなく{% style %}を使用する（ranking-list.liquid/brand-list.liquidで判明した、Horizonのコンパイル済みCSSバンドルに{% stylesheet %}が含まれないことがある既知の不具合を避けるため）。
- schemaはname（日本語名）、enabled_on.templates: ["page"]、settings に heading(text)・color_scheme(color_scheme, デフォルトscheme-1)、presetsに同名エントリを持つ（brand-list.liquidと同形式）。
- デザインは現行サイト/category（第1→第2→第3の入れ子構成）・/trouble（グループ見出し＋項目列挙）と同様の視覚的階層が伝わるようにし、サイトの高級感・デパコス（クリームホワイト×ゴールド）のデザイン方針に合わせる。具体的なCSSは実装者判断。
- 作業規模的に大きな変更（セクション追加）のため、CLAUDE.mdのGit運用ルールに従いfeature/category-trouble-listing-pagesブランチを作成して作業し、コミット・push（mainへのマージはユーザー確認後のため実施しない）。
- CLAUDE.mdの「カスタマイズ済みファイル」表に新規4ファイルの行を追記する。Admin API権限不足のためPageオブジェクト自体の作成（タイトル・ハンドル・テンプレート割り当て）はこの実行環境からはできない旨をbrand-list.liquidの行と同様に注記する（想定URL: /pages/category-list, /pages/trouble-list）。

### 受け入れ基準
- sections/category-list.liquid, templates/page.category-list.json, sections/trouble-list.liquid, templates/page.trouble-list.json の4ファイルが新規作成されていること。
- カテゴリ一覧: 第1カテゴリ7件・第2カテゴリ27件・第3カテゴリ53件（合計87件）が全て表示され、各項目のリンク先が指定されたhandle（英字/数字コード）で/collections/{handle}になっていること。子カテゴリを持たない第2・第1カテゴリはリンクのみで表示されること。
- お悩み一覧: 69項目全件（6グループ見出しごとに分類）が表示され、各項目のリンク先が指定されたhandle（4桁コード）で/collections/{handle}になっていること。項目名中の括弧（例:「カール・ハリ(マスカラ)」）はそのままテキスト表示されること。
- 両セクションともJSファイルを新規追加していないこと（静的ハードコードのみ）。
- {% style %}方式でCSSが記述されていること（{% stylesheet %}を使用していないこと）。
- featureブランチ（feature/category-trouble-listing-pages）でコミットし、GitHubへpush済みであること（mainへの直pushやマージはしない）。
- CLAUDE.mdの「カスタマイズ済みファイル」表に該当行が追記されていること。

## 対象外
- ヘッダーメニュー・フッター等からのこれら新規ページへの導線追加（本タスクはページ単体の作成のみ）。
- Shopify管理画面での実際のPageオブジェクト作成（Admin API権限不足のためこの実行環境では不可、ユーザー側対応事項として注記のみ行う）。

## 完了記録（評価・考課用、完了後に追記）
- 完了日:
- AI利用状況:
  - 利用有無:
  - 利用工程:
  - 補足コメント:
- 振り返り（任意）:
