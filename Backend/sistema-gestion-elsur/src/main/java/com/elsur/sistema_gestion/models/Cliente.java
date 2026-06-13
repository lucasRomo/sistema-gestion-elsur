package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "Cliente")
@Data
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Integer idCliente;

    @Column(name = "razon_social", nullable = false, length = 100)
    private String razonSocial;

    @Column(name = "saldo_deudor", nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoDeudor;

    @Column(name = "limite_credito", nullable = false, precision = 10, scale = 2)
    private BigDecimal limiteCredito;

    @ManyToOne
@JoinColumn(name = "id_categoria")
private Categoria categoria;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @ManyToOne
    @JoinColumn(name = "id_persona")
    private Persona persona;

    // ... otros campos y relaciones ...
}