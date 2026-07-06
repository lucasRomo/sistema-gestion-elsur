package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "UnidadMedida")
@Data
public class UnidadMedida {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_unidad")
    private Integer idUnidad;

    @Column(nullable = false, length = 45)
    private String nombre;

    @Column(nullable = false, length = 10)
    private String abreviatura;
}