package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;


@Entity
@Table(name = "Area_Curso")
public class Area_Curso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idArea;

    @Column(nullable = false, length = 100)
    private String nombreArea;

    @ManyToOne
    @JoinColumn(name = "id_institucion", nullable = false)
    private Institucion institucion;

}