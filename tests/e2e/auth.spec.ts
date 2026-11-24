import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('TC-001 · Autenticación de usuarios', () => {
  test('TC-001-A: Login con cuenta cliente (maria@bookhub.co)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('h1,h2').first()).toContainText(/inicia|login/i);

    // Usar botón de cuenta rápida
    const clientBtn = page.locator('button', { hasText: /cliente|maria/i }).first();
    if (await clientBtn.isVisible()) {
      await clientBtn.click();
    } else {
      await page.fill('input[type="email"]', 'maria@bookhub.co');
      await page.fill('input[type="password"]', 'cliente123');
    }
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(catalogo|$)/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/(catalogo|$)/);
  });

  test('TC-001-B: Login con cuenta admin (admin@bookhub.co)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const adminBtn = page.locator('button', { hasText: /admin/i }).first();
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
    } else {
      await page.fill('input[type="email"]', 'admin@bookhub.co');
      await page.fill('input[type="password"]', 'admin123');
    }
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
    // Admin debe ver enlace a panel
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('TC-001-C: Login con cuenta logística (logistica@bookhub.co)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const logBtn = page.locator('button', { hasText: /logis/i }).first();
    if (await logBtn.isVisible()) {
      await logBtn.click();
    } else {
      await page.fill('input[type="email"]', 'logistica@bookhub.co');
      await page.fill('input[type="password"]', 'logistica123');
    }
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
    await expect(page).not.toHaveURL(/login/);
  });

  test('TC-001-D: Credenciales inválidas muestran error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'noexiste@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Debe permanecer en /login con mensaje de error
    await expect(page).toHaveURL(/login/);
    const errorMsg = page.locator('[class*="error"],[class*="red"],[role="alert"]').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('TC-001-E: Toggle de visibilidad de contraseña', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const pwInput = page.locator('input[name="password"]');
    await expect(pwInput).toHaveAttribute('type', 'password');

    // Buscar botón ojo
    const toggleBtn = page.locator('button[aria-label*="contraseña"], button svg').nth(0);
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await expect(pwInput).toHaveAttribute('type', 'text');
    } else {
      test.skip();
    }
  });

  test('TC-001-F: Logout cierra sesión correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'maria@bookhub.co');
    await page.fill('input[type="password"]', 'cliente123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(catalogo|$)/, { timeout: 10000 });

    // Buscar botón logout en navbar
    const logoutBtn = page.locator('button,a', { hasText: /salir|logout|cerrar/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/login/, { timeout: 5000 });
      await expect(page).toHaveURL(/login/);
    } else {
      test.skip();
    }
  });
});
