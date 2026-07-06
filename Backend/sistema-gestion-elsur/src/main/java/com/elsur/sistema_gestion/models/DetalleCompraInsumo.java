package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import java.math.BigDecimal;


@Entity
@Table(name = "DetalleCompraInsumo")
public class DetalleCompraInsumo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDetalleCompra;

    @ManyToOne
    @JoinColumn(name = "id_compra", nullable = false, referencedColumnName = "id_compra")
    private CompraProveedor compra;

    @ManyToOne
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadCompradaUnidadProveedor;

    @Column(precision = 10, scale = 2)
    private BigDecimal factorConversionAHojas;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadNetaIngresada;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitarioCompra;

    // Getters and Setters
}