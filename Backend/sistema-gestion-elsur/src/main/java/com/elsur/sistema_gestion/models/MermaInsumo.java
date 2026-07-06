package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "MermaInsumo")
@Data
public class MermaInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_merma")
    private Integer idMerma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_maquina_asociada", nullable = true)
    private Maquina maquina;

    @Column(name = "cantidad_desperdiciada", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadDesperdiciada;

    @Column(name = "motivo", nullable = false, length = 255)
    private String motivo;

    @Column(name = "fecha_registro", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fechaRegistro;

    // Hook para inicializar la fecha antes de persistir
    @PrePersist
    protected void onCreate() {
        fechaRegistro = LocalDateTime.now();
    }
}