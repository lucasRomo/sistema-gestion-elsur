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
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final TurnoRepository turnoRepository;

    @Override
    @Transactional
    public void registrarCompraInsumo(CompraInsumoDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("Debe ingresar al menos un insumo en la compra.");
        }

        // 1. Registro de cabecera de la compra
        CompraProveedor compra = new CompraProveedor();
        compra.setFecha(LocalDateTime.now());
        compra.setMontoTotal(dto.getMontoTotal());
        compra.setMetodoPago(dto.getMetodoPago());
        compra.setObservacion(dto.getConcepto());

        Proveedor proveedorObj = null;
        if (dto.getIdProveedor() != null) {
            proveedorObj = proveedorRepository.findById(dto.getIdProveedor()).orElse(null);
            compra.setProveedor(proveedorObj);
        }

        compra = compraProveedorRepository.save(compra);

        // 2. Procesar detalle de items comprados
        for (CompraInsumoDTO.DetalleItemCompraDTO item : dto.getItems()) {
            Insumo insumo;
            BigDecimal factorConversion = (item.getFactorConversion() != null && item.getFactorConversion().compareTo(BigDecimal.ZERO) > 0)
                    ? item.getFactorConversion() : BigDecimal.ONE;
            BigDecimal cantidadComprada = item.getCantidadEmpaquetada() != null ? item.getCantidadEmpaquetada() : BigDecimal.ZERO;

            if (Boolean.TRUE.equals(item.getEsNuevoInsumo())) {
                insumo = new Insumo();
                insumo.setNombreInsumo(item.getNombreInsumo());
                
                BigDecimal precioVal = item.getPrecioUnitario() != null ? item.getPrecioUnitario() : BigDecimal.ZERO;

                insumo.setPrecio(precioVal);
                insumo.setStockEmpaquetado(cantidadComprada);
                insumo.setStockActual(BigDecimal.ZERO);
                insumo.setStockMinimo(BigDecimal.ONE);
                insumo.setFactorConversion(factorConversion);
                insumo.setEstado("Activo");

                if (proveedorObj != null) {
                    insumo.setProveedor(proveedorObj);
                }

                if (item.getIdUnidad() != null) {
                    UnidadMedida um = unidadMedidaRepository.findById(item.getIdUnidad()).orElse(null);
                    insumo.setUnidadMedida(um);
                }

                if (item.getIdUnidadCompra() != null) {
                    UnidadMedida uc = unidadMedidaRepository.findById(item.getIdUnidadCompra()).orElse(null);
                    insumo.setUnidadCompra(uc);
                }

                insumo = insumoRepository.save(insumo);
            } else {
                Integer idInsumoInt = item.getIdInsumo() != null ? item.getIdInsumo().intValue() : null;
                if (idInsumoInt == null) {
                    throw new IllegalArgumentException("El ID del insumo existente no puede ser nulo.");
                }

                insumo = insumoRepository.findById(idInsumoInt)
                        .orElseThrow(() -> new RuntimeException("Insumo no encontrado ID: " + idInsumoInt));

                BigDecimal actualBultos = insumo.getStockEmpaquetado() != null ? insumo.getStockEmpaquetado() : BigDecimal.ZERO;
                BigDecimal nuevoStockBultos = actualBultos.add(cantidadComprada);

                insumo.setStockEmpaquetado(nuevoStockBultos);

                if (item.getPrecioUnitario() != null && item.getPrecioUnitario().compareTo(BigDecimal.ZERO) > 0) {
                    insumo.setPrecio(item.getPrecioUnitario());
                }

                if (item.getFactorConversion() != null && item.getFactorConversion().compareTo(BigDecimal.ZERO) > 0) {
                    insumo.setFactorConversion(item.getFactorConversion());
                }

                insumo = insumoRepository.save(insumo);
            }

            BigDecimal cantidadNeta = cantidadComprada.multiply(factorConversion);

            DetalleCompraInsumo detalle = new DetalleCompraInsumo();
            detalle.setCompra(compra);
            detalle.setInsumo(insumo);
            detalle.setCantidadCompradaUnidadProveedor(cantidadComprada);
            detalle.setFactorConversionAHojas(factorConversion);
            detalle.setCantidadNetaIngresada(cantidadNeta);
            detalle.setPrecioUnitarioCompra(item.getPrecioUnitario());

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

        // Vincula el movimiento al turno de caja actualmente abierto.
        // Sin esto, el movimiento no aparecía en el detalle de arqueo por turno,
        // aunque sí figuraba en el listado de movimientos del día.
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