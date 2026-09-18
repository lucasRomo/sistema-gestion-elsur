package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.dto.CompraInsumoDTO;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.CompraInsumoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CompraInsumoServiceImpl implements CompraInsumoService {

    private final CompraProveedorRepository compraProveedorRepository;
    private final DetalleCompraInsumoRepository detalleCompraInsumoRepository;
    private final InsumoRepository insumoRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final TurnoRepository turnoRepository;

    @Override
    @Transactional
    public void registrarCompraInsumo(CompraInsumoDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new SolicitudInvalidaException("Debe ingresar al menos un ítem en la compra.");
        }
        if (dto.getMontoTotal() == null || dto.getMontoTotal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new SolicitudInvalidaException("El monto total de la compra debe ser mayor a 0.");
        }

        // CORREGIDO: antes, si no se detectaba un usuario logueado válido, el
        // movimiento de caja generado por la compra quedaba sin autoría
        // (usuarioRepository...orElse(null) dejaba el campo usuario en null sin
        // avisar a nadie). Se unifica con el mismo criterio ya aplicado en
        // Caja/Insumos/Productos: se exige un usuario logueado real.
        Usuario usuarioOperador = obtenerUsuarioOperador(dto.getIdUsuario());

        // 1. Cabecera de la Compra
        CompraProveedor compra = new CompraProveedor();
        compra.setFecha(LocalDateTime.now());
        compra.setMontoTotal(dto.getMontoTotal());
        compra.setMetodoPago(dto.getMetodoPago());
        compra.setObservacion(dto.getConcepto());

        Proveedor proveedorObj = null;
        if (dto.getIdProveedor() != null) {
            // CORREGIDO: antes un idProveedor inválido se ignoraba en silencio
            // (.orElse(null)), guardando la compra sin proveedor sin informar el error.
            proveedorObj = proveedorRepository.findById(dto.getIdProveedor().intValue())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor no encontrado ID: " + dto.getIdProveedor()));
            compra.setProveedor(proveedorObj);
        }

        compra = compraProveedorRepository.save(compra);

        // 2. Procesamiento de Ítems (Insumos o Productos)
        for (CompraInsumoDTO.DetalleItemCompraDTO item : dto.getItems()) {
            // CORREGIDO: antes no se validaba cantidad/precio a nivel backend (el
            // formulario ya lo hacía, pero el endpoint quedaba expuesto a que
            // cualquier llamada directa a la API cargara stock con cantidades
            // nulas/negativas o precios negativos).
            BigDecimal cantidadComprada = item.getCantidadEmpaquetada();
            if (cantidadComprada == null || cantidadComprada.compareTo(BigDecimal.ZERO) <= 0) {
                throw new SolicitudInvalidaException("La cantidad comprada debe ser mayor a 0.");
            }
            BigDecimal precioUnitario = item.getPrecioUnitario();
            if (precioUnitario == null || precioUnitario.compareTo(BigDecimal.ZERO) < 0) {
                throw new SolicitudInvalidaException("El precio unitario no puede ser negativo.");
            }

            DetalleCompraInsumo detalle = new DetalleCompraInsumo();
            detalle.setCompra(compra);
            detalle.setCantidadCompradaUnidadProveedor(cantidadComprada);
            detalle.setPrecioUnitarioCompra(precioUnitario);

            if ("PRODUCTO".equalsIgnoreCase(item.getTipoItem()) || item.getIdProducto() != null) {
                if (item.getIdProducto() == null) {
                    throw new SolicitudInvalidaException("El ID del producto no puede ser nulo.");
                }

                // Conversión de Long a Integer para el repository
                Producto producto = productoRepository.findById(item.getIdProducto().intValue())
                        .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado ID: " + item.getIdProducto()));

                int stockActual = producto.getStock() != null ? producto.getStock() : 0;
                producto.setStock(stockActual + cantidadComprada.intValue());

                if (precioUnitario.compareTo(BigDecimal.ZERO) > 0) {
                    producto.setPrecioBase(precioUnitario);
                }

                productoRepository.save(producto);

                detalle.setProducto(producto);
                detalle.setFactorConversionAHojas(BigDecimal.ONE);
                detalle.setCantidadNetaIngresada(cantidadComprada);
            } else {
                Insumo insumo;
                BigDecimal factorConversion = (item.getFactorConversion() != null && item.getFactorConversion().compareTo(BigDecimal.ZERO) > 0)
                        ? item.getFactorConversion() : BigDecimal.ONE;

                if (Boolean.TRUE.equals(item.getEsNuevoInsumo())) {
                    // CORREGIDO: este alta de insumo guardaba directo por
                    // insumoRepository.save(), sin pasar por ninguna de las
                    // validaciones agregadas en InsumoServiceImpl.guardar() (nombre
                    // obligatorio, y sobre todo el chequeo de nombre duplicado). Eso
                    // permitía crear un insumo con el mismo nombre que uno ya
                    // existente directo desde la pantalla de "Compra de Insumos",
                    // sorteando la validación que sí se exige en el módulo Insumos.
                    if (item.getNombreInsumo() == null || item.getNombreInsumo().trim().isEmpty()) {
                        throw new SolicitudInvalidaException("Debe indicar el nombre del nuevo insumo.");
                    }
                    String nombreNormalizado = item.getNombreInsumo().trim();
                    if (insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(nombreNormalizado, -1)) {
                        throw new RecursoDuplicadoException(
                                "Ya existe un insumo registrado con el nombre '" + nombreNormalizado
                                        + "'. Selecciónelo desde \"Insumo Existente\" en vez de crearlo de nuevo.");
                    }
                    if (item.getIdUnidad() == null || item.getIdUnidadCompra() == null) {
                        throw new SolicitudInvalidaException("Debe indicar la Unidad Suelta y la Unidad de Empaque del nuevo insumo.");
                    }

                    insumo = new Insumo();
                    insumo.setNombreInsumo(nombreNormalizado);
                    insumo.setPrecio(precioUnitario);
                    insumo.setStockEmpaquetado(cantidadComprada);
                    insumo.setStockActual(BigDecimal.ZERO);
                    insumo.setStockMinimo(BigDecimal.ONE);
                    insumo.setFactorConversion(factorConversion);
                    insumo.setEstado("Activo");

                    if (proveedorObj != null) {
                        insumo.setProveedor(proveedorObj);
                    }

                    // CORREGIDO: unidades inexistentes se ignoraban en silencio
                    // (.orElse(null)), dejando el insumo nuevo sin unidad de medida.
                    UnidadMedida um = unidadMedidaRepository.findById(item.getIdUnidad().intValue())
                            .orElseThrow(() -> new RecursoNoEncontradoException("Unidad de medida (suelta) no encontrada ID: " + item.getIdUnidad()));
                    insumo.setUnidadMedida(um);

                    UnidadMedida uc = unidadMedidaRepository.findById(item.getIdUnidadCompra().intValue())
                            .orElseThrow(() -> new RecursoNoEncontradoException("Unidad de medida (empaque) no encontrada ID: " + item.getIdUnidadCompra()));
                    insumo.setUnidadCompra(uc);

                    insumo = insumoRepository.save(insumo);
                } else {
                    if (item.getIdInsumo() == null) {
                        throw new SolicitudInvalidaException("El ID del insumo existente no puede ser nulo.");
                    }

                    // Conversión de Long a Integer para el repository
                    insumo = insumoRepository.findById(item.getIdInsumo().intValue())
                            .orElseThrow(() -> new RecursoNoEncontradoException("Insumo no encontrado ID: " + item.getIdInsumo()));

                    BigDecimal actualBultos = insumo.getStockEmpaquetado() != null ? insumo.getStockEmpaquetado() : BigDecimal.ZERO;
                    insumo.setStockEmpaquetado(actualBultos.add(cantidadComprada));

                    if (precioUnitario.compareTo(BigDecimal.ZERO) > 0) {
                        insumo.setPrecio(precioUnitario);
                    }

                    if (item.getFactorConversion() != null && item.getFactorConversion().compareTo(BigDecimal.ZERO) > 0) {
                        insumo.setFactorConversion(item.getFactorConversion());
                    }

                    insumo = insumoRepository.save(insumo);
                }

                detalle.setInsumo(insumo);
                detalle.setFactorConversionAHojas(factorConversion);
                detalle.setCantidadNetaIngresada(cantidadComprada.multiply(factorConversion));
            }

            detalleCompraInsumoRepository.save(detalle);
        }

        // 3. Movimiento de Egreso en Caja
        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setMonto(dto.getMontoTotal());
        movimiento.setTipoMovimiento("EGRESO");
        movimiento.setCategoria("INSUMOS");
        movimiento.setDescripcion(dto.getConcepto());
        movimiento.setMetodoPago(dto.getMetodoPago());
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setComprobanteImagen(dto.getComprobanteImagen());

        Turno turnoAbierto = turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)
                .orElseThrow(() -> new SolicitudInvalidaException("No hay una caja abierta actualmente. No se puede registrar la compra."));
        movimiento.setTurno(turnoAbierto);
        movimiento.setUsuario(usuarioOperador);

        movimientoCajaRepository.save(movimiento);
    }

    private Usuario obtenerUsuarioOperador(Long idUsuario) {
        if (idUsuario == null) {
            throw new SolicitudInvalidaException("No se detectó un usuario logueado activo.");
        }
        return usuarioRepository.findById(idUsuario.intValue())
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));
    }
}
