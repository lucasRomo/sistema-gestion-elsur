import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, apiFetch } from '../../../config/api';
import type { Proveedor } from '../../proveedores/types/Proveedor';

const API_INSUMOS = `${API_BASE_URL}/insumos`;
const API_PRODUCTOS = `${API_BASE_URL}/productos`;
const API_PRODUCTO_INSUMO = `${API_BASE_URL}/producto-insumo/producto`;
const API_PROVEEDORES = `${API_BASE_URL}/proveedores`;
const API_UNIDADES_MEDIDA = `${API_BASE_URL}/unidades-medida`;

export const useCompraInsumosData = () => {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const cargarInsumos = async () => {
    try {
      const response = await apiFetch(API_INSUMOS);
      if (response.ok) {
        const data = await response.json();
        setInsumos(data.filter((i: any) => i.estado === 'Activo'));
      }
    } catch (error) {
      console.error('Error al cargar insumos:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await apiFetch(API_PRODUCTOS);
      if (response.ok) {
        const data = await response.json();
        const productosActivos = data.filter((p: any) => p.estado === 'Activo');

        const productosSinReceta = await Promise.all(
          productosActivos.map(async (p: any) => {
            const idProducto = p.idProducto ?? p.id_producto ?? p.id;
            try {
              const res = await apiFetch(`${API_PRODUCTO_INSUMO}/${idProducto}`);
              if (res.ok) {
                const receta = await res.json();
                return (!receta || receta.length === 0) ? p : null;
              }
            } catch {
              return p;
            }
            return null;
          })
        );

        setProductos(productosSinReceta.filter(Boolean));
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const cargarProveedores = async () => {
    try {
      const response = await apiFetch(API_PROVEEDORES);
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const cargarUnidades = async () => {
    try {
      const response = await apiFetch(API_UNIDADES_MEDIDA);
      if (response.ok) {
        const data = await response.json();
        setUnidadesMedida(data);
      }
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
    }
  };

  const cargarTodo = useCallback(async () => {
    setLoadingData(true);
    await Promise.all([
      cargarInsumos(),
      cargarProductos(),
      cargarProveedores(),
      cargarUnidades()
    ]);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  return { insumos, productos, proveedores, unidadesMedida, loadingData, recargarTodo: cargarTodo };
};