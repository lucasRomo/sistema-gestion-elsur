package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.ProductoInsumo;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ProductoInsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.ProductoService;
import com.elsur.sistema_gestion.services.RegistroActividadService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ProductoServiceImpl implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProductoInsumoRepository productoInsumoRepository;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public List<Producto> listarTodos() {
        List<Producto> productos = productoRepository.findAll();
        for (Producto p : productos) {
            if (Boolean.TRUE.equals(p.getStockVinculado())) {
                p.setStock(calcularStockDesdeInsumos(p.getIdProducto()));
            }
        }
        return productos;
    }

    private Integer calcularStockDesdeInsumos(Integer idProducto) {
        List<ProductoInsumo> receta = productoInsumoRepository.findByIdIdProducto(idProducto);
        if (receta.isEmpty()) return 0;

        int minStockCalculado = Integer.MAX_VALUE;

        for (ProductoInsumo pi : receta) {
            if (pi.getInsumo() == null || pi.getCantidadConsumo() == null || pi.getCantidadConsumo().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal stockInsumo = pi.getInsumo().getStockActual() != null 
                    ? pi.getInsumo().getStockActual() 
                    : BigDecimal.ZERO;

            BigDecimal consumo = pi.getCantidadConsumo();

            int posiblesUnidades = stockInsumo.divide(consumo, 0, RoundingMode.FLOOR).intValue();
            if (posiblesUnidades < minStockCalculado) {
                minStockCalculado = posiblesUnidades;
            }
        }

        return minStockCalculado == Integer.MAX_VALUE ? 0 : Math.max(0, minStockCalculado);
    }

    @Override
    public Producto buscarPorId(Integer id) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
        if (Boolean.TRUE.equals(p.getStockVinculado())) {
            p.setStock(calcularStockDesdeInsumos(p.getIdProducto()));
        }
        return p;
    }

    @Override
    @Transactional
    public Producto guardar(Producto producto, Integer idUsuario) {
        if (producto.getEstado() == null || producto.getEstado().trim().isEmpty()) {
            producto.setEstado("Activo");
        }
        if (Boolean.TRUE.equals(producto.getStockVinculado())) {
            producto.setStock(calcularStockDesdeInsumos(producto.getIdProducto()));
        }

        if (producto.getIdProducto() != null && productoRepository.existsById(producto.getIdProducto())) {
            Producto productoViejo = productoRepository.findById(producto.getIdProducto()).orElse(null);

            if (productoViejo != null) {
                Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

                compararYRegistrar(usuarioActual, "Producto", "nombreProducto", producto.getIdProducto(),
                        productoViejo.getNombreProducto(), producto.getNombreProducto());

                compararYRegistrar(usuarioActual, "Producto", "precioBase", producto.getIdProducto(),
                        productoViejo.getPrecioBase(), producto.getPrecioBase());

                compararYRegistrar(usuarioActual, "Producto", "stock", producto.getIdProducto(),
                        productoViejo.getStock(), producto.getStock());

                compararYRegistrar(usuarioActual, "Producto", "estado", producto.getIdProducto(),
                        productoViejo.getEstado(), producto.getEstado());
            }
        }

        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        productoRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void actualizarPreciosMasivo(double porcentaje, Integer idCategoria, Integer idProveedor, List<Integer> idsProductos, String criterio, Integer idUsuario) {
        List<Producto> todos = productoRepository.findAll();
        List<Producto> aModificar;

        if ("SELECCION".equalsIgnoreCase(criterio)) {
            if (idsProductos == null || idsProductos.isEmpty()) return;
            aModificar = todos.stream()
                    .filter(p -> idsProductos.contains(p.getIdProducto()))
                    .collect(Collectors.toList());
        } else if ("CATEGORIA".equalsIgnoreCase(criterio)) {
            if (idCategoria == null || idCategoria <= 0) return;
            aModificar = todos.stream()
                    .filter(p -> p.getCategoria() != null && idCategoria.equals(p.getCategoria().getIdCategoria()))
                    .collect(Collectors.toList());
        } else {
            aModificar = todos;
        }

        if (aModificar.isEmpty()) return;

        Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);
        BigDecimal factor = new BigDecimal(porcentaje / 100.0).add(BigDecimal.ONE);

        for (Producto p : aModificar) {
            if (p.getPrecioBase() != null) {
                BigDecimal precioAnterior = p.getPrecioBase();
                BigDecimal nuevoPrecio = precioAnterior.multiply(factor).setScale(2, RoundingMode.HALF_UP);
                p.setPrecioBase(nuevoPrecio);
                compararYRegistrar(usuarioActual, "Producto", "precioBase (Aumento Masivo)", p.getIdProducto(), precioAnterior, nuevoPrecio);
            }
        }

        productoRepository.saveAll(aModificar);
    }

    private Usuario obtenerUsuarioOperador(Integer idUsuario) {
        if (idUsuario != null) {
            Usuario u = usuarioRepository.findById(idUsuario).orElse(null);
            if (u != null) return u;
        }
        return usuarioRepository.findAll().stream().findFirst().orElse(null);
    }

    private void compararYRegistrar(Usuario usuario, String tabla, String columna, Integer idReg, Object viejoVal, Object nuevoVal) {
        if (viejoVal == null && nuevoVal == null) return;

        boolean sonIguales = false;
        if (viejoVal instanceof Number || nuevoVal instanceof Number) {
            try {
                BigDecimal bdViejo = viejoVal != null ? new BigDecimal(viejoVal.toString()) : BigDecimal.ZERO;
                BigDecimal bdNuevo = nuevoVal != null ? new BigDecimal(nuevoVal.toString()) : BigDecimal.ZERO;
                sonIguales = bdViejo.compareTo(bdNuevo) == 0;
            } catch (Exception e) {
                sonIguales = Objects.equals(viejoVal, nuevoVal);
            }
        } else {
            String stringViejo = viejoVal != null ? viejoVal.toString().trim() : "";
            String stringNuevo = nuevoVal != null ? nuevoVal.toString().trim() : "";
            sonIguales = Objects.equals(stringViejo, stringNuevo);
        }

        if (!sonIguales) {
            registroActividadService.registrarCambio(
                usuario, "UPDATE", tabla, columna, idReg,
                viejoVal != null ? viejoVal.toString() : "",
                nuevoVal != null ? nuevoVal.toString() : ""
            );
        }
    }
}