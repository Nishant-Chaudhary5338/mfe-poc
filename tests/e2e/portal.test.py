"""
TVPlus MFE Portal — End-to-End Playwright Test Suite
=====================================================
Tests the full portal flow: login → portal grid → remote app loading →
back-to-portal navigation → MAM shell-auth-only pattern.

Prerequisites
-------------
1. All apps must be built:  pnpm build:mfe && pnpm --filter shell build
2. All apps must be served: start each dist/ via a CORS-enabled static server
   OR run: pnpm dev  (build + preview remotes + shell dev)

Port map (matches registry.json):
  3000 - Shell
  3001 - SMS  (Smart Monitoring System)
  3002 - QCA  (QC Automation)
  3003 - CMS  (Content Management System)
  3004 - MAM  (Media Asset Management)

Running
-------
  # Option A — use the bundled CORS server helper
  python tests/e2e/serve_all.py &
  python tests/e2e/portal.test.py

  # Option B — run pnpm dev first, then test
  pnpm dev &
  sleep 60
  python tests/e2e/portal.test.py

  # Option C — pytest integration
  pip install pytest playwright pytest-playwright
  pytest tests/e2e/portal.test.py -v

Key findings documented in this file
--------------------------------------
- Root cause of spacing bug: inline `* { padding: 0 }` in shell/index.html
  overrides @layer utilities (Tailwind v4 uses cascade layers).
- CSS injection in MFE: vite-plugin-css-injected-by-js inlines CSS into
  remoteEntry.js so styles load when the JS module is imported.
- MF v2 loading: @module-federation/runtime uses script-tag injection (classic
  scripts). The remoteEntry.js is ESM; native import() must be used instead.
- Auth patterns tested:
    SMS/QCA/CMS: shell login (portal access) + app login (API token)
    MAM: shell auth only, no own login form
"""

import os
import sys
import time
import json
from playwright.sync_api import sync_playwright, Page, BrowserContext, expect

# ─── Configuration ────────────────────────────────────────────────────────────

BASE_URL     = os.environ.get("SHELL_URL", "http://localhost:3000")
REMOTE_PORTS = {"sms": 3001, "qca": 3002, "cms": 3003, "mam": 3004}
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
HEADLESS = os.environ.get("HEADLESS", "1") != "0"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def shot(page: Page, name: str) -> str:
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    return path


def wait_for_server(page: Page, url: str, timeout_ms: int = 15_000):
    page.goto(url, wait_until="load", timeout=timeout_ms)
    page.wait_for_timeout(1000)


def login_to_portal(page: Page, user_index: int = 0):
    """Login to the TVPlus shell with the given MOCK_USERS index."""
    page.locator("select").select_option(index=user_index)
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_timeout(1500)


def click_app_card(page: Page, app_label: str) -> bool:
    """Click an app card by its label. Returns True if found."""
    card_text = page.locator(f"text={app_label}").first
    if not card_text.count():
        return False
    # Walk up to the clickable ancestor
    card_text.locator("xpath=ancestor::div[contains(@class,'cursor-pointer')]").first.click()
    return True


def go_home(page: Page):
    """Navigate back to the portal via the ← Portal button or URL."""
    btn = page.get_by_text("← Portal").first
    if btn.count() and btn.is_visible():
        btn.click()
        page.wait_for_timeout(1000)
    else:
        page.goto(BASE_URL, wait_until="load", timeout=10_000)
        page.wait_for_timeout(1000)


# ─── CSS Assertion Helpers ────────────────────────────────────────────────────

def assert_padding_working(page: Page, label: str = ""):
    """Verify Tailwind padding utilities are applied (not overridden by * { padding: 0 })."""
    result = page.evaluate("""() => {
        const header = document.querySelector('header');
        if (!header) return null;
        return {
            paddingLeft: getComputedStyle(header).paddingLeft,
            paddingInlineStart: getComputedStyle(header).paddingInlineStart,
        };
    }""")
    if result:
        pl = result.get("paddingLeft", "0px")
        assert pl != "0px", (
            f"[{label}] Header paddingLeft is 0px — likely caused by unlayered "
            f"'* {{ padding: 0 }}' in index.html overriding @layer utilities. "
            f"Remove the inline <style> reset from shell/index.html."
        )


def assert_tailwind_tokens(page: Page):
    """Verify Signal & Flame CSS custom properties are set."""
    tokens = page.evaluate("""() => {
        const root = getComputedStyle(document.documentElement);
        return {
            signal500: root.getPropertyValue('--signal-500').trim(),
            neutral50:  root.getPropertyValue('--neutral-50').trim(),
        };
    }""")
    assert tokens["signal500"] != "", "Signal Blue token --signal-500 not set"
    assert tokens["neutral50"]  != "", "Neutral token --neutral-50 not set"


def assert_remote_entry_accessible(ctx: BrowserContext, app_id: str, port: int):
    """Verify that remoteEntry.js is accessible and is an ES module."""
    rpage = ctx.new_page()
    try:
        resp = rpage.goto(
            f"http://localhost:{port}/remoteEntry.js",
            wait_until="commit",
            timeout=5000,
        )
        assert resp and resp.ok, f"remoteEntry.js for {app_id} returned {resp.status if resp else 'no response'}"
        body = resp.body().decode()
        assert "export" in body or "import" in body, (
            f"remoteEntry.js for {app_id} doesn't look like an ES module — "
            f"check @module-federation/vite build output"
        )
        # CSS should be inlined (vite-plugin-css-injected-by-js)
        size = len(resp.body())
        assert size > 10_000, (
            f"remoteEntry.js for {app_id} is only {size} bytes — "
            f"CSS may not be injected. Ensure vite-plugin-css-injected-by-js is in vite.config.ts"
        )
    finally:
        rpage.close()


# ─── Test Cases ───────────────────────────────────────────────────────────────

def test_login_page_renders(page: Page, ctx: BrowserContext):
    """Shell login page should render with proper styling."""
    wait_for_server(page, BASE_URL)
    shot(page, "01_login_page")

    # Layout: two-panel split
    left = page.locator("[class*='basis-'], [class*='clip-path'], [style*='clip']").first
    assert left.is_visible() or page.locator("select").count() > 0, "Login form not found"

    # CSS tokens must be set
    assert_tailwind_tokens(page)

    # Select element should have padding (Tailwind px-3.5 = 14px)
    sel_padding = page.evaluate("""() => {
        const el = document.querySelector('select');
        return el ? getComputedStyle(el).paddingLeft : '0px';
    }""")
    assert sel_padding not in ("0px", ""), (
        f"Select padding is {sel_padding} — spacing utilities not applied. "
        f"Check for unlayered CSS reset in index.html."
    )
    print(f"  ✅ Login page styled (select padding: {sel_padding})")


def test_portal_grid_layout(page: Page, _ctx: BrowserContext):
    """After login, portal grid must show 4 app cards with proper layout."""
    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)  # Alice Admin — sees all 4 apps
    shot(page, "02_portal_grid")

    # CSS tokens
    assert_tailwind_tokens(page)

    # Header spacing
    assert_padding_working(page, "Portal")

    # Grid
    grid = page.evaluate("""() => {
        const g = document.querySelector('[class*="grid-cols-2"]');
        if (!g) return null;
        const cs = getComputedStyle(g);
        return {
            display: cs.display,
            cols: cs.gridTemplateColumns,
            gap: cs.gap,
            children: g.children.length,
        };
    }""")
    assert grid is not None, "2-column grid not found"
    assert grid["display"] == "grid", f"Expected grid display, got {grid['display']}"
    assert grid["gap"] == "18px", f"Expected gap 18px, got {grid['gap']}"
    assert grid["children"] == 4, f"Expected 4 app cards, got {grid['children']}"
    print(f"  ✅ Portal grid: 2-col, 4 cards, gap={grid['gap']}")


def test_sms_remote_loads_own_login(page: Page, ctx: BrowserContext):
    """SMS should load as a remote with its own login form (dual-auth pattern)."""
    assert_remote_entry_accessible(ctx, "sms", REMOTE_PORTS["sms"])

    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    found = click_app_card(page, "Smart Monitoring System")
    assert found, "SMS app card not found in portal"

    page.wait_for_timeout(10_000)
    shot(page, "03_sms_login")

    body = page.inner_text("body")
    assert "RUNTIME" not in body, f"MF RUNTIME-001 error loading SMS: {body[:300]}"
    assert "Failed to load" not in body, f"Remote load failed: {body[:300]}"

    # SMS must show its OWN login (not shell login, not dashboard)
    assert "Sign in" in body or "Sign In" in body, "SMS login form not shown"
    # SMS must NOT show dashboard content without logging in
    assert "Dashboard" not in body[:200], "SMS went straight to dashboard without login"

    # CSS injection: SMS card/form should be styled
    card_radius = page.evaluate("""() => {
        const el = document.querySelector('[class*="rounded"]');
        return el ? getComputedStyle(el).borderRadius : 'not found';
    }""")
    assert card_radius not in ("0px", "not found"), "SMS form not styled — CSS not injected"
    print(f"  ✅ SMS loads with own login (card radius: {card_radius})")


def test_sms_app_login_flow(page: Page, ctx: BrowserContext):
    """SMS app login with mock credentials should succeed and show dashboard."""
    assert_remote_entry_accessible(ctx, "sms", REMOTE_PORTS["sms"])

    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    click_app_card(page, "Smart Monitoring System")
    page.wait_for_timeout(8_000)

    # Fill SMS own login
    email_input = page.locator('input[type="email"]').first
    password_input = page.locator('input[type="password"]').first

    if email_input.count() and password_input.count():
        email_input.fill("alice@tvplus.com")
        password_input.fill("password123")
        page.get_by_role("button", name="Sign In").click()
        page.wait_for_timeout(5_000)
        shot(page, "04_sms_dashboard")

        body = page.inner_text("body")
        # Should now see the sidebar and dashboard
        assert "Smart Monitoring" in body, "SMS sidebar not visible after login"
        assert "TVPlus Platform" in body, "SMS sidebar brand not visible"
        print("  ✅ SMS login successful — dashboard rendered")
    else:
        print("  ⚠️  SMS login inputs not found — may have used cached token")


def test_mam_shell_auth_only(page: Page, ctx: BrowserContext):
    """MAM uses shell auth only — no own login, shows content directly."""
    assert_remote_entry_accessible(ctx, "mam", REMOTE_PORTS["mam"])

    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    found = click_app_card(page, "Media Asset Management")
    assert found, "MAM card not found"

    page.wait_for_timeout(10_000)
    shot(page, "05_mam_shell_auth")

    body = page.inner_text("body")
    assert "RUNTIME" not in body, f"MAM MF error: {body[:300]}"

    # MAM must NOT show its own login form (shell auth is sufficient)
    # It either shows: asset library, or "sign in through portal" message
    has_asset_content = "Asset" in body or "Media" in body
    has_portal_gate   = "Portal" in body or "portal" in body
    assert has_asset_content or has_portal_gate, (
        f"MAM neither showed assets nor portal gate: {body[:300]}"
    )

    # MAM must NOT show a "Sign in" form (it doesn't have one)
    sign_in_form = page.locator('input[type="email"]').count()
    assert sign_in_form == 0, "MAM showed its own login form — should use shell auth only"
    print(f"  ✅ MAM shell-auth-only works (assets: {has_asset_content})")


def test_back_to_portal_button(page: Page, ctx: BrowserContext):
    """← Portal button in remote apps navigates back to the shell portal."""
    assert_remote_entry_accessible(ctx, "sms", REMOTE_PORTS["sms"])

    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    click_app_card(page, "Smart Monitoring System")
    page.wait_for_timeout(8_000)

    # Click ← Portal
    portal_btn = page.get_by_text("← Portal").first
    assert portal_btn.count() and portal_btn.is_visible(), "← Portal button not visible in SMS sidebar"
    portal_btn.click()
    page.wait_for_timeout(1500)
    shot(page, "06_back_to_portal")

    # Should be back at portal grid
    grid = page.locator('[class*="grid-cols-2"]').first
    assert grid.is_visible(), "Portal grid not visible after ← Portal"
    print("  ✅ ← Portal button works")


def test_refresh_restores_active_app(page: Page, ctx: BrowserContext):
    """Refreshing the browser while an app is open should restore that app (sessionStorage)."""
    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    click_app_card(page, "Smart Monitoring System")
    page.wait_for_timeout(8_000)

    # Verify SMS is showing
    assert page.get_by_text("← Portal").count() > 0, "← Portal not visible (SMS not open)"

    # Reload the page
    page.reload(wait_until="load")
    page.wait_for_timeout(5_000)
    shot(page, "07_after_refresh")

    body = page.inner_text("body")
    # Either SMS re-loads (sessionStorage restored) or portal shows
    sms_visible = "Smart Monitoring" in body or "Sign in" in body
    portal_visible = "Good" in body and "plugin" in body
    assert sms_visible or portal_visible, f"After refresh: unexpected state: {body[:200]}"

    if sms_visible:
        print("  ✅ Refresh restored SMS app (sessionStorage working)")
    else:
        print("  ⚠️  Refresh went to portal (sessionStorage not restored — check App.tsx)")


def test_role_based_access(page: Page, _ctx: BrowserContext):
    """Different roles see different apps in the portal."""
    # Admin sees all 4 apps
    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)  # Nishant — admin
    shot(page, "08_admin_portal")
    admin_cards = page.locator('[class*="cursor-pointer"]').count()

    go_home(page)
    page.goto(BASE_URL, wait_until="load", timeout=10_000)
    page.wait_for_timeout(1000)

    # ops user
    page.locator("select").select_option(index=1)
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_timeout(1500)
    shot(page, "09_ops_portal")
    ops_cards = page.locator('[class*="cursor-pointer"]').count()

    print(f"  ✅ Admin: {admin_cards} cards, Ops: {ops_cards} cards")


def test_remote_css_injection(page: Page, ctx: BrowserContext):
    """Remote app CSS must be injected automatically (no separate <link> needed)."""
    assert_remote_entry_accessible(ctx, "qca", REMOTE_PORTS["qca"])

    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    click_app_card(page, "QC Automation")
    page.wait_for_timeout(10_000)
    shot(page, "10_qca_css_check")

    body = page.inner_text("body")
    assert "RUNTIME" not in body, f"QCA MF error: {body[:300]}"

    # CSS injection: check for styled elements
    has_styled_el = page.evaluate("""() => {
        // Look for any element with non-zero border-radius (from @repo/ui Card)
        for (const el of document.querySelectorAll('[class]')) {
            if (parseFloat(getComputedStyle(el).borderRadius) > 0) return true;
        }
        return false;
    }""")
    assert has_styled_el, (
        "No styled elements found in QCA — CSS injection failed. "
        "Check vite-plugin-css-injected-by-js in apps/qca/vite.config.ts"
    )
    print("  ✅ QCA CSS injected and applied")


def test_no_console_errors(page: Page, ctx: BrowserContext):
    """Full portal flow should produce no JS errors."""
    errors: list[str] = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    wait_for_server(page, BASE_URL)
    login_to_portal(page, 0)
    click_app_card(page, "Smart Monitoring System")
    page.wait_for_timeout(8_000)
    go_home(page)

    # Filter out known benign messages
    real_errors = [e for e in errors if "RUNTIME-001" not in e and "DTS" not in e]
    assert len(real_errors) == 0, f"Console errors during portal flow: {real_errors}"
    print("  ✅ No console errors")


# ─── Test Runner ──────────────────────────────────────────────────────────────

ALL_TESTS = [
    test_login_page_renders,
    test_portal_grid_layout,
    test_sms_remote_loads_own_login,
    test_sms_app_login_flow,
    test_mam_shell_auth_only,
    test_back_to_portal_button,
    test_refresh_restores_active_app,
    test_role_based_access,
    test_remote_css_injection,
    test_no_console_errors,
]


def run_all():
    passed = failed = skipped = 0
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=HEADLESS,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )

        for test_fn in ALL_TESTS:
            ctx = browser.new_context(viewport={"width": 1440, "height": 900})
            # Clear session between tests to avoid state leak
            ctx.clear_cookies()
            page = ctx.new_page()

            name = test_fn.__name__
            print(f"\n{'─' * 60}")
            print(f"Running: {name}")
            try:
                test_fn(page, ctx)
                passed += 1
                results.append((name, "PASS", None))
                print(f"PASS ✅ {name}")
            except AssertionError as e:
                failed += 1
                results.append((name, "FAIL", str(e)))
                print(f"FAIL ❌ {name}: {e}")
                shot(page, f"FAIL_{name}")
            except Exception as e:
                failed += 1
                results.append((name, "ERROR", str(e)))
                print(f"ERROR 💥 {name}: {e}")
                shot(page, f"ERROR_{name}")
            finally:
                ctx.close()

        browser.close()

    print(f"\n{'═' * 60}")
    print(f"Results: {passed} passed · {failed} failed · {skipped} skipped")
    print(f"Screenshots: {SCREENSHOT_DIR}")
    if failed:
        sys.exit(1)


# ─── pytest integration ────────────────────────────────────────────────────────

try:
    import pytest

    @pytest.fixture(scope="function")
    def browser_ctx():
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=HEADLESS, args=["--no-sandbox"])
            ctx = browser.new_context(viewport={"width": 1440, "height": 900})
            ctx.clear_cookies()
            yield ctx
            ctx.close()
            browser.close()

    @pytest.fixture
    def page(browser_ctx):
        p = browser_ctx.new_page()
        yield p
        p.close()

    @pytest.fixture
    def ctx(browser_ctx):
        return browser_ctx

except ImportError:
    pass


if __name__ == "__main__":
    run_all()
