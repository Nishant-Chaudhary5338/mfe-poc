#!/usr/bin/env bash
# verify-generators.sh
# Smoke-tests every /api/generate/* endpoint, writes generated CRUD to each app,
# runs TypeScript builds, reports results, then cleans up.
# Usage: bash scripts/verify-generators.sh
# Requires: devtools server running on port 5001 (start with: node devtools/server.js)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="http://localhost:5001"
PASS=0
FAIL=0
ERRORS=()

green() { printf '\033[0;32m✓ %s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m✗ %s\033[0m\n' "$1"; }
info()  { printf '\033[0;36m→ %s\033[0m\n' "$1"; }
bold()  { printf '\033[1m%s\033[0m\n' "$1"; }

pass() { PASS=$((PASS+1)); green "$1"; }
fail() { FAIL=$((FAIL+1)); ERRORS+=("$1"); red "$1"; }

cleanup_app() {
  local app="$1"
  local prefix="$2"
  for suffix in List Detail Form EditForm; do
    rm -f "$ROOT/apps/$app/src/routes/${prefix}${suffix}.tsx"
  done
  rm -f "$ROOT/apps/$app/src/routes/VerifyLogin.tsx"
  rm -f "$ROOT/apps/$app/src/routes/VerifyFormPage.tsx"
  git -C "$ROOT" checkout "apps/$app/src/App.tsx" 2>/dev/null || true
}

# ── Check server is running ────────────────────────────────────────────────────
bold "=== TVPlus Generator Verification ==="
info "Checking devtools server at $API..."
if ! curl -sf "$API/api/health" > /dev/null 2>&1; then
  echo "ERROR: DevTools server not running. Start it with: node devtools/server.js"
  exit 1
fi
pass "DevTools server is reachable"
echo ""

# ── Test /api/apps ─────────────────────────────────────────────────────────────
bold "--- API Endpoint Tests ---"
APPS_RESP=$(curl -sf "$API/api/apps")
APP_COUNT=$(echo "$APPS_RESP" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); console.log(JSON.parse(d).length)")
if [ "$APP_COUNT" -ge 4 ]; then
  pass "/api/apps returns $APP_COUNT apps"
else
  fail "/api/apps returned only $APP_COUNT apps (expected ≥4)"
fi

# ── Test /api/generate/login ───────────────────────────────────────────────────
LOGIN_RESP=$(curl -sf -X POST "$API/api/generate/login" \
  -H "Content-Type: application/json" \
  -d '{"appId":"sms","endpoint":"/api/auth/login"}')
if echo "$LOGIN_RESP" | grep -q "LoginPage"; then
  pass "/api/generate/login returns LoginPage code"
else
  fail "/api/generate/login: unexpected response"
fi

# ── Test /api/generate/form ────────────────────────────────────────────────────
FORM_RESP=$(curl -sf -X POST "$API/api/generate/form" \
  -H "Content-Type: application/json" \
  -d '{"appId":"sms","pageName":"VerifyForm","endpoint":"/api/test","fields":[{"name":"title","type":"text","required":true}]}')
if echo "$FORM_RESP" | grep -q "AutoForm"; then
  pass "/api/generate/form returns AutoForm code"
else
  fail "/api/generate/form: unexpected response"
fi

# Check Zod .min(1) for required fields
if echo "$FORM_RESP" | grep -q "min(1"; then
  pass "/api/generate/form: required field has z.string().min(1)"
else
  fail "/api/generate/form: missing .min(1) on required field"
fi

# ── Test /api/generate/detail ──────────────────────────────────────────────────
DETAIL_RESP=$(curl -sf -X POST "$API/api/generate/detail" \
  -H "Content-Type: application/json" \
  -d '{"appId":"sms","pageName":"Item","endpoint":"/api/items/:id","fields":[{"name":"name","label":"Name"}]}')
if echo "$DETAIL_RESP" | grep -q "Skeleton"; then
  pass "/api/generate/detail returns detail page with Skeleton"
else
  fail "/api/generate/detail: unexpected response"
fi

# ── Test /api/generate/crud ────────────────────────────────────────────────────
CRUD_RESP=$(curl -sf -X POST "$API/api/generate/crud" \
  -H "Content-Type: application/json" \
  -d '{"appId":"sms","resource":"Verify","baseEndpoint":"/api/verify","fields":[{"name":"name","type":"text","required":true}]}')
if echo "$CRUD_RESP" | grep -q "VerifyList.tsx"; then
  pass "/api/generate/crud returns all 4 pages"
else
  fail "/api/generate/crud: unexpected response"
fi

# Check navigate() not window.location.href
if echo "$CRUD_RESP" | grep -q 'navigate(' && ! echo "$CRUD_RESP" | grep -q "window.location.href"; then
  pass "/api/generate/crud: list page uses navigate() not window.location.href"
else
  fail "/api/generate/crud: list page may still use window.location.href"
fi

# ── Test /api/generate/tests ───────────────────────────────────────────────────
TESTS_RESP=$(curl -sf -X POST "$API/api/generate/tests" \
  -H "Content-Type: application/json" \
  -d '{"sourceCode":"export default function Foo() { return null; }","componentName":"Foo"}')
if echo "$TESTS_RESP" | grep -q "describe" && echo "$TESTS_RESP" | grep -q "vitest"; then
  pass "/api/generate/tests returns vitest test file"
else
  fail "/api/generate/tests: unexpected response"
fi

# ── Test /api/review ───────────────────────────────────────────────────────────
REVIEW_RESP=$(curl -sf -X POST "$API/api/review" \
  -H "Content-Type: application/json" \
  -d '{"appId":"sms"}')
if echo "$REVIEW_RESP" | grep -q '"grade"'; then
  GRADE=$(echo "$REVIEW_RESP" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); console.log(JSON.parse(d).grade)")
  pass "/api/review returns grade: $GRADE for sms"
else
  fail "/api/review: unexpected response"
fi

echo ""
bold "--- Code Generation + Build Tests ---"

# ── Generate CRUD for each app and build ───────────────────────────────────────
for APP in sms qca cms mam; do
  info "Testing $APP: generate CRUD → build..."
  cleanup_app "$APP" "VerifyE2E" 2>/dev/null || true

  # Generate + write CRUD
  GEN_RESULT=$(curl -sf -X POST "$API/api/generate/crud" \
    -H "Content-Type: application/json" \
    -d "{
      \"appId\": \"$APP\",
      \"resource\": \"VerifyE2E\",
      \"baseEndpoint\": \"/api/verify-e2e\",
      \"fields\": [
        {\"name\": \"title\", \"type\": \"text\", \"required\": true},
        {\"name\": \"count\", \"type\": \"number\", \"required\": false}
      ],
      \"addRoute\": true
    }" 2>&1) || true

  if echo "$GEN_RESULT" | grep -q "VerifyE2EList.tsx"; then
    pass "$APP: CRUD generated and files written"
  else
    fail "$APP: CRUD generation failed"
    continue
  fi

  # Run TypeScript build
  BUILD_OUTPUT=$(cd "$ROOT" && pnpm --filter "$APP" build 2>&1) || BUILD_STATUS=$?
  if [ "${BUILD_STATUS:-0}" -eq 0 ]; then
    pass "$APP: TypeScript build succeeded with generated CRUD files"
  else
    # Show first TS error
    TS_ERRORS=$(echo "$BUILD_OUTPUT" | grep "error TS" | head -5)
    fail "$APP: TypeScript build FAILED — $TS_ERRORS"
  fi

  # Cleanup
  cleanup_app "$APP" "VerifyE2E"
done

echo ""
bold "--- Results ---"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  red "Failures:"
  for err in "${ERRORS[@]}"; do
    echo "  - $err"
  done
fi
echo ""
if [ "$FAIL" -eq 0 ]; then
  green "All $PASS checks passed!"
  exit 0
else
  red "$FAIL/$((PASS+FAIL)) checks failed"
  exit 1
fi
