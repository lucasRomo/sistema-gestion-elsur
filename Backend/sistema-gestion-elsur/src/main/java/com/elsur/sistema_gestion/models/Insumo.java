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
    private BigDecimal precio = BigDecimal.ZERO;

    // Stock de consumo en unidades sueltas (ej: Hojas)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal stockActual = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    // Unidad de consumo (ej: Hoja, ml, unidad)
    @ManyToOne
    @JoinColumn(name = "id_unidad")
    private UnidadMedida unidadMedida;

    // --- GP.33: Campos para Conversión de Insumos Empaquetados ---
    // Unidad de compra / bulto (ej: Resma, Caja, Botella)
    @ManyToOne
    @JoinColumn(name = "id_unidad_compra")
    private UnidadMedida unidadCompra;

    // Factor de conversión (ej: 500 hojas por resma)
    @Column(precision = 10, scale = 2)
    private BigDecimal factorConversion;

    // Stock en bultos / empaques cerrados (ej: 10 resmas)
    @Column(precision = 10, scale = 2)
    private BigDecimal stockEmpaquetado = BigDecimal.ZERO;

    @ManyToOne
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @Column(length = 20)
    private String estado;
}