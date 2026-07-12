# バイナリ管理

このフォルダはビルド済み配布物だけを置く。

- `android/` — `.apk`（検証用）と `.aab`（Google Play提出用）
- `ios/` — `.ipa`（検証用）
- ファイル名は `3dprintingdb-<platform>-<version>-<build>.<ext>` とする。
- バイナリ本体は容量・署名情報を考慮してGit管理しない。共有ストレージや
  GitHub Actions Artifactを使い、ここには取得手順とメタデータだけを残す。
- `.keystore`、証明書、プロビジョニングプロファイルは絶対に置かない。
