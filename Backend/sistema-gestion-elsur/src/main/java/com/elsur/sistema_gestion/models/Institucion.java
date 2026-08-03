package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Institucion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Institucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInstitucion;

    @Column(nullable = false, unique = true, length = 150)
    private String nombreInstitucion;

    @Column(length = 50)
    private String tipoInstitucion;
}