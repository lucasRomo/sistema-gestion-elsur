package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.DetallePedido;
import com.elsur.sistema_gestion.repositories.DetallePedidoRepository;
import com.elsur.sistema_gestion.services.DetallePedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class DetallePedidoServiceImpl implements DetallePedidoService {

    @Autowired
    private DetallePedidoRepository detalleRepository;

    @Override
    public DetallePedido guardar(DetallePedido detalle) {
        // Lógica de negocio: Calcular subtotal antes de guardar
        BigDecimal sub = detalle.getProducto().getPrecioBase().multiply(new BigDecimal(detalle.getCantidad()));
        detalle.setSubtotal(sub);
        detalle.setPrecioUnitario(detalle.getProducto().getPrecioBase());
        
        return detalleRepository.save(detalle);
    }

    @Override
    public List<DetallePedido> listarPorPedido(Integer idPedido) {
        // Aquí podrías filtrar detalles por un pedido específico
        return detalleRepository.findAll(); 
    }
}