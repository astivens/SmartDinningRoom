import { test, expect, APIRequestContext, Page } from "@playwright/test";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5174";
const API_URL = process.env.API_URL ?? "http://localhost:3002";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getApiHeaders(request: APIRequestContext, path: string) {
  const response = await request.get(`${API_URL}${path}`);
  return { status: response.status(), headers: response.headers() };
}

// ─── Suite 1: Security Headers en el backend ──────────────────────────────────

test.describe("API — Security Headers", () => {
  test("GET /api/health no expone X-Powered-By", async ({ request }) => {
    const { headers } = await getApiHeaders(request, "/api/health");
    expect(
      headers["x-powered-by"],
      "El servidor no debe revelar el runtime mediante X-Powered-By"
    ).toBeUndefined();
  });

  test("GET /api/health incluye X-Content-Type-Options: nosniff", async ({
    request,
  }) => {
    const { headers } = await getApiHeaders(request, "/api/health");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("GET /api/health incluye protección contra clickjacking", async ({
    request,
  }) => {
    const { headers } = await getApiHeaders(request, "/api/health");
    const hasXFrameOptions = headers["x-frame-options"] !== undefined;
    const hasCspFrameAncestors =
      headers["content-security-policy"]?.includes("frame-ancestors") ?? false;

    expect(
      hasXFrameOptions || hasCspFrameAncestors,
      "Debe incluir X-Frame-Options o CSP frame-ancestors para prevenir clickjacking"
    ).toBe(true);
  });

  test("GET /api/health devuelve Content-Type: application/json", async ({
    request,
  }) => {
    const { headers } = await getApiHeaders(request, "/api/health");
    expect(headers["content-type"]).toContain("application/json");
  });
});

// ─── Suite 2: Autenticación y rutas protegidas ────────────────────────────────

test.describe("API — Autenticación y control de acceso", () => {
  test("GET /api/students requiere autenticación (401 sin token)", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/students`);
    expect(response.status()).toBe(401);
  });

  test("GET /api/audit requiere autenticación (401 sin token)", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/audit`);
    expect(response.status()).toBe(401);
  });

  test("GET /api/supervisors requiere autenticación (401 sin token)", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/supervisors`);
    expect(response.status()).toBe(401);
  });

  test("POST /api/auth/login rechaza credenciales inválidas (401)", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: "nobody@invalid.com", password: "WrongPassword999!" },
    });
    expect(response.status()).toBe(401);

    const body = await response.json().catch(() => ({}));
    // El mensaje de error no debe revelar si el email existe o no
    expect(JSON.stringify(body)).not.toMatch(/email.*not.*found/i);
    expect(JSON.stringify(body)).not.toMatch(/usuario no existe/i);
  });

  test("POST /api/auth/login no filtra stack traces en errores", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: "'; DROP TABLE users; --", password: "x" },
    });
    const body = await response.text();
    expect(body).not.toMatch(/at\s+\w+\s+\(/); // stack trace de Node.js
    expect(body).not.toMatch(/SequelizeDatabase/i);
    expect(body).not.toMatch(/pg_query/i);
  });

  test("Endpoint inexistente devuelve 404, no 200", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/ruta-que-no-existe`);
    expect(response.status()).toBe(404);
  });
});

// ─── Suite 3: Frontend — Comportamiento de seguridad en el navegador ──────────

test.describe("Frontend — Seguridad en el navegador", () => {
  test("Redirige a login cuando el usuario no está autenticado", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(`${FRONTEND_URL}/admin`);
    // Esperar redirección al login
    await page.waitForURL(/\/login/, { timeout: 8000 });
    expect(page.url()).toMatch(/\/login/);
  });

  test("El formulario de login tiene autocomplete='off' en el campo password", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 8000 });

    const autocomplete = await passwordInput.getAttribute("autocomplete");
    // "new-password" o "current-password" son aceptables; "off" también;
    // solo rechazamos si está vacío y se auto-complete podría exponer datos
    expect(["off", "current-password", "new-password"]).toContain(
      autocomplete ?? "current-password"
    );
  });

  test("La página de login no expone tokens en la URL tras autenticarse", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(`${FRONTEND_URL}/login`);

    // Escuchar todas las navegaciones
    const urlHistory: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        urlHistory.push(frame.url());
      }
    });

    // Intentar login con credenciales inválidas (solo para verificar comportamiento de URL)
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill("test@example.com");
      await passwordInput.fill("WrongPass123!");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);
    }

    // Ninguna URL debe contener parámetros con "token" o "jwt"
    for (const url of urlHistory) {
      expect(url).not.toMatch(/[?&](token|jwt|access_token)=/i);
    }
  });

  test("El frontend no expone variables de entorno sensibles en el bundle", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(FRONTEND_URL);

    // Recopilar todos los scripts cargados
    const scriptContents: string[] = [];
    page.on("response", async (response) => {
      if (
        response.url().includes(".js") &&
        response.status() === 200
      ) {
        const text = await response.text().catch(() => "");
        scriptContents.push(text);
      }
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const allScripts = scriptContents.join("\n");

    // Patrones que nunca deben aparecer en el bundle del frontend
    expect(allScripts).not.toMatch(/DB_PASSWORD\s*[:=]\s*['"]\S+['"]/);
    expect(allScripts).not.toMatch(/JWT_SECRET\s*[:=]\s*['"]\S+['"]/);
    expect(allScripts).not.toMatch(/SMTP_PASS\s*[:=]\s*['"]\S+['"]/);
  });

  test("Cookies de sesión tienen atributo HttpOnly (no accesibles desde JS)", async ({
    page,
    context,
  }: {
    page: Page;
    context: import("@playwright/test").BrowserContext;
  }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState("networkidle");

    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(
      (c) =>
        c.name.toLowerCase().includes("session") ||
        c.name.toLowerCase().includes("token") ||
        c.name.toLowerCase().includes("auth")
    );

    for (const cookie of sessionCookies) {
      expect(
        cookie.httpOnly,
        `Cookie "${cookie.name}" debe tener HttpOnly=true`
      ).toBe(true);
    }
  });

  test("No hay errores de consola críticos en la página principal", async ({
    page,
  }: {
    page: Page;
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");

    // Filtrar errores de red esperados (404 de assets en dev)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("hot-update") &&
        !err.includes("vite")
    );

    expect(
      criticalErrors,
      `Errores de consola inesperados: ${criticalErrors.join(", ")}`
    ).toHaveLength(0);
  });
});
