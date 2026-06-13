package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "TipoProveedor")
@Data
public class TipoProveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_proveedor")
    private Integer idTipoProveedor;

    @Column(name = "descripcion",nullable = false, length = 100)
    private String descripcion;
}