# 3DprintingDB

フィラメントの推奨印刷条件・乾燥条件・製品画像・作品例をまとめ、比較できる
Android / iOS クロスプラットフォームアプリ。

## ディレクトリ

- `apps/source/3dprintingdb/` — Expo + React Native + TypeScript のアプリソース
- `apps/binaries/` — Android APK/AAB・iOS IPA の配布物（生成物はGit管理しない）
- `docs/` — 要件、実装計画、テスト仕様、AI向け共通ルール

## 開発

```sh
cd apps/source/3dprintingdb
npm install
npm run start
```

`npm run android` または `npm run ios` で実機・エミュレーターを起動できる。
iOSのネイティブビルドにはmacOSが必要。詳細は `docs/` 配下を参照すること。

## データ方針

初期表示データは [3D Filament Profiles](https://3dfilamentprofiles.com/) を
参照したサンプルで、アプリ内のローカルストレージに保存する。外部サイトの
利用規約・robots.txt・取得頻度を確認してから実データ同期を実装する。
