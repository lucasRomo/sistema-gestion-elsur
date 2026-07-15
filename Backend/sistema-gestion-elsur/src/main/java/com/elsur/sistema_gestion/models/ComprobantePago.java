package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "ComprobantePago")
public class ComprobantePago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_comprobante;

    @ManyToOne
    @JoinColumn(name = "id_pedido", nullable = false)
    @JsonIgnoreProperties("comprobantes")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Pedido pedido;

    @Column(length = 45, nullable = false)
    private String tipoPago;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal montoPago;

    @Column(columnDefinition = "TEXT")
    private String urlArchivoComprobante;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fechaCarga;
}