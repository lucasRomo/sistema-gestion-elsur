package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Maquina")
@Data
public class Maquina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_maquina")
    private Integer idMaquina;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 20)
    private String estado = "OPERATIVA"; // 'OPERATIVA', 'FALLA', 'MANTENIMIENTO'
}