package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "DocumentoDigital")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private String nombreArchivoOriginal;

    @Column(nullable = false, length = 255)
    private String urlArchivoLocal;

    private Integer cantidadPaginas;

    private Long tamanoBytes;

    @Column(length = 20)
    private String tipoArchivo; // PDF, DOCX, JPG, PNG

    @Column(length = 20, nullable = false)
    private String estado = "Activo"; // 'Activo' o 'Inactivo'

    private LocalDateTime fechaSubida;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_area", nullable = false)
    private Area_Curso area;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "id_producto", nullable = true)
    private Producto producto;

    @PrePersist
    public void prePersist() {
        if (this.fechaSubida == null) {
            this.fechaSubida = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = "Activo";
        }
    }
}