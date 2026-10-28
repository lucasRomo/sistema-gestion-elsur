import 'cypress-mochawesome-reporter/register';
import datos from '../../datos.json';

// Pasos reutilizables: los mismos que usa la suite de Playwright.
Cypress.Commands.add('pasarPorton', (clave: string = datos.clavePorton) => {
  cy.visit('/');
  cy.get('input[type=password]').type(clave);
  cy.contains('button', 'Ingresar').click();
});

Cypress.Commands.add('iniciarSesion', (usuario: string, password: string) => {
  cy.pasarPorton();
  cy.contains('button', 'Iniciar Sesión').click();
  cy.get('input[placeholder="Ingrese el Nombre de Usuario"]').type(usuario);
  cy.get('input[placeholder="Ingrese la Contraseña"]').type(password);
  cy.get('button[type=submit]').click();
});

Cypress.Commands.add('entrarComo', (perfil: 'duenio' | 'operario') => {
  const u = datos[perfil];
  cy.iniciarSesion(u.usuario, u.password);
  cy.contains('button', 'Aceptar').click();
  cy.location('pathname').should('eq', '/dashboard');
});

Cypress.Commands.add('abrirAltaDeProducto', () => {
  cy.entrarComo('duenio');
  cy.visit('/productos');
  cy.contains('button', 'Registrar Nuevo Producto').click();
  return cy.get('.modal.d-block').last();
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      pasarPorton(clave?: string): Chainable<void>;
      iniciarSesion(usuario: string, password: string): Chainable<void>;
      entrarComo(perfil: 'duenio' | 'operario'): Chainable<void>;
      abrirAltaDeProducto(): Chainable<JQuery<HTMLElement>>;
    }
  }
}
