package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.dto.CompraInsumoDTO;
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
            throw new IllegalArgumentException("Debe ingresar al menos un ítem en la compra.");
        }

        // 1. Cabecera de la Compra
        CompraProveedor compra = new CompraProveedor();
        compra.setFecha(LocalDateTime.now());
        compra.setMontoTotal(dto.getMontoTotal());
        compra.setMetodoPago(dto.getMetodoPago());
        compra.setObservacion(dto.getConcepto());

        Proveedor proveedorObj = null;
        if (dto.getIdProveedor() != null) {
            // Conversión de Long a Integer para el repository
            proveedorObj = proveedorRepository.findById(dto.getIdProveedor().intValue()).orElse(null);
            compra.setProveedor(proveedorObj);
        }

        compra = compraProveedorRepository.save(compra);

        // 2. Procesamiento de Ítems (Insumos o Productos)
        for (CompraInsumoDTO.DetalleItemCompraDTO item : dto.getItems()) {
            BigDecimal cantidadComprada = item.getCantidadEmpaquetada() != null ? item.getCantidadEmpaquetada() : BigDecimal.ZERO;
            DetalleCompraInsumo detalle = new DetalleCompraInsumo();
            detalle.setCompra(compra);
            detalle.setCantidadCompradaUnidadProveedor(cantidadComprada);
            detalle.setPrecioUnitarioCompra(item.getPrecioUnitario() != null ? item.getPrecioUnitario() : BigDecimal.ZERO);

            if ("PRODUCTO".equalsIgnoreCase(item.getTipoItem()) || item.getIdProducto() != null) {
                if (item.getIdProducto() == null) {
                    throw new IllegalArgumentException("El ID del producto no puede ser nulo.");
                }

                // Conversión de Long a Integer para el repository
                Producto producto = productoRepository.findById(item.getIdProducto().intValue())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado ID: " + item.getIdProducto()));

                int stockActual = producto.getStock() != null ? producto.getStock() : 0;
                producto.setStock(stockActual + cantidadComprada.intValue());
                
                if (item.getPrecioUnitario() != null && item.getPrecioUnitario().compareTo(BigDecimal.ZERO) > 0) {
                    producto.setPrecioBase(item.getPrecioUnitario());
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
                    insumo = new Insumo();
                    insumo.setNombreInsumo(item.getNombreInsumo());
                    insumo.setPrecio(item.getPrecioUnitario() != null ? item.getPrecioUnitario() : BigDecimal.ZERO);
                    insumo.setStockEmpaquetado(cantidadComprada);
                    insumo.setStockActual(BigDecimal.ZERO);
                    insumo.setStockMinimo(BigDecimal.ONE);
                    insumo.setFactorConversion(factorConversion);
                    insumo.setEstado("Activo");

                    if (proveedorObj != null) {
                        insumo.setProveedor(proveedorObj);
                    }

                    if (item.getIdUnidad() != null) {
                        // Conversión de Long a Integer para el repository
                        UnidadMedida um = unidadMedidaRepository.findById(item.getIdUnidad().intValue()).orElse(null);
                        insumo.setUnidadMedida(um);
                    }

                    if (item.getIdUnidadCompra() != null) {
                        // Conversión de Long a Integer para el repository
                        UnidadMedida uc = unidadMedidaRepository.findById(item.getIdUnidadCompra().intValue()).orElse(null);
                        insumo.setUnidadCompra(uc);
                    }

                    insumo = insumoRepository.save(insumo);
                } else {
                    if (item.getIdInsumo() == null) {
                        throw new IllegalArgumentException("El ID del insumo existente no puede ser nulo.");
                    }

                    // Conversión de Long a Integer para el repository
                    insumo = insumoRepository.findById(item.getIdInsumo().intValue())
                            .orElseThrow(() -> new RuntimeException("Insumo no encontrado ID: " + item.getIdInsumo()));

                    BigDecimal actualBultos = insumo.getStockEmpaquetado() != null ? insumo.getStockEmpaquetado() : BigDecimal.ZERO;
                    insumo.setStockEmpaquetado(actualBultos.add(cantidadComprada));

                    if (item.getPrecioUnitario() != null && item.getPrecioUnitario().compareTo(BigDecimal.ZERO) > 0) {
                        insumo.setPrecio(item.getPrecioUnitario());
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
                .orElseThrow(() -> new RuntimeException("No hay una caja abierta actualmente. No se puede registrar la compra."));
        movimiento.setTurno(turnoAbierto);

        if (dto.getIdUsuario() != null) {
            Usuario usuario = usuarioRepository.findById(dto.getIdUsuario().intValue()).orElse(null);
            movimiento.setUsuario(usuario);
        }

        movimientoCajaRepository.save(movimiento);
    }
}