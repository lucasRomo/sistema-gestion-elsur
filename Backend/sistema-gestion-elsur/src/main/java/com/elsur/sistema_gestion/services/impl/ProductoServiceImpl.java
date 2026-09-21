package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.ProductoInsumo;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ProductoInsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.ProductoService;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import com.elsur.sistema_gestion.models.DocumentoDigital;
import com.elsur.sistema_gestion.repositories.DocumentoDigitalRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.Optional;

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

    @Autowired
    private DocumentoDigitalRepository documentoDigitalRepository;

    @Override
    public List<Producto> listarTodos() {
    List<Producto> productos = productoRepository.findAll();
    for (Producto p : productos) {
        if (Boolean.TRUE.equals(p.getStockVinculado())) {
            p.setStock(calcularStockDesdeInsumos(p.getIdProducto()));
        }
        sincronizarEstadoConRepositorioDigital(p);
    }
    return productos;
    }

    private void sincronizarEstadoConRepositorioDigital(Producto p) {
    if (!"Activo".equalsIgnoreCase(p.getEstado())) return; 

    Optional<DocumentoDigital> doc = documentoDigitalRepository.findByProducto_IdProducto(p.getIdProducto());
    if (doc.isPresent() && !"Activo".equalsIgnoreCase(doc.get().getEstado())) {
        p.setEstado("Inactivo");
        productoRepository.save(p);
    }}

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
        // CORREGIDO: antes tiraba un RuntimeException genérico, que el
        // GlobalExceptionHandler traduce a 400; un producto inexistente es un 404.
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + id));
        if (Boolean.TRUE.equals(p.getStockVinculado())) {
            p.setStock(calcularStockDesdeInsumos(p.getIdProducto()));
        }
        return p;
    }

    @Override
    @Transactional
    public Producto guardar(Producto producto, Integer idUsuario) {
        // CORREGIDO: guardar() no tenía NINGÚN chequeo de nombre a nivel backend --
        // ni obligatoriedad ni duplicados -- a diferencia de Insumo/Institución/Área,
        // donde ya se había encontrado y corregido el mismo patrón de bug. La única
        // validación de nombre duplicado vivía en el frontend (ProductoRegistroModal),
        // fácil de esquivar llamando directo a la API.
        if (producto.getNombreProducto() == null || producto.getNombreProducto().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre del producto es obligatorio");
        }
        String nombreNormalizado = producto.getNombreProducto().trim();
        Integer idActual = producto.getIdProducto() != null ? producto.getIdProducto() : -1;
        if (productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot(nombreNormalizado, idActual)) {
            throw new RecursoDuplicadoException("Ya existe un producto registrado con ese nombre");
        }
        producto.setNombreProducto(nombreNormalizado);

        // CORREGIDO: precioBase tampoco se validaba en ningún lado (ni frontend antes
        // de este pase, aunque el frontend ya tenía min='0.01', ni backend), a
        // diferencia del resto de los módulos con precio (Insumo, Caja).
        if (producto.getPrecioBase() != null && producto.getPrecioBase().compareTo(BigDecimal.ZERO) < 0) {
            throw new SolicitudInvalidaException("El precio base no puede ser negativo");
        }

        // CORREGIDO: stock (cuando no está vinculado a insumos y se carga a mano)
        // tampoco se validaba contra negativos en el backend.
        if (producto.getStock() != null && producto.getStock() < 0) {
            throw new SolicitudInvalidaException("El stock no puede ser negativo");
        }

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
        BigDecimal factor = BigDecimal.valueOf(1.0 + (porcentaje / 100.0));

        for (Producto p : aModificar) {
            if (p.getPrecioBase() != null) {
                BigDecimal precioAnterior = p.getPrecioBase();
                BigDecimal nuevoPrecio = precioAnterior.multiply(factor).setScale(2, RoundingMode.HALF_UP);

                // Evitar precios negativos en caso de un porcentaje de descuento excesivo
                if (nuevoPrecio.compareTo(BigDecimal.ZERO) < 0) {
                    nuevoPrecio = BigDecimal.ZERO;
                }

                p.setPrecioBase(nuevoPrecio);
                compararYRegistrar(usuarioActual, "Producto", "precioBase (Modificación Masiva)", p.getIdProducto(), precioAnterior, nuevoPrecio);
            }
        }

        productoRepository.saveAll(aModificar);
    }

    // CORREGIDO: antes, si no se recibía un idUsuario válido, se atribuía en
    // silencio el cambio (edición, modificación masiva de precios) al primer
    // usuario que devolviera la tabla, falseando el registro de actividad. Mismo
    // patrón de bug ya corregido en InsumoServiceImpl/useCaja.ts.
    private Usuario obtenerUsuarioOperador(Integer idUsuario) {
        if (idUsuario == null) {
            throw new SolicitudInvalidaException("No se detectó un usuario logueado activo.");
        }
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));
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