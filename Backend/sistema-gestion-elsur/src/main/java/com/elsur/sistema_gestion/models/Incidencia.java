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
    @JoinColumn(name = "id_maquina")
    private Maquina maquina;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_reporte")
    private LocalDateTime fechaReporte = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "id_empleado_reporta")
    private Empleado empleadoReporta;

    @Column
    private String resolucion;

    @Column
    private LocalDateTime fechaResolucion;
}