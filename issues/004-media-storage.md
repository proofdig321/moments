# Issue: Message media storage and migrations

Priority: P0

Summary:
Verify media pipeline (`src/media.js`) and ensure `scripts/create_storage_bucket.js` is run during deploys; centralize migrations.

Acceptance criteria:
- Storage bucket script validated and idempotent.
- Migration runner documented or added to `scripts/`.
- `test-message-storage.js` passes in CI.
