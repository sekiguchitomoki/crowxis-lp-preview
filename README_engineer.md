# Crowxis LP — 構成ドキュメント（エンジニア向け）

CFD販売「Crowxis（クロウシス）」ブランドLP。縦型フルページ（1画面ずつ遷移）の静的サイトです。
ビルドツール・フレームワークは不使用。**静的HTML/CSS/JSのみ**で動作します。

## ディレクトリ構成

```
index.html          エントリー（構造のみ・外部CSS/JSを参照）
css/
  style.css         サイト本体のスタイル（:root にデザイントークン変数を定義）
  gate.css          パスワードゲートのスタイル ※限定公開プレビュー専用・本番不要
js/
  main.js           LP本体のロジック（画面遷移・筆アニメ・テキスト分割・canvas演出）
  gate.js           パスワードゲートのロジック ※限定公開プレビュー専用・本番不要
assets/             画像・動画・SVG・フォント素材（相対パス参照）
v1/                 旧デザイン（凍結・参照用）
```

## 読み込み順序（依存関係）

- CSS: `style.css` →  `gate.css` の順。`gate.css` は `style.css` の `:root` 変数
  （`--gold` / `--paper` / `--f-min` 等）を参照するため、必ず後に読み込むこと。
- JS: `gate.js`（`<body>` 冒頭・ゲート直後）→ `main.js`（`</body>` 直前）。
  どちらも即時実行関数（IIFE）で、グローバルを汚さない。

## パスワードゲートについて（本番では削除可）

`gate.css` / `gate.js` と `index.html` 内の `<div id="pwGate">` ブロックは、
**限定公開プレビュー（GitHub Pages）専用の簡易ゲート**です。本番公開時は以下を削除してください。

1. `index.html` の `<!-- パスワードゲート -->` 〜 `<script src="js/gate.js"></script>` まで
2. `<link rel="stylesheet" href="css/gate.css">` の行
3. `css/gate.css` / `js/gate.js` ファイル自体

※SHA-256ハッシュをJSに埋め込んだクライアントサイド認証で、セキュリティ用途ではありません。

## フォント

- 大見出し: Adobe Garamond Pro（未導入環境は Google Fonts の EB Garamond にフォールバック）
- 中文字（明朝）: リュウミン Pr6N →（未導入時）ヒラギノ明朝 → Noto Serif JP
- 細字: Noto Sans JP
- Google Fonts を `<head>` で読み込み。CSS変数 `--f-en` / `--f-min` / `--f-sans` で切替。

## 画面構成（フルページ6面）

hero → message → movie（ブランドCM・動画は未定でブランク） → about（Crowxisとは） → news → footer
ホイール / スワイプ / 矢印キー / 右端ドットで1画面ずつ遷移します。

## QA・確認用モード（`main.js` に実装）

ヘッドレスブラウザや静止確認のため、URLクエリで完成状態を静止表示できます。

- `?screen=N` … N番目の画面だけを完成状態で静止表示（アニメ完了状態）
- `?final`     … 全画面を縦に並べて完成状態で表示

## ローカル確認

相対パス参照のため、ローカルサーバー経由で開いてください（file:// でも概ね動作）。

```bash
cd <このフォルダ>
python3 -m http.server 8000
# http://localhost:8000/  （プレビューのパスワードは別途共有）
```
