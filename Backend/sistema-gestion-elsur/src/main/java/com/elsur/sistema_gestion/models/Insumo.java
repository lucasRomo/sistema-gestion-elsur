package com.elsur.sistema_gestion.models;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Insumo")
@Data
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_insumo")
    private Integer idInsumo;

    @Column(nullable = false, length = 100)
    private String nombreInsumo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal stockActual = BigDecimal.ZERO;;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal stockMinimo = BigDecimal.ZERO;;

    @ManyToOne
    @JoinColumn(name = "id_unidad")
    private UnidadMedida unidadMedida;

    @ManyToOne
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @Column(length = 20)
    private String estado;

    // ... otros campos y relaciones ...
}


