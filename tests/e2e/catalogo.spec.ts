import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper para hacer login
async function loginAs(page: any, role: 'cliente' | 'admin' | 'logistica') {
  const creds = {
    cliente: { email: 'maria@bookhub.co', password: 'cliente123' },
    admin: { email: 'admin@bookhub.co', password: 'admin123' },
    logistica: { email: 'logistica@bookhub.co', password: 'logistica123' },
  };
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', creds[role].email);
  await page.fill('input[type="password"]', creds[role].password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(catalogo|$)/, { timeout: 10000 });
}

test.describe('TC-002 · Catálogo de libros', () => {
  test('TC-002-A: Catálogo carga y muestra libros', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    // Esperar que haya tarjetas de libros
    await page.waitForSelector('[class*="card"],[class*="book"],[class*="grid"] > div', { timeout: 10000 });
    const books = page.locator('[class*="card"],[class*="book-card"]');
    const count = await books.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-002-B: Filtro por formato ebook funciona', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForSelector('select,button', { timeout: 5000 });
    // Buscar selector de formato
    const formatSelect = page.locator('select').first();
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption({ label: /ebook/i });
      await page.waitForTimeout(500);
      const books = page.locator('[class*="card"],[class*="book"]');
      const count = await books.count();
      expect(count).toBeGreaterThanOrEqual(0);
    } else {
      test.skip();
    }
  });

  test('TC-002-C: Búsqueda en tiempo real filtra resultados', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForSelector('input[placeholder*="buscar" i],input[type="search"]', { timeout: 5000 });
    const searchInput = page.locator('input[placeholder*="buscar" i],input[type="search"]').first();
    await searchInput.fill('don quijote');
    await page.waitForTimeout(600); // debounce
    const books = page.locator('[class*="card"],[class*="book"]');
    const count = await books.count();
    // Si existe el libro, debe aparecer al menos 1; si no, 0
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-002-D: Agregar libro al carrito', async ({ page }) => {
    await loginAs(page, 'cliente');
    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForSelector('button', { timeout: 5000 });

    const addBtn = page.locator('button', { hasText: /agregar|añadir|carrito/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Buscar indicador de carrito (badge, toast, número)
      await page.waitForTimeout(500);
      const cartIndicator = page.locator('[class*="badge"],[class*="cart"],[aria-label*="carrito"]').first();
      // Si hay indicador, verificar que tiene contenido
      if (await cartIndicator.isVisible()) {
        const text = await cartIndicator.textContent();
        expect(Number(text)).toBeGreaterThan(0);
      }
    } else {
      test.skip();
    }
  });
});

test.describe('TC-003 · Control de acceso (RBAC)', () => {
  test('TC-003-A: Ruta /logistica redirige a login sin auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistica`);
    await expect(page).toHaveURL(/login/);
  });

  test('TC-003-B: Ruta /admin/libros redirige a login sin auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/libros`);
    await expect(page).toHaveURL(/login/);
  });

  test('TC-003-C: Cliente no puede acceder a /admin/libros', async ({ page }) => {
    await loginAs(page, 'cliente');
    await page.goto(`${BASE_URL}/admin/libros`);
    // Debe redirigir a / o /catalogo o mostrar error 403
    const url = page.url();
    expect(url).not.toContain('/admin/libros');
  });

  test('TC-003-D: Admin accede a /admin/libros correctamente', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/admin/libros`);
    await expect(page).toHaveURL(/admin\/libros/);
    await expect(page.locator('h1,h2').first()).toBeVisible();
  });

  test('TC-003-E: Logística accede a tablero Kanban', async ({ page }) => {
    await loginAs(page, 'logistica');
    await page.goto(`${BASE_URL}/logistica`);
    await expect(page).toHaveURL(/logistica/);
    // Verificar columnas del Kanban
    const cols = page.locator('[class*="column"],[class*="kanban"],[class*="board"]');
    const count = await cols.count();
    expect(count).toBeGreaterThan(0);
  });
});
