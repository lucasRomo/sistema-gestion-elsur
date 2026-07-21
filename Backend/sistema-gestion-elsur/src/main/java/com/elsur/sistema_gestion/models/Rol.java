package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "rol")
@Data
public class Rol {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRol;

    private String nombreRol; // Ejemplo: "ADMIN", "GERENTE", "OPERARIO"

    // --- NUEVO: Relación directa con los permisos ---
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rol_permiso", // El nombre real de tu tabla intermedia en la BD
        joinColumns = @JoinColumn(name = "id_rol"),
        inverseJoinColumns = @JoinColumn(name = "id_permiso")
    )
    private List<Permiso> permisos;
}