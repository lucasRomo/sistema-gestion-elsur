package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Area_Curso")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Area_Curso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idArea;

    @Column(nullable = false, length = 100)
    private String nombreArea;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_institucion", nullable = false)
    private Institucion institucion;
}