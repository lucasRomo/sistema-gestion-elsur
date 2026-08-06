package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
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

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Column(name = "prioridad", length = 20)
    private String prioridad = "MEDIA"; // 'BAJA', 'MEDIA', 'ALTA', 'CRITICA'

    @Column(name = "estado_incidencia", length = 20)
    private String estadoIncidencia = "PENDIENTE"; // 'PENDIENTE', 'RESUELTA'

    @Column(name = "fecha_reporte")
    private LocalDateTime fechaReporte = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "id_empleado_reporta")
    private Empleado empleadoReporta;

    @Column(columnDefinition = "TEXT")
    private String resolucion;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @ManyToOne
    @JoinColumn(name = "id_empleado_resuelve")
    private Empleado empleadoResuelve;
}