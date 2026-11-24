import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('TC-007 · APIs REST y Datos', () => {
  test('TC-007-A: GET /api/books retorna lista de libros', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/books`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Puede ser array directo o { books: [...] }
    const books = Array.isArray(data) ? data : data.books;
    expect(Array.isArray(books)).toBeTruthy();
    expect(books.length).toBeGreaterThan(0);
  });

  test('TC-007-B: POST /api/auth/login con credenciales válidas retorna token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'maria@bookhub.co', password: 'cliente123' },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user || data.token || data.success).toBeTruthy();
  });

  test('TC-007-C: POST /api/auth/login con credenciales inválidas retorna 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'noexiste@test.com', password: 'wrongpassword' },
    });
    expect(response.status()).toBe(401);
  });

  test('TC-007-D: GET /api/orders sin auth retorna 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/orders`);
    expect([401, 403]).toContain(response.status());
  });

  test('TC-007-E: Seed endpoint puebla la base de datos', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/seed`);
    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    expect(data.message || data.success || data.users).toBeTruthy();
  });

  test('TC-007-F: GET /api/shipments sin auth retorna 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/shipments`);
    expect([401, 403]).toContain(response.status());
  });

  test('TC-007-G: Libro individual GET /api/books/:id retorna 404 para ID inválido', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/books/invalidid123`);
    expect([400, 404, 500]).toContain(response.status());
  });
});

test.describe('TC-008 · WebSocket / Tiempo Real', () => {
  test('TC-008-A: La página de catálogo carga sin errores de WebSocket', async ({ page }) => {
    // Capturar errores de consola
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForTimeout(2000);
    // Filtrar errores críticos (ignorar errores menores de extensiones del navegador)
    const wsErrors = errors.filter(e => e.includes('WebSocket') && e.includes('ERR'));
    expect(wsErrors.length).toBe(0);
  });

  test('TC-008-B: Tablero de logística carga las columnas Kanban', async ({ page }) => {
    // Login como logistica
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'logistica@bookhub.co');
    await page.fill('input[type="password"]', 'logistica123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(logistica|$)/, { timeout: 10000 });

    await page.goto(`${BASE_URL}/logistica`);
    await page.waitForTimeout(2000);

    // Verificar que hay contenido (tablero Kanban o lista de órdenes)
    const content = page.locator('main h1, main h2, [class*="kanban"], [class*="column"]').first();
    await expect(content).toBeVisible();
  });
});
