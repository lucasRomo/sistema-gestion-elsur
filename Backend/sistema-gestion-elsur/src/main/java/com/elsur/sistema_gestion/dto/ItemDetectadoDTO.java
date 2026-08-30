package com.elsur.sistema_gestion.dto;

import java.math.BigDecimal;

public record ItemDetectadoDTO(
    String tipoItem,                 // "INSUMO" o "PRODUCTO"
    Long idInsumo,                   // ID si matcheó con un Insumo existente (o null)
    Long idProducto,                 // ID si matcheó con un Producto existente (o null)
    Boolean esNuevoInsumo,           // Ahora se mantiene en false (ya no crea automáticos)
    Boolean encontradoEnBd,          // true si matcheó con la BD, false si no existe
    String descripcion,              // Nombre detectado o mapeado del catálogo
    Double cantidad,                 // Cantidad detectada
    BigDecimal precioUnitario,       // Precio unitario
    BigDecimal precioTotalDetectado, // Total exacto detectado en ticket (opcional)
    String advertencia               // Mensaje de alerta si el ítem no fue encontrado
) {}