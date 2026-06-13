package com.elsur.sistema_gestion.models;


import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;


@Entity
@Table(name = "CompraProveedor")
public class CompraProveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_compra")
    private Long idCompra;

    @ManyToOne
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "id_usuario_receptor", nullable = false)
    private Usuario usuarioReceptor;

    @Column(name = "fechaCompra")
    private LocalDate fechaCompra;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotalCompra;

    @Column(length = 50)
    private String numeroRemitoFactura;

    // Getters and Setters
}