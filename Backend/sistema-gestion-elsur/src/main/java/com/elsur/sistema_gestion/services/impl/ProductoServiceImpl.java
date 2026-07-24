package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.Usuario;
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

@Service
public class ProductoServiceImpl implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @Override
    public Producto buscarPorId(Integer id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
    }

    @Override
    @Transactional
    public Producto guardar(Producto producto, Integer idUsuario) {
        if (producto.getEstado() == null || producto.getEstado().trim().isEmpty()) {
            producto.setEstado("Activo");
        }

        // --- LÓGICA DE AUDITORÍA EN EDICIÓN ---
        if (producto.getIdProducto() != null && productoRepository.existsById(producto.getIdProducto())) {
            
            Producto productoViejo = productoRepository.findById(producto.getIdProducto()).orElse(null);

            if (productoViejo != null) {
                Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

                // 1. Campos directos
                compararYRegistrar(usuarioActual, "Producto", "nombreProducto", producto.getIdProducto(),
                        productoViejo.getNombreProducto(), producto.getNombreProducto());

                compararYRegistrar(usuarioActual, "Producto", "precioBase", producto.getIdProducto(),
                        productoViejo.getPrecioBase(), producto.getPrecioBase());

                compararYRegistrar(usuarioActual, "Producto", "stock", producto.getIdProducto(),
                        productoViejo.getStock(), producto.getStock());

                compararYRegistrar(usuarioActual, "Producto", "estado", producto.getIdProducto(),
                        productoViejo.getEstado(), producto.getEstado());

                // 2. Relaciones (Categoría y Máquina) con rehidratación de ID/Nombre
                String catVieja = (productoViejo.getCategoria() != null && productoViejo.getCategoria().getNombre() != null) 
                        ? productoViejo.getCategoria().getNombre() : "";

                String catNueva = "";
                if (producto.getCategoria() != null) {
                    if (producto.getCategoria().getNombre() != null && !producto.getCategoria().getNombre().trim().isEmpty()) {
                        catNueva = producto.getCategoria().getNombre();
                    } else if (producto.getCategoria().getIdCategoria() != null) {
                        if (productoViejo.getCategoria() != null && 
                            productoViejo.getCategoria().getIdCategoria().equals(producto.getCategoria().getIdCategoria())) {
                            catNueva = catVieja; // Mantiene la misma categoría si solo vino el idCategoria desde React
                        }
                    }
                }
                compararYRegistrar(usuarioActual, "Producto", "categoria", producto.getIdProducto(), catVieja, catNueva);

                String maqVieja = (productoViejo.getMaquinaNecesaria() != null && productoViejo.getMaquinaNecesaria().getNombre() != null) 
                        ? productoViejo.getMaquinaNecesaria().getNombre() : "";

                String maqNueva = "";
                if (producto.getMaquinaNecesaria() != null) {
                    if (producto.getMaquinaNecesaria().getNombre() != null && !producto.getMaquinaNecesaria().getNombre().trim().isEmpty()) {
                        maqNueva = producto.getMaquinaNecesaria().getNombre();
                    } else if (producto.getMaquinaNecesaria().getIdMaquina() != null) {
                        if (productoViejo.getMaquinaNecesaria() != null && 
                            productoViejo.getMaquinaNecesaria().getIdMaquina().equals(producto.getMaquinaNecesaria().getIdMaquina())) {
                            maqNueva = maqVieja; // Mantiene la misma máquina si solo vino el idMaquina desde React
                        }
                    }
                }
                compararYRegistrar(usuarioActual, "Producto", "maquinaNecesaria", producto.getIdProducto(), maqVieja, maqNueva);
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
    public void actualizarPreciosMasivo(double porcentaje) {
        List<Producto> productos = productoRepository.findAll();
        aplicarAumento(productos, porcentaje);
    }

    @Override
    @Transactional
    public void actualizarPreciosPorCategoria(Integer idCategoria, double porcentaje) {
        // Suponiendo que agregaste este método al ProductoRepository
        // List<Producto> productos = productoRepository.findByCategoriaIdCategoria(idCategoria);
        // Si no querés tocar el repo todavía, podés filtrar con stream:
        List<Producto> productos = productoRepository.findAll().stream()
                .filter(p -> p.getCategoria() != null && p.getCategoria().getIdCategoria().equals(idCategoria))
                .toList();
        
        aplicarAumento(productos, porcentaje);
    }

    // Método privado para reutilizar la lógica de aumento y redondeo
    private void aplicarAumento(List<Producto> productos, double porcentaje) {
        BigDecimal factor = new BigDecimal(porcentaje / 100).add(BigDecimal.ONE);
        
        for (Producto p : productos) {
            if (p.getPrecioBase() != null) {
                BigDecimal nuevoPrecio = p.getPrecioBase().multiply(factor);
                // Redondeamos a 2 decimales para que no tire error la base de datos
                p.setPrecioBase(nuevoPrecio.setScale(2, RoundingMode.HALF_UP));
            }
        }
        productoRepository.saveAll(productos);
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
                usuario,
                "UPDATE",
                tabla,
                columna,
                idReg,
                viejoVal != null ? viejoVal.toString() : "",
                nuevoVal != null ? nuevoVal.toString() : ""
            );
        }
    }
}