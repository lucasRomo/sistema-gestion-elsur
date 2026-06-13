package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "Categoria")
@Data
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Integer idCategoria;

    @Column(nullable = false, length = 45)
    private String nombre;

    @Column(name = "descuento_automatico")
    private BigDecimal descuentoAutomatico = BigDecimal.ZERO; 
    // Ejemplo: 15.00 para representar un 15%
}