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
import java.util.stream.Collectors;

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

                String catVieja = (productoViejo.getCategoria() != null && productoViejo.getCategoria().getNombre() != null) 
                        ? productoViejo.getCategoria().getNombre() : "";

                String catNueva = "";
                if (producto.getCategoria() != null) {
                    if (producto.getCategoria().getNombre() != null && !producto.getCategoria().getNombre().trim().isEmpty()) {
                        catNueva = producto.getCategoria().getNombre();
                    } else if (producto.getCategoria().getIdCategoria() != null) {
                        if (productoViejo.getCategoria() != null && 
                            productoViejo.getCategoria().getIdCategoria().equals(producto.getCategoria().getIdCategoria())) {
                            catNueva = catVieja;
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
                            maqNueva = maqVieja;
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
    public void actualizarPreciosMasivo(double porcentaje, Integer idCategoria, Integer idProveedor, List<Integer> idsProductos, String criterio, Integer idUsuario) {
        List<Producto> todos = productoRepository.findAll();
        List<Producto> aModificar;

        if ("SELECCION".equalsIgnoreCase(criterio)) {
            if (idsProductos == null || idsProductos.isEmpty()) {
                return; // Si no hay IDs seleccionados, no se modifica nada
            }
            List<Integer> ids = idsProductos.stream()
                    .map(num -> Integer.parseInt(num.toString()))
                    .collect(Collectors.toList());

            aModificar = todos.stream()
                    .filter(p -> ids.contains(p.getIdProducto()))
                    .collect(Collectors.toList());

        } else if ("CATEGORIA".equalsIgnoreCase(criterio)) {
            if (idCategoria == null || idCategoria <= 0) {
                return; // Si no hay categoría elegida, no se modifica nada
            }
            aModificar = todos.stream()
                    .filter(p -> p.getCategoria() != null && idCategoria.equals(p.getCategoria().getIdCategoria()))
                    .collect(Collectors.toList());

        } else {
            // Solo ingresa a TODOS si fue seleccionado explícitamente
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