package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "usuario")
@Data
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUsuario;

    @Column(name = "nombre_usuario", unique = true, nullable = false)
    private String nombreUsuario;

    @Column(name = "contrasena", nullable = false)
    private String password;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "id_persona")
    private Persona persona;

    @ManyToOne
    @JoinColumn(name = "id_rol")
    private Rol rol;

    @Transient
    private java.math.BigDecimal salario;
// Esto
    @Transient
    private String estado;

    @Transient
    private String cargo;
}