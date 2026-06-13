package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.sql.Timestamp;

@Data
@Entity
@Table(name = "RegistroActividad")
public class RegistroActividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRegAct;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Timestamp fecha;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(length = 100, nullable = false)
    private String accion;

    @Column(length = 50, nullable = false)
    private String tablaAfectada;

    @Column(columnDefinition = "JSONB")
    private String datosAnteriores;

    @Column(columnDefinition = "JSONB")
    private String datosNuevos;
}