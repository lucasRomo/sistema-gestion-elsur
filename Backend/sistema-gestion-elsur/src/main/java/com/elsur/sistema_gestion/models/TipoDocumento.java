package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "TipoDocumento")
@Data
public class TipoDocumento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_documento")
    private Integer idTipoDocumento;

    @Column(nullable = false, length = 45)
    private String nombreTipo;
}