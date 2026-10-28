import { defineConfig } from 'cypress';

// Suite de aceptación de GestaPro en Cypress. La misma suite está escrita en Playwright (carpeta playwright/).
export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'reportes/cypress',
    reportPageTitle: 'GestaPro · Pruebas de aceptación (Cypress)',
    reportTitle: 'GestaPro · Pruebas de aceptación (Cypress)',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    baseUrl: process.env.BASE_URL ?? 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 8000,
    video: false,
    setupNodeEvents(on) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('cypress-mochawesome-reporter/plugin')(on);
    },
  },
});
