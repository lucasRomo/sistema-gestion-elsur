package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.models.UnidadMedida;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
import com.elsur.sistema_gestion.repositories.UnidadMedidaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

// Borrar algo que otros registros usan (ej. una unidad de medida asignada a un insumo) antes
// devolvía el mensaje genérico "La solicitud no pudo procesarse". Ahora explica el motivo.
@SpringBootTest
@Transactional
class BorradoEnUsoIntegrationTest {

    @Autowired private UnidadMedidaService unidadMedidaService;
    @Autowired private UnidadMedidaRepository unidadMedidaRepository;
    @Autowired private InsumoRepository insumoRepository;
    @Autowired private EntityManager entityManager;

    @Test
    @DisplayName("Borrar una unidad que usa un insumo da un mensaje claro")
    void unidadEnUso() {
        UnidadMedida unidad = new UnidadMedida();
        unidad.setNombre("Bolsa de prueba");
        unidad = unidadMedidaRepository.saveAndFlush(unidad);

        Insumo insumo = new Insumo();
        insumo.setNombreInsumo("Insumo con bolsa");
        insumo.setPrecio(BigDecimal.ONE);
        insumo.setStockActual(BigDecimal.TEN);
        insumo.setStockMinimo(BigDecimal.ONE);
        insumo.setUnidadMedida(unidad);
        insumo.setEstado("Activo");
        insumoRepository.saveAndFlush(insumo);
        // Como en el sistema real (otra petición): el insumo no está cargado en memoria y es la
        // base de datos la que rechaza el borrado.
        entityManager.clear();

        Integer id = unidad.getIdUnidad();
        ConflictoDeIntegridadException ex = assertThrows(ConflictoDeIntegridadException.class,
                () -> unidadMedidaService.eliminar(id));
        assertTrue(ex.getMessage().contains("la usan uno o más insumos"));
    }

    @Test
    @DisplayName("Una unidad que nadie usa se borra sin problemas")
    void unidadLibre() {
        UnidadMedida unidad = new UnidadMedida();
        unidad.setNombre("Unidad sin uso");
        unidad = unidadMedidaRepository.saveAndFlush(unidad);
        Integer id = unidad.getIdUnidad();

        unidadMedidaService.eliminar(id);

        assertFalse(unidadMedidaRepository.existsById(id));
    }
}
