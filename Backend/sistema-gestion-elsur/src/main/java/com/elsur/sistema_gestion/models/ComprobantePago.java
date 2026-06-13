package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ComprobantePago")
public class ComprobantePago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_comprobante;

    @ManyToOne
    @JoinColumn(name = "id_pedido", nullable = false)
    private Pedido pedido;

    @Column(length = 45, nullable = false)
    private String tipoPago; // 'EFECTIVO', 'TRANSFERENCIA', 'DEBITO'

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal montoPago;

    @Column(columnDefinition = "TEXT")
    private String urlArchivoComprobante;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fechaCarga;
}