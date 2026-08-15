package com.elsur.sistema_gestion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompraInsumoDTO {
    private BigDecimal montoTotal;
    private String metodoPago;
    private String concepto;
    private Long idUsuario;
    private Integer idProveedor;
    private List<DetalleItemCompraDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetalleItemCompraDTO {
        private Long idInsumo;
        private Boolean esNuevoInsumo;
        private String nombreInsumo;
        private BigDecimal cantidadEmpaquetada;
        private BigDecimal precioUnitario;
        private BigDecimal factorConversion;
        private Integer idUnidad;
        private Integer idUnidadCompra;
    }
}