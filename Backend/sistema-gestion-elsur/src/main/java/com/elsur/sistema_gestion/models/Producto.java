package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
    @NotNull(message = "El precio base es obligatorio.")
    @PositiveOrZero(message = "El precio base no puede ser negativo.")
    private BigDecimal precioBase;

    @ManyToOne
    @JoinColumn(name = "id_categoria")
    private CategoriaProducto categoria;

    @ManyToOne
    @JoinColumn(name = "id_maquina_necesaria")
    private Maquina maquinaNecesaria;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(name = "stock_vinculado")
    private Boolean stockVinculado = false;
    
    @Column(length = 20)
    private String estado;
}
