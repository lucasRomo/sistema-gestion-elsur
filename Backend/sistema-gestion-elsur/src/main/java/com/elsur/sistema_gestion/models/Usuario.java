package com.elsur.sistema_gestion.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    // Antes este campo se serializaba tal cual en cada respuesta JSON que
    // devolviera un Usuario (login, listar, crear, actualizar): el hash BCrypt
    // completo viajaba al cliente. El material teórico es explícito en que la
    // contraseña "jamás aparece en un DTO de salida"; acá no se usa un DTO
    // separado.
    // OJO: iba con @JsonIgnore, pero @JsonIgnore bloquea el campo en los DOS
    // sentidos (lectura Y escritura) salvo que se lo pise explícitamente.
    // Eso rompía el login y el alta: Jackson descartaba el "password" que
    // mandaba el cliente en el body y el campo llegaba null al service (se
    // comprobó con un test de deserialización aislado). WRITE_ONLY es lo que
    // realmente hace falta acá: Jackson puede LEER el campo desde el JSON de
    // entrada (login/alta/edición vía @RequestBody), pero nunca lo ESCRIBE en
    // la respuesta.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
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
