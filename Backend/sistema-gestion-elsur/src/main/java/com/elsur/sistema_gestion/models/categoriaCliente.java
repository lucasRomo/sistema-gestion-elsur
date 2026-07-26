package com.elsur.sistema_gestion.models;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "CategoriaCliente")
@Data
public class categoriaCliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Integer idCategoria;

    @Column(nullable = false, length = 45)
    private String nombre;

    @Column(name = "descuento_automatico", nullable = false, precision = 5, scale = 2)
    private BigDecimal descuentoAutomatico = BigDecimal.ZERO;
    
}
