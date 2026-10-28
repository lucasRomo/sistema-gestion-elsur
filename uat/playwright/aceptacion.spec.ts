import { test, expect, Page } from '@playwright/test';
import datos from '../datos.json';

// Pruebas de aceptación (UAT) de GestaPro. Cada test es un escenario Gherkin del dossier (HU-01 a HU-10).
// La misma suite, con los mismos nombres y pasos, está en cypress/e2e/aceptacion.cy.ts.

async function pasarPorton(page: Page, clave = datos.clavePorton) {
  await page.goto('/');
  await page.locator('input[type=password]').fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

async function iniciarSesion(page: Page, usuario: string, password: string) {
  await pasarPorton(page);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.getByPlaceholder('Ingrese el Nombre de Usuario').fill(usuario);
  await page.getByPlaceholder('Ingrese la Contraseña').fill(password);
  await page.locator('button[type=submit]').click();
}

async function entrarComo(page: Page, perfil: 'duenio' | 'operario') {
  const u = datos[perfil];
  await iniciarSesion(page, u.usuario, u.password);
  await page.getByRole('button', { name: 'Aceptar' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function abrirAltaDeProducto(page: Page) {
  await entrarComo(page, 'duenio');
  await page.goto('/productos');
  await page.getByRole('button', { name: 'Registrar Nuevo Producto' }).click();
  return page.locator('.modal.d-block').last();
}

test.describe('Autenticación y permisos', () => {
  test('HU-01 · Una clave de acceso incorrecta no deja entrar', async ({ page }) => {
    // Dado que estoy en la pantalla de acceso, cuando ingreso una clave incorrecta,
    // entonces veo "Clave incorrecta." y sigo en el acceso restringido.
    await pasarPorton(page, 'clave-equivocada');
    await expect(page.getByText('Clave incorrecta.')).toBeVisible();
    await expect(page.getByText('Acceso restringido')).toBeVisible();
  });

  test('HU-02 · Usuario o contraseña incorrectos muestran un error', async ({ page }) => {
    await iniciarSesion(page, datos.duenio.usuario, 'contraseña-incorrecta');
    await expect(page.getByText('Error de Inicio')).toBeVisible();
    await expect(page.getByText('El usuario o la contraseña ingresados son incorrectos')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('HU-03 · El Dueño inicia sesión y llega al panel principal', async ({ page }) => {
    await iniciarSesion(page, datos.duenio.usuario, datos.duenio.password);
    await expect(page.getByText(`Sesión iniciada correctamente como ${datos.duenio.nombre}.`)).toBeVisible();
    await page.getByRole('button', { name: 'Aceptar' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Rol: ADMIN')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Panel principal' })).toBeVisible();
  });

  test('HU-04 · Sin sesión, una pantalla interna pide el acceso', async ({ page }) => {
    await page.goto('/productos');
    await expect(page).not.toHaveURL(/\/productos/);
    await expect(page.getByText('Acceso restringido')).toBeVisible();
  });

  test('HU-05 · El Operario no ve las opciones de gerente', async ({ page }) => {
    await entrarComo(page, 'operario');
    await expect(page.getByText('Rol: OPERARIO')).toBeVisible();
    await expect(page.getByText('OPCIONES DE GERENTE')).toHaveCount(0);
    await expect(page.getByText('Matriz de Permisos')).toHaveCount(0);
  });

  test('HU-06 · El Operario no puede entrar a Informes', async ({ page }) => {
    await entrarComo(page, 'operario');
    await page.goto('/informes');
    await expect(page.getByText('ACCESO RESTRINGIDO')).toBeVisible();
    await expect(page.getByText('No tienes los permisos necesarios')).toBeVisible();
  });
});

test.describe('Catálogo de productos', () => {
  test('HU-07 · Buscar un producto por nombre filtra el catálogo', async ({ page }) => {
    await entrarComo(page, 'duenio');
    await page.goto('/productos');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await page.getByPlaceholder('Buscar producto...').fill('anillado');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody')).toContainText('Anillado hasta 100 hojas');
  });

  test('HU-08 · No se puede guardar un producto sin nombre', async ({ page }) => {
    const modal = await abrirAltaDeProducto(page);
    await modal.getByRole('button', { name: 'Guardar' }).click();
    const nombre = modal.locator('input').first();
    await expect(nombre).toHaveJSProperty('validationMessage', 'El nombre del producto es obligatorio.');
    await expect(page.getByText('Producto Guardado Exitosamente')).toHaveCount(0);
  });

  test('HU-09 · El precio base tiene que ser mayor a cero', async ({ page }) => {
    const modal = await abrirAltaDeProducto(page);
    await modal.locator('input').first().fill('Producto con precio cero');
    const precio = modal.locator('input[type=number]').nth(0);
    await precio.fill('0');
    await modal.getByRole('button', { name: 'Guardar' }).click();
    await expect(precio).toHaveJSProperty('validationMessage', 'El precio base debe ser mayor a 0.');
  });

  test('HU-10 · Registrar un producto nuevo con confirmación', async ({ page }) => {
    const nombre = `Ploteo A1 color UAT ${Date.now()}`;
    const modal = await abrirAltaDeProducto(page);
    await modal.locator('input').first().fill(nombre);
    await modal.locator('input[type=number]').nth(0).fill('2500');
    await modal.locator('input[type=number]').nth(1).fill('10');
    await modal.getByPlaceholder('Escribe para buscar o ingresar categoría...').fill('Impres');
    await page.locator('.fw-semibold', { hasText: 'Impresiones' }).first().dispatchEvent('mousedown');
    await modal.getByRole('button', { name: 'Guardar' }).click();
    // Antes de guardar, el sistema pide confirmación.
    await expect(page.getByText(`¿Registrar el producto "${nombre}"?`)).toBeVisible();
    await page.getByRole('button', { name: 'Registrar', exact: true }).click();
    await expect(page.getByText('Producto Guardado Exitosamente')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.getByPlaceholder('Buscar producto...').fill(nombre);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody')).toContainText('$2.500,00');
  });
});
