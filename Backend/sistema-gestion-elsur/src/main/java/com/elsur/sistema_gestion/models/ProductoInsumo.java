package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "Producto_Insumo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoInsumo {

    @EmbeddedId
    private ProductoInsumoId id = new ProductoInsumoId();

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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class ProductoInsumoId implements Serializable {
        
        @Column(name = "id_producto")
        private Integer idProducto;

        @Column(name = "id_insumo")
        private Integer idInsumo;
    }
}