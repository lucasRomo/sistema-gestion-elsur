package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Institucion")
public class Institucion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInstitucion;

    @Column(nullable = false, unique = true, length = 150)
    private String nombreInstitucion;

    @Column(length = 50)
    private String tipoInstitucion;

    // Getters and Setters
}