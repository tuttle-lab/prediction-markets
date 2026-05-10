#!/usr/bin/env bash
set -e

# ── Reads kickstart.config.yml and wires up GitHub + GH Pages ──
# Dependencies: gh (GitHub CLI), python3
# Usage: ./scripts/setup.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT/kickstart.config.yml"
SECRETS_DIR="$ROOT/../.secrets"

# Parse YAML values (no yq dependency — pure python)
get() {
  python3 -c "
import re, sys
key = '$1'
for line in open('$CONFIG'):
    m = re.match(r'\s*' + re.escape(key) + r':\s*(.+)', line)
    if m:
        val = m.group(1).strip().strip('\"')
        print(val); sys.exit()
print('')
" 2>/dev/null || true
}

REPO=$(get github_repo)
VERCEL_URL=$(get vercel_production_url)
BASE_PATH=$(get github_pages_base_path)
PROJECT=$(get name)
SUPABASE_URL=$(get supabase_url)
SUPABASE_ANON_KEY=$(get supabase_anon_key)

echo "▶  Project  : $PROJECT"
echo "▶  Repo     : $REPO"
echo "▶  Vercel   : $VERCEL_URL"
echo "▶  GH Pages : https://${REPO%%/*}.github.io${BASE_PATH}"
echo ""

# ── GitHub Actions variables (public, safe to store as vars) ──
echo "Setting GitHub Actions variables..."
gh variable set VITE_API_URL --body "${VERCEL_URL}/api" --repo "$REPO"
echo "  ✓ VITE_API_URL=${VERCEL_URL}/api"

if [ -n "$SUPABASE_URL" ]; then
  gh variable set VITE_SUPABASE_URL    --body "$SUPABASE_URL"     --repo "$REPO"
  gh variable set VITE_SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY" --repo "$REPO"
  echo "  ✓ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY"
fi

# ── GitHub Actions secrets (sensitive, from .secrets/) ────────
SECRETS_FILE="$SECRETS_DIR/supabase.env"
if [ -f "$SECRETS_FILE" ]; then
  echo "Setting GitHub Actions secrets from .secrets/supabase.env..."
  SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY "$SECRETS_FILE" | cut -d= -f2-)
  if [ -n "$SERVICE_KEY" ]; then
    gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SERVICE_KEY" --repo "$REPO"
    echo "  ✓ SUPABASE_SERVICE_ROLE_KEY"
  fi
else
  echo "  ℹ  No .secrets/supabase.env found — skipping service role key"
fi

# ── Update vite.config base path in workflow ──────────────────
WORKFLOW="$ROOT/.github/workflows/deploy-pages.yml"
sed -i "s|VITE_BASE_PATH:.*|VITE_BASE_PATH: $BASE_PATH|" "$WORKFLOW"
echo "  ✓ VITE_BASE_PATH=$BASE_PATH in deploy-pages.yml"

# ── Enable GitHub Pages (idempotent) ──────────────────────────
echo "Enabling GitHub Pages..."
gh api "repos/$REPO/pages" -X POST --field build_type=workflow 2>/dev/null \
  && echo "  ✓ GitHub Pages enabled" \
  || echo "  ✓ GitHub Pages already enabled"

echo ""
echo "Done. Commit any changed files and push to deploy."
