package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "producto")
@Data
public class Producto {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer idProducto;

    @Column(nullable = false, length = 100)
    private String nombreProducto;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioBase;

    @ManyToOne
    @JoinColumn(name = "id_categoria")
    private Categoria categoria;

    @ManyToOne
    @JoinColumn(name = "id_maquina_necesaria")
    private Maquina maquinaNecesaria;

    // ... dentro de la clase Producto
@Column(nullable = false)
private Integer stock = 0; // Valor por defecto
    
    @Column(length = 20)
    private String estado;
}
