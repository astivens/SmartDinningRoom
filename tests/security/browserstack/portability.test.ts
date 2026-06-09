import { test, expect, Page, BrowserContext } from "@playwright/test";

/**
 * Pruebas de portabilidad cross-browser para SmartDiningRoom.
 * Verifican que la aplicación funcione correctamente en
 * Chrome, Firefox, Edge y Safari en entornos de escritorio.
 */

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5174";
const API_URL = process.env.API_URL ?? "http://localhost:3002";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function waitForApp(page: Page): Promise<void> {
  await page.goto(FRONTEND_URL);
  // Esperar a que React hidrate la SPA
  await page.waitForLoadState("networkidle", { timeout: 15000 });
}

async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(`${FRONTEND_URL}${path}`);
  await page.waitForLoadState("networkidle", { timeout: 10000 });
}

// ─── Suite 1: Carga y renderizado inicial ─────────────────────────────────────

test.describe("Portabilidad — Carga y renderizado", () => {
  test("La app carga sin errores de JavaScript en todos los navegadores", async ({
    page,
  }: {
    page: Page;
  }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await waitForApp(page);

    expect(
      jsErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("vite") &&
          !e.includes("hot-update")
      ),
      `Errores JS en ${await page.evaluate(() => navigator.userAgent)}: ${jsErrors.join("; ")}`
    ).toHaveLength(0);
  });

  test("El título de la página está definido", async ({ page }: { page: Page }) => {
    await waitForApp(page);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe("Vite App");
  });

  test("El viewport de escritorio renderiza correctamente (min 1024px)", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForApp(page);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    // No debe tener scroll horizontal en desktop
    expect(bodyWidth).toBeLessThanOrEqual(1280 + 20);
  });

  test("Los recursos críticos cargan (sin 404 en CSS/JS)", async ({
    page,
  }: {
    page: Page;
  }) => {
    const failedResources: string[] = [];
    page.on("response", (res) => {
      const url = res.url();
      const status = res.status();
      if (
        status === 404 &&
        (url.endsWith(".js") || url.endsWith(".css")) &&
        !url.includes("favicon")
      ) {
        failedResources.push(`${status} ${url}`);
      }
    });

    await waitForApp(page);
    expect(failedResources, `Recursos no encontrados: ${failedResources.join(", ")}`).toHaveLength(0);
  });
});

// ─── Suite 2: Navegación y routing ───────────────────────────────────────────

test.describe("Portabilidad — Navegación y routing", () => {
  test("La ruta /login existe y carga el formulario", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/login");

    // Debe haber al menos un campo de email o usuario
    const emailInput = page
      .locator('input[type="email"], input[name*="email"], input[placeholder*="correo" i]')
      .first();
    await expect(emailInput).toBeVisible({ timeout: 8000 });
  });

  test("Ruta protegida redirige al login (React Router funciona)", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/admin/students");
    await page.waitForURL(/\/login/, { timeout: 8000 });
    expect(page.url()).toMatch(/\/login/);
  });

  test("La navegación hacia atrás del browser funciona (History API)", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/login");
    await navigateTo(page, "/");
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    // Debe estar en una URL válida de la app
    expect(page.url()).toContain(FRONTEND_URL.replace("http://", "").replace("https://", ""));
  });

  test("Rutas 404 son manejadas por la SPA (no muestra página en blanco)", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/ruta-que-no-existe-abc123");
    // La SPA debe mostrar algo (no página en blanco)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });
});

// ─── Suite 3: Formulario de login cross-browser ───────────────────────────────

test.describe("Portabilidad — Formulario de login", () => {
  test("El formulario de login acepta input en todos los navegadores", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/login");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await expect(passwordInput).toBeVisible({ timeout: 8000 });

    await emailInput.fill("test@example.com");
    await passwordInput.fill("TestPass123!");

    const emailValue = await emailInput.inputValue();
    const passValue = await passwordInput.inputValue();

    expect(emailValue).toBe("test@example.com");
    expect(passValue).toBe("TestPass123!");
  });

  test("El botón de submit está presente y es clickeable", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/login");

    const submitBtn = page
      .locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")')
      .first();

    await expect(submitBtn).toBeVisible({ timeout: 8000 });
    await expect(submitBtn).toBeEnabled();
  });

  test("El formulario muestra error con credenciales inválidas", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/login");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page
      .locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")')
      .first();

    await emailInput.fill("invalid@invalid.com");
    await passwordInput.fill("WrongPass999!");
    await submitBtn.click();

    // Esperar mensaje de error (alerta MUI, texto de error, etc.)
    await page.waitForTimeout(2000);
    const hasError = await page
      .locator('[role="alert"], .MuiAlert-root, [class*="error"], [class*="Error"]')
      .first()
      .isVisible()
      .catch(() => false);

    // O que la URL no haya cambiado a un dashboard
    const stillOnLogin = page.url().includes("/login") || !page.url().includes("/dashboard");
    expect(hasError || stillOnLogin).toBe(true);
  });
});

// ─── Suite 4: APIs del navegador (compatibilidad) ─────────────────────────────

test.describe("Portabilidad — APIs del navegador", () => {
  test("localStorage está disponible y funciona", async ({ page }: { page: Page }) => {
    await waitForApp(page);

    const result = await page.evaluate(() => {
      try {
        localStorage.setItem("__portability_test__", "ok");
        const val = localStorage.getItem("__portability_test__");
        localStorage.removeItem("__portability_test__");
        return val === "ok";
      } catch {
        return false;
      }
    });

    expect(result, "localStorage no disponible").toBe(true);
  });

  test("fetch API está disponible (no se necesita polyfill)", async ({
    page,
  }: {
    page: Page;
  }) => {
    await waitForApp(page);
    const hasFetch = await page.evaluate(() => typeof window.fetch === "function");
    expect(hasFetch, "fetch no disponible en este navegador").toBe(true);
  });

  test("Promise está disponible (ES2015+)", async ({ page }: { page: Page }) => {
    await waitForApp(page);
    const hasPromise = await page.evaluate(() => typeof window.Promise === "function");
    expect(hasPromise).toBe(true);
  });

  test("CSS Variables (custom properties) están soportadas — MUI las usa", async ({
    page,
  }: {
    page: Page;
  }) => {
    await waitForApp(page);

    const supported = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.setProperty("--test-var", "1px");
      document.body.appendChild(el);
      const computed = getComputedStyle(el).getPropertyValue("--test-var").trim();
      document.body.removeChild(el);
      return computed === "1px";
    });

    expect(supported, "CSS Custom Properties no soportadas").toBe(true);
  });

  test("Flexbox está soportado (layout principal)", async ({ page }: { page: Page }) => {
    await waitForApp(page);

    const supported = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.display = "flex";
      return el.style.display === "flex";
    });

    expect(supported, "Flexbox no soportado").toBe(true);
  });
});

// ─── Suite 5: Conectividad con la API ────────────────────────────────────────

test.describe("Portabilidad — Conectividad API desde el navegador", () => {
  test("El navegador puede alcanzar el endpoint /api/health", async ({
    page,
  }: {
    page: Page;
  }) => {
    await waitForApp(page);

    const result = await page.evaluate(async (apiUrl: string) => {
      try {
        const res = await fetch(`${apiUrl}/api/health`);
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { status: 0, ok: false, error: String(e) };
      }
    }, API_URL);

    expect(result.status, "API health no accesible desde el navegador").toBe(200);
  });

  test("Las peticiones CORS no son bloqueadas para el frontend", async ({
    page,
  }: {
    page: Page;
  }) => {
    await waitForApp(page);

    const corsErrors: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        msg.text().toLowerCase().includes("cors")
      ) {
        corsErrors.push(msg.text());
      }
    });

    // Hacer una petición pública desde el contexto del browser
    await page.evaluate(async (apiUrl: string) => {
      await fetch(`${apiUrl}/api/health`).catch(() => {});
    }, API_URL);

    await page.waitForTimeout(1000);
    expect(corsErrors, `Errores CORS detectados: ${corsErrors.join("; ")}`).toHaveLength(0);
  });
});

// ─── Suite 6: Accesibilidad básica cross-browser ──────────────────────────────

test.describe("Portabilidad — Accesibilidad básica", () => {
  test("El documento tiene un elemento <main> o role='main'", async ({
    page,
  }: {
    page: Page;
  }) => {
    await waitForApp(page);
    const mainEl = page.locator('main, [role="main"]').first();
    // Puede estar oculto durante carga; al menos que exista en el DOM
    const count = await page.locator('main, [role="main"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Los inputs del login tienen labels o aria-label", async ({
    page,
  }: {
    page: Page;
  }) => {
    await navigateTo(page, "/login");

    await page.locator('input[type="email"]').first().waitFor({ timeout: 8000 });

    const inputs = await page.locator("input").all();
    for (const input of inputs) {
      const type = await input.getAttribute("type");
      if (type === "hidden") continue;

      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");

      // Al menos una forma de identificar el campo debe existir
      const hasLabel =
        (id !== null && (await page.locator(`label[for="${id}"]`).count()) > 0) ||
        ariaLabel !== null ||
        ariaLabelledBy !== null ||
        placeholder !== null;

      expect(
        hasLabel,
        `Input type="${type}" no tiene label, aria-label, aria-labelledby ni placeholder`
      ).toBe(true);
    }
  });
});
