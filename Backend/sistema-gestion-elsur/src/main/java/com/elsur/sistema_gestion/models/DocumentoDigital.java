package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Table(name = "DocumentoDigital")
public class DocumentoDigital {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDocumento;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(length = 100, nullable = false)
    private String autor;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, length = 255)
    private String urlArchivoLocal;

    @ManyToOne
    @JoinColumn(name = "id_area", nullable = false)
    private Area_Curso area;

    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = true)
    private Producto producto; // Assuming Producto entity exists

    @Column(length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'Activo'")
    private String estado;

    // Getters and Setters
}