package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Incidencia")
@Data
public class Incidencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_incidencia")
    private Integer idIncidencia;

    @ManyToOne
    @JoinColumn(name = "id_maquina", nullable = false)
    private Maquina maquina;

    // Etapa 1: Falla reportada
    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Column(name = "fecha_reporte")
    private LocalDateTime fechaReporte = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "id_empleado_reporta")
    private Empleado empleadoReporta;

    @Column(name = "prioridad", length = 20)
    private String prioridad = "MEDIA"; // 'BAJA', 'MEDIA', 'ALTA', 'CRITICA'

    @Column(name = "estado_incidencia", length = 20)
    private String estadoIncidencia = "PENDIENTE"; // 'PENDIENTE', 'MANTENIMIENTO', 'RESUELTA'

    // Etapa 2: Revisión en taller / Mantenimiento
    @Column(name = "nota_mantenimiento", columnDefinition = "TEXT")
    private String notaMantenimiento;

    @Column(name = "fecha_mantenimiento")
    private LocalDateTime fechaMantenimiento;

    @ManyToOne
    @JoinColumn(name = "id_empleado_mantenimiento")
    private Empleado empleadoMantenimiento;

    // Etapa 3: Alta operativa y Solución
    @Column(columnDefinition = "TEXT")
    private String resolucion;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @ManyToOne
    @JoinColumn(name = "id_empleado_resuelve")
    private Empleado empleadoResuelve;

    // Control de Pago de Mantenimiento
    @Column(name = "pagado")
    private Boolean pagado = false;

    @Column(name = "monto_pagado")
    private BigDecimal montoPagado;
}