import { useState, useEffect, useCallback } from 'react';
import { getInsumos } from '../../insumos/services/insumoService';
import type { Proveedor } from '../../proveedores/types/Proveedor';

export const useCompraInsumosData = () => {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const cargarInsumos = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data.filter((i: any) => i.estado === 'Activo'));
    } catch (error) {
      console.error('Error al cargar insumos:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/productos');
      if (response.ok) {
        const data = await response.json();
        const productosActivos = data.filter((p: any) => p.estado === 'Activo');

        // Filtrar productos descartando aquellos que posean receta
        const productosSinReceta = await Promise.all(
          productosActivos.map(async (p: any) => {
            try {
              const res = await fetch(`http://localhost:8080/api/producto-insumo/producto/${p.idProducto}`);
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
      const response = await fetch('http://localhost:8080/api/proveedores');
      if (response.ok) setProveedores(await response.json());
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const cargarUnidades = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/unidades-medida');
      if (response.ok) setUnidadesMedida(await response.json());
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