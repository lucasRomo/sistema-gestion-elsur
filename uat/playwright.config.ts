import { defineConfig, devices } from '@playwright/test';

// Suite de aceptación de GestaPro en Playwright. La misma suite está escrita en Cypress (carpeta cypress/).
export default defineConfig({
  testDir: './playwright',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  // 1 worker para comparar con Cypress en igualdad de condiciones; con --workers=4 corre en paralelo.
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'reportes/playwright', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  // Google Chrome instalado (el mismo navegador que usa Cypress), sin depender del Chromium descargado por Playwright.
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } }],
});
