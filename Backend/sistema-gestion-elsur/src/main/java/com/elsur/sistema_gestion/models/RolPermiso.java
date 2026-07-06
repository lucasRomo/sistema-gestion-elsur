package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
@Entity
@Table(name = "Rol_Permiso")
@Data
public class RolPermiso {

    @EmbeddedId
    private RolPermisoId id;

    @ManyToOne
    @MapsId("idRol")
    @JoinColumn(name = "id_rol")
    private Rol rol;

    @ManyToOne
    @MapsId("idPermiso")
    @JoinColumn(name = "id_permiso")
    private Permiso permiso;

    @Data
    @Embeddable
    public static class RolPermisoId implements Serializable {
        @Column(name = "id_rol")
        private Integer idRol;

        @Column(name = "id_permiso")
        private Integer idPermiso;
    }
}