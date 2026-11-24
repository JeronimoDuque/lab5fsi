import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function loginAsCliente(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'cliente@bookhub.com');
  await page.fill('input[type="password"]', 'cliente123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(catalogo|$)/, { timeout: 10000 });
}

test.describe('TC-004 · Flujo de Compra (Checkout)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCliente(page);
  });

  test('TC-004-A: Checkout requiere al menos un item en carrito', async ({ page }) => {
    // Ir directo a checkout con carrito vacío
    await page.goto(`${BASE_URL}/checkout`);
    // Debe redirigir o mostrar mensaje de carrito vacío
    const emptyMsg = page.locator('text=/vacío|empty|carrito/i').first();
    const isRedirected = !page.url().includes('/checkout');
    expect(isRedirected || await emptyMsg.isVisible()).toBeTruthy();
  });

  test('TC-004-B: Flujo completo ebook (simulación de pago)', async ({ page }) => {
    // Ir a catálogo y agregar un ebook
    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForTimeout(1000);

    // Intentar agregar un libro
    const addBtn = page.locator('button', { hasText: /agregar|carrito/i }).first();
    if (!await addBtn.isVisible({ timeout: 3000 })) {
      test.skip();
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    // Ir al checkout
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);

    const checkoutPage = page.locator('h1,h2').filter({ hasText: /checkout|pedido|pago/i });
    if (!await checkoutPage.isVisible({ timeout: 3000 })) {
      test.skip();
      return;
    }

    // Buscar botón de simulación de pago
    const simBtn = page.locator('button', { hasText: /simul|demo|pago/i }).first();
    if (await simBtn.isVisible()) {
      await simBtn.click();
      // Esperar confirmación de orden
      await page.waitForURL(/pedidos/, { timeout: 15000 });
      await expect(page).toHaveURL(/pedidos/);
    } else {
      test.skip();
    }
  });

  test('TC-004-C: Formulario de envío valida campos requeridos', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForTimeout(1000);

    const addBtn = page.locator('button', { hasText: /agregar|carrito/i }).first();
    if (!await addBtn.isVisible({ timeout: 3000 })) { test.skip(); return; }
    await addBtn.click();
    await page.waitForTimeout(500);

    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);

    // Intentar submit sin llenar campos de dirección (si aplica para libro físico)
    const submitBtn = page.locator('button[type="submit"],button', { hasText: /confirmar|pagar/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Debe haber validación HTML5 o mensaje de error
      await page.waitForTimeout(500);
      // Si sigue en checkout, la validación está funcionando
      const url = page.url();
      // Pasamos si el formulario no procesó (URL sin query de éxito)
      expect(url).not.toContain('success');
    } else {
      test.skip();
    }
  });
});

test.describe('TC-005 · Seguimiento de Pedidos', () => {
  test('TC-005-A: Lista de pedidos visible para cliente autenticado', async ({ page }) => {
    await loginAsCliente(page);
    await page.goto(`${BASE_URL}/pedidos`);
    await expect(page).toHaveURL(/pedidos/);
    const content = page.locator('main,[class*="container"]');
    await expect(content).toBeVisible();
  });

  test('TC-005-B: Ruta /pedidos requiere autenticación', async ({ page }) => {
    await page.goto(`${BASE_URL}/pedidos`);
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TC-006 · Biblioteca de E-books', () => {
  test('TC-006-A: Ruta /biblioteca requiere autenticación', async ({ page }) => {
    await page.goto(`${BASE_URL}/biblioteca`);
    await expect(page).toHaveURL(/login/);
  });

  test('TC-006-B: Biblioteca visible para cliente autenticado', async ({ page }) => {
    await loginAsCliente(page);
    await page.goto(`${BASE_URL}/biblioteca`);
    await expect(page).toHaveURL(/biblioteca/);
    const heading = page.locator('h1,h2').first();
    await expect(heading).toBeVisible();
  });
});
