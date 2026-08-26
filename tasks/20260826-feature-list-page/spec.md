# feature-list-page spec定義ドキュメント

## メタ情報（評価・考課用）
- 作成者: kazuto_hatsuyama@shuei-infotech.net
- 作成日: 20260826
- 着手日: 2026-08-26
- 対応難易度: M（見積もり）
- 不確実性: low（見積もり）
- ステータス: 完了

## 要件定義（実装用）

### 誰の課題か
- 特集ページを閲覧するECサイトの訪問者・既存顧客（画像・説明文付きの特集一覧から興味のある特集をクリックして商品コレクションへ遷移する）
- データ系(D:\Inetpub\shopify_data)担当者。現行サイトの特集ページをShopify Custom Collectionとして移行済み（handle形式 feature-{FeatureCD}、例: feature-179）で、今後も新しい特集の追加・削除を継続する運用者

### 現状
- データ系が2026-08-26に30件の特集をShopify Custom Collection（handle: feature-{FeatureCD}、title=特集名、image=バナー画像、body_html=説明文、商品は手動追加済み）として作成したが、これらを一覧できる専用ページがテーマ側にまだ存在しない。個別コレクションURLを直接知らないとアクセスできない
- 既存の一覧ページ実装には2パターンある: sections/category-list.liquid・sections/trouble-list.liquid はコレクション件数が増減しない前提の静的ハードコード方式。sections/brand-list.liquid + assets/brand-list.js はコレクション件数（567件）が多くpaginate上限250件を超えるため、collectionsオブジェクトを動的ループしSection Rendering API（?section_id=...&page=N）で残りページを自動取得する動的取得方式を採用している
- 特集は30件で件数は今後増減しうる（新規追加の可能性を排除しない）上、ストア全体のコレクション数（ブランド567+カテゴリ87+お悩み69+特集30=750件超）が250件superのため、静的ハードコード方式は不適で、brand-listと同じ動的取得方式を採用する必要がある

### 変更後どうなるか
- 新規ページ /pages/feature-list で、collectionsオブジェクトをループし、collection.handleが'feature-'で始まるものだけを抽出して一覧表示する（tags/rulesには依存しない、handleプレフィックス判定のみ）
- SSRは1ページ目（先頭250件）のみ描画し、assets配下の新規JSファイルがSection Rendering API経由で残りページを自動取得・統合し、JS無効時もSSR分は表示され続ける（brand-list.jsと同方式）
- 各カードはコレクション画像（バナー画像）・タイトル（特集名）・簡易説明文（body_htmlをstrip_html+truncate）を表示し、クリックでcollection.url（/collections/feature-{FeatureCD}）へ遷移する。デザインは既存brand-listのカードデザイン（画像枠→名称→簡易説明文）を踏襲する（現行サイト/specialページのバナー画像サムネイル+タイトル+説明文に近い見た目）
- 新規セクション名 feature-list（sections/feature-list.liquid）、新規ページテンプレート page.feature-list.json、enabled_on.templatesは['page']
- 0件時は「該当する特集が見つかりませんでした」等の空状態メッセージを表示する（brand-listのdata-brand-empty相当）

### 受け入れ基準
- /pages/feature-list ページで、handleが feature- で始まる全コレクション（250件超になっても)がJSにより最終的に全件表示される。1ページ目（250件以内）はJS無効でもSSRで表示される
- handleがfeature-で始まらないコレクション（ブランド・カテゴリ・お悩み等）は一覧に表示されない
- 各カードクリックでcollection.url（該当特集の商品一覧コレクションページ）に正しく遷移する
- 既存のsections/brand-list.liquidのカードデザイン・{% style %}方式（{% stylesheet %}はコンパイル済みCSSバンドルに含まれない既知の不具合があるため使用しない）を踏襲している
- snippets/scripts.liquidに、template.name=='page'かつtemplate.suffix=='feature-list'の場合のみ新規JSを読み込む条件分岐が追加されている（brand-listと同方式）

## 対象外（該当がある場合のみ）
- 個別特集の商品一覧ページ自体（既存のcollectionテンプレートで表示可能、追加実装不要と依頼元から明示されている）
- 実際のShopify Pageオブジェクト（タイトル・ハンドルfeature-list・テンプレート割り当て）の作成。この実行環境はAdmin API権限不足（write_content/write_online_store_pagesスコープ無し）のため実行不可であり、既存のbrand-list-page等のタスクと同様にユーザー側対応が必要
- brand-listのような五十音/A-Zタブ絞り込み・言語切替機能（特集は50音索引の必要性が薄いカード一覧のため、依頼内容にも含まれていない）

## 完了記録（評価・考課用、完了後に追記）
- 完了日: 2026-08-26
- AI利用状況:
  - 利用有無: あり
  - 利用工程: 要件整理,実装
  - 補足コメント: データ系(shopify_data)からの詳細な実装依頼文が要件を既に満たしていたため、追加ヒアリングなしでそのまま要件定義に整理。sections/feature-list.liquid, assets/feature-list.js, templates/page.feature-list.json の新規実装、snippets/scripts.liquidへの読み込み条件分岐追加、CLAUDE.mdのカスタマイズ済みファイル表更新まで一括実施。実装後 shopify theme check で新規ファイルにエラーが無いことを確認済み。
- 振り返り（任意）: 既存のsections/brand-list.liquid + assets/brand-list.jsの動的取得方式（Section Rendering APIによる250件超collectionsの自動取得）が非常に再利用しやすい形で確立されていたため、同種の一覧ページ追加が短時間で実装できた。今後同様のコレクション種別一覧ページが増える場合、共通化（例えば汎用的な「handleプレフィックスで絞り込む一覧セクション」）を検討する余地がある。
