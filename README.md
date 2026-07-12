# 3DprintingDB

フィラメントの推奨印刷条件・乾燥条件・製品画像・作品例をまとめ、ブラウザーで
比較できる個人用Webサイト。既存のExpo + React Native構成をWeb向けに利用する。

## ディレクトリ

- `apps/source/3dprintingdb/` — Expo + React Native + TypeScript のWebサイトソース
- `.github/workflows/deploy-pages.yml` — GitHub Pagesへ公開するワークフロー
- `apps/binaries/` — 既存のモバイル配布物用領域（生成物はGit管理しない）
- `docs/` — 要件、実装計画、テスト仕様、AI向け共通ルール

## 開発

```sh
cd apps/source/3dprintingdb
npm install
npm run web
```

本番用の静的サイトは次のコマンドで `dist/` に出力する。

```sh
npm run build:web
```

## GitHub Pagesへの公開

1. リポジトリの **Settings > Pages > Build and deployment** で **GitHub Actions** を選ぶ。
2. `main` ブランチへのpush後、**Actions** の「GitHub Pagesへ公開」が成功することを確認する。
3. **Settings > Pages** に表示されるURLでサイトを確認する。

GitHub Proでは、リポジトリをprivateに変更してもGitHub Pagesの公開サイトを
外部公開できる。リポジトリのソース・履歴と公開サイトのURLを混同しないこと。
独自ドメインを使う場合は、private化の前後でDNS設定とHTTPSの状態を確認する。
標準の `github.io` URL用に、Webアセットのベースパスは `/3DprintingDB` としている。
独自ドメインを設定する場合は、この値を公開パスに合わせて更新する。

## データ方針

初期表示データは [3D Filament Profiles](https://3dfilamentprofiles.com/) を
参照したサンプルで、アプリ内のローカルストレージに保存する。外部サイトの
利用規約・robots.txt・取得頻度を確認してから実データ同期を実装する。
