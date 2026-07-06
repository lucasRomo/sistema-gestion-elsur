package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "TipoPersona")
@Data
public class TipoPersona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_persona")
    private Integer idTipoPersona;

    @Column(nullable = false, length = 45)
    private String nombreTipo;
}