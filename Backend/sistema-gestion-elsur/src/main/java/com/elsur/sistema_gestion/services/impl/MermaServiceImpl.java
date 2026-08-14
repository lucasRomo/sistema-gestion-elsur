package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.models.Merma;
import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
import com.elsur.sistema_gestion.repositories.MermaRepository;
import com.elsur.sistema_gestion.repositories.PedidoRepository; // <-- Importar
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.services.MermaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MermaServiceImpl implements MermaService {

    private final MermaRepository mermaRepository;
    private final ProductoRepository productoRepository;
    private final InsumoRepository insumoRepository;
    private final PedidoRepository pedidoRepository; // <-- Inyectar

    @Override
    @Transactional
    public List<Merma> registrarMermas(List<Merma> mermas) {
        List<Merma> guardadas = new ArrayList<>();

        for (Merma merma : mermas) {
            if (merma.getFechaMerma() == null) {
                merma.setFechaMerma(LocalDateTime.now());
            }

            // Asignar el Pedido persistido en la BD
            if (merma.getPedido() != null) {
                Integer idPed = merma.getPedido().getId_pedido(); // Se cambia Long por Integer
                if (idPed != null) {
                    Pedido pedidoDb = pedidoRepository.findById(idPed).orElse(null);
                    merma.setPedido(pedidoDb);
                }
            }

            // 1. Descuento de stock en Producto
            if (merma.getProducto() != null && merma.getProducto().getIdProducto() != null) {
                Producto prod = productoRepository.findById(merma.getProducto().getIdProducto()).orElse(null);
                if (prod != null && prod.getStock() != null) {
                    int cantidad = merma.getCantidad() != null ? merma.getCantidad().intValue() : 0;
                    prod.setStock(Math.max(0, prod.getStock() - cantidad));
                    productoRepository.save(prod);
                }
            }

            // 2. Descuento de stock en Insumo
            if (merma.getInsumo() != null && merma.getInsumo().getIdInsumo() != null) {
                Insumo ins = insumoRepository.findById(merma.getInsumo().getIdInsumo()).orElse(null);
                if (ins != null && ins.getStockActual() != null) {
                    BigDecimal cantidad = merma.getCantidad() != null 
                        ? BigDecimal.valueOf(merma.getCantidad()) 
                        : BigDecimal.ZERO;

                    BigDecimal nuevoStock = ins.getStockActual().subtract(cantidad);
                    if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) {
                        nuevoStock = BigDecimal.ZERO;
                    }
                    ins.setStockActual(nuevoStock);
                    insumoRepository.save(ins);
                }
            }

            guardadas.add(mermaRepository.save(merma));
        }

        return guardadas;
    }

    @Override
    public List<Merma> obtenerPorPedido(Long idPedido) {
        return mermaRepository.findByPedidoId(idPedido);
    }
}