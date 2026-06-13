package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "persona")
@Data
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_persona")
    private Integer idPersona;

    private String nombre;
    private String apellido;

    @Column(name = "numero_documento", unique = true, nullable = false)
    private String numeroDocumento;

    private String telefono;
    private String email;

    // --- RELACIONES ATÓMICAS ---

    @ManyToOne
    @JoinColumn(name = "id_tipo_documento")
    private TipoDocumento tipoDocumento;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "id_direccion")
    private Direccion direccion;

    @ManyToOne
    @JoinColumn(name = "id_tipo_persona")
    private TipoPersona tipoPersona;


}