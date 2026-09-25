package com.elsur.sistema_gestion.models;

import java.math.BigDecimal;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
    @NotNull(message = "El precio es obligatorio.")
    @PositiveOrZero(message = "El precio no puede ser negativo.")
    private BigDecimal precio = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "El stock actual es obligatorio.")
    @PositiveOrZero(message = "El stock actual no puede ser negativo.")
    private BigDecimal stockActual = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "El stock mínimo es obligatorio.")
    @PositiveOrZero(message = "El stock mínimo no puede ser negativo.")
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    @ManyToOne
    @JoinColumn(name = "id_unidad")
    private UnidadMedida unidadMedida;

    @ManyToOne
    @JoinColumn(name = "id_unidad_compra")
    private UnidadMedida unidadCompra;

    @Column(precision = 10, scale = 2)
    private BigDecimal factorConversion;

    @Column(precision = 10, scale = 2)
    private BigDecimal stockEmpaquetado = BigDecimal.ZERO;

    @ManyToOne
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @Column(length = 20)
    private String estado;
}