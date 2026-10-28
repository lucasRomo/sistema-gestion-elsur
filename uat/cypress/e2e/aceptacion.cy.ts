import datos from '../../datos.json';

// Pruebas de aceptación (UAT) de GestaPro. Cada test es un escenario Gherkin del dossier (HU-01 a HU-10).
// La misma suite, con los mismos nombres y pasos, está en playwright/aceptacion.spec.ts.

describe('Autenticación y permisos', () => {
  it('HU-01 · Una clave de acceso incorrecta no deja entrar', () => {
    cy.pasarPorton('clave-equivocada');
    cy.contains('Clave incorrecta.').should('be.visible');
    cy.contains('Acceso restringido').should('be.visible');
  });

  it('HU-02 · Usuario o contraseña incorrectos muestran un error', () => {
    cy.iniciarSesion(datos.duenio.usuario, 'contraseña-incorrecta');
    cy.contains('Error de Inicio').should('be.visible');
    cy.contains('El usuario o la contraseña ingresados son incorrectos').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('HU-03 · El Dueño inicia sesión y llega al panel principal', () => {
    cy.iniciarSesion(datos.duenio.usuario, datos.duenio.password);
    cy.contains(`Sesión iniciada correctamente como ${datos.duenio.nombre}.`).should('be.visible');
    cy.contains('button', 'Aceptar').click();
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('Rol: ADMIN').should('be.visible');
    cy.contains('h1', 'Panel principal').should('be.visible');
  });

  it('HU-04 · Sin sesión, una pantalla interna pide el acceso', () => {
    cy.visit('/productos');
    cy.location('pathname').should('not.eq', '/productos');
    cy.contains('Acceso restringido').should('be.visible');
  });

  it('HU-05 · El Operario no ve las opciones de gerente', () => {
    cy.entrarComo('operario');
    cy.contains('Rol: OPERARIO').should('be.visible');
    cy.contains('OPCIONES DE GERENTE').should('not.exist');
    cy.contains('Matriz de Permisos').should('not.exist');
  });

  it('HU-06 · El Operario no puede entrar a Informes', () => {
    cy.entrarComo('operario');
    cy.visit('/informes');
    cy.contains('ACCESO RESTRINGIDO').should('be.visible');
    cy.contains('No tienes los permisos necesarios').should('be.visible');
  });
});

describe('Catálogo de productos', () => {
  it('HU-07 · Buscar un producto por nombre filtra el catálogo', () => {
    cy.entrarComo('duenio');
    cy.visit('/productos');
    cy.get('tbody tr').should('have.length.greaterThan', 1);
    cy.get('input[placeholder="Buscar producto..."]').type('anillado');
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody').should('contain.text', 'Anillado hasta 100 hojas');
  });

  it('HU-08 · No se puede guardar un producto sin nombre', () => {
    cy.abrirAltaDeProducto().within(() => {
      cy.contains('button', 'Guardar').click();
      cy.get('input').first().should(($i) => {
        expect(($i[0] as HTMLInputElement).validationMessage).to.eq('El nombre del producto es obligatorio.');
      });
    });
    cy.contains('Producto Guardado Exitosamente').should('not.exist');
  });

  it('HU-09 · El precio base tiene que ser mayor a cero', () => {
    cy.abrirAltaDeProducto().within(() => {
      cy.get('input').first().type('Producto con precio cero');
      cy.get('input[type=number]').eq(0).type('0');
      cy.contains('button', 'Guardar').click();
      cy.get('input[type=number]').eq(0).should(($i) => {
        expect(($i[0] as HTMLInputElement).validationMessage).to.eq('El precio base debe ser mayor a 0.');
      });
    });
  });

  it('HU-10 · Registrar un producto nuevo con confirmación', () => {
    const nombre = `Ploteo A1 color UAT ${Date.now()}`;
    cy.abrirAltaDeProducto().within(() => {
      cy.get('input').first().type(nombre);
      cy.get('input[type=number]').eq(0).type('2500');
      cy.get('input[type=number]').eq(1).type('10');
      cy.get('input[placeholder="Escribe para buscar o ingresar categoría..."]').type('Impres');
    });
    cy.contains('.fw-semibold', 'Impresiones').trigger('mousedown');
    cy.get('.modal.d-block').last().contains('button', 'Guardar').click();
    // Antes de guardar, el sistema pide confirmación.
    cy.contains(`¿Registrar el producto "${nombre}"?`).should('be.visible');
    cy.contains('button', /^Registrar$/).click();
    cy.contains('Producto Guardado Exitosamente').should('be.visible');
    cy.contains('button', /^Cerrar$/).click();
    cy.get('input[placeholder="Buscar producto..."]').type(nombre);
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody').should('contain.text', '$2.500,00');
  });
});
