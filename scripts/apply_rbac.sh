#!/usr/bin/env bash
set -euo pipefail

# Apply supabase/rbac.sql to a Postgres database using psql.
# Requires either DATABASE_URL or SUPABASE_DB_URL environment variable (full postgres connection string).

SQL_FILE="supabase/rbac.sql"
DB_URL="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: Set DATABASE_URL or SUPABASE_DB_URL to your Postgres connection string."
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: $SQL_FILE not found"
  exit 1
fi

echo "Applying RBAC policies from $SQL_FILE to $DB_URL"

if command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -f "$SQL_FILE" --set ON_ERROR_STOP=on
  echo "RBAC policies applied via psql."
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "psql not found; attempting to run psql inside Docker postgres image as a fallback..."
  docker run --rm -i postgres:15 psql "$DB_URL" -f - < "$SQL_FILE" && echo "RBAC policies applied via Docker psql." && exit 0 || true
fi

cat <<EOF
ERROR: Could not run psql to apply RBAC policies.

Options to proceed:
  1) Install psql client locally (Debian/Ubuntu):
       sudo apt update && sudo apt install -y postgresql-client
     Then re-run:
       npm run apply:rbac

  2) Use Docker (if available): the script attempted this but it failed.

  3) Apply the SQL manually via Supabase SQL Editor:
       - Open your Supabase project > SQL Editor
       - Paste the contents of `supabase/rbac.sql` and run it

  4) Run the script on a machine that has network access to your Postgres and psql installed.

If you want, I can modify the script to print more debug information.
EOF

exit 1
