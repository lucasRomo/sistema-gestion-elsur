package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Direccion")
@Data
public class Direccion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_direccion")
    private Integer idDireccion;

    @Column(nullable = false, length = 100)
    private String calle;

    @Column(nullable = false, length = 10)
    private String numero;

    private String piso;
    private String departamento;
    private String codigoPostal;

    @Column(nullable = false, length = 45)
    private String ciudad;

    @Column(nullable = false, length = 45)
    private String provincia;

    @Column(nullable = false, length = 45)
    private String pais = "Argentina";
}