# Gemini向けルール

`AGENTS.md` と `docs/ai/共通ルール.md` を優先して読むこと。Gemini固有の
提案を既存仕様に追加するときは、必ず `docs/requirements.md` と照合する。

ソースとバイナリを混在させず、ソースは `apps/source`、配布物は
`apps/binaries` に置く。秘密情報や未確認の外部データを出力・コミットしない。
