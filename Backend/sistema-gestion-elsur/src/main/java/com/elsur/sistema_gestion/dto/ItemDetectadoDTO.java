package com.elsur.sistema_gestion.dto;

import java.math.BigDecimal;

public record ItemDetectadoDTO(
    String tipoItem,                 
    Long idInsumo,                   
    Long idProducto,                
    Boolean esNuevoInsumo,           
    Boolean encontradoEnBd,          
    String descripcion,              
    Double cantidad,                
    BigDecimal precioUnitario,       
    BigDecimal precioTotalDetectado, 
    String advertencia               
) {}