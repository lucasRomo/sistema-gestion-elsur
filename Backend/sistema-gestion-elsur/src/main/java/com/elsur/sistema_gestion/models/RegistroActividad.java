package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.sql.Timestamp;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonFormat; // Importante
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "registro_actividad") 
public class RegistroActividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reg_act")
    private Integer idRegAct;

    // --- CAMBIO AQUÍ ---
    @Column(name = "fecha")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    private Timestamp fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario")
    @JsonIgnoreProperties({"registrosActividad", "password"}) 
    private Usuario usuario;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "accion")
    private String accion;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "tabla_afectada")
    private String tablaAfectada;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "columna_afectada")
    private String columnaAfectada;

    @Column(name = "id_registro_mod")
    private Integer idRegistroMod;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos_anteriores")
    private String datosAnteriores;

    @JdbcTypeCode(SqlTypes.JSON) 
    @Column(name = "datos_nuevos")
    private String datosNuevos;
}