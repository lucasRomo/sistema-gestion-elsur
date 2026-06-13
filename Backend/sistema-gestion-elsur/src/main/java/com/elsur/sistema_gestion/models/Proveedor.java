package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Proveedor")
@Data
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor")
    private Integer idProveedor;

    @Column(name = "nombre_comercial", nullable = false, length = 100)
    private String nombreComercial;

    @Column(name = "contacto_nombre", length = 100)
    private String contactoNombre;

    @Column(name = "email_contacto", length = 100)
    private String emailContacto;

    @Column(name = "estado", length = 20)
    private String estado;

    @ManyToOne
    @JoinColumn(name = "id_direccion")
    private Direccion direccion;

    @ManyToOne
    @JoinColumn(name = "id_tipo_proveedor")
    private TipoProveedor tipoProveedor;

    // ... otros campos y relaciones ...
}