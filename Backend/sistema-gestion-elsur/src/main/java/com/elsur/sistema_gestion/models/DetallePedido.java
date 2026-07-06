package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "DetallePedido")
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_detalle;

    @ManyToOne(fetch = FetchType.LAZY) // Optimiza la carga
    @JoinColumn(name = "id_pedido", nullable = false)
    @JsonIgnore // Importante para evitar bucles infinitos en JSON
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;
}