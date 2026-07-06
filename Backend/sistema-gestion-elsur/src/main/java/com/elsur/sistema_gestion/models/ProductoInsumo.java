package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "Producto_Insumo")
@Data
public class ProductoInsumo {

    @EmbeddedId
    private ProductoInsumoId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idProducto")
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idInsumo")
    @JoinColumn(name = "id_insumo")
    private Insumo insumo;

    @Column(name = "cantidad_consumo", nullable = false, precision = 10, scale = 4)
    private BigDecimal cantidadConsumo;

    // Clase interna estática para la llave primaria compuesta
    @Data
    @Embeddable
    public static class ProductoInsumoId implements Serializable {
        
        @Column(name = "id_producto")
        private Integer idProducto;

        @Column(name = "id_insumo")
        private Integer idInsumo;
    }
}