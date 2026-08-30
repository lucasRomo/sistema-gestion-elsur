package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "detalle_compra_insumo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleCompraInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_compra")
    private Long idDetalleCompra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_compra", nullable = false, referencedColumnName = "id_compra")
    private CompraProveedor compra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_insumo", nullable = true)
    private Insumo insumo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto", nullable = true)
    private Producto producto;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadCompradaUnidadProveedor;

    @Column(precision = 10, scale = 2)
    private BigDecimal factorConversionAHojas;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadNetaIngresada;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitarioCompra;
}