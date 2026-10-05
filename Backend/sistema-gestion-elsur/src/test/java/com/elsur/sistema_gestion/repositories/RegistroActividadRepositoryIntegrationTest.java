package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.RegistroActividad;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;

import static org.junit.jupiter.api.Assertions.*;

// Historial de actividad paginado contra H2: filtra por tabla, pagina y devuelve lo más nuevo primero.
@SpringBootTest
@Transactional
class RegistroActividadRepositoryIntegrationTest {

    @Autowired private RegistroActividadRepository repository;

    private RegistroActividad registro(String tabla) {
        RegistroActividad r = new RegistroActividad();
        r.setFecha(new Timestamp(System.currentTimeMillis()));
        r.setAccion("UPDATE");
        r.setTablaAfectada(tabla);
        r.setColumnaAfectada("nombre");
        r.setIdRegistroMod(1);
        return repository.save(r);
    }

    @Test
    @DisplayName("Filtra por tabla y pagina con los más recientes primero")
    void filtraYPagina() {
        for (int i = 0; i < 3; i++) registro("TablaDePruebaPaginado");
        RegistroActividad ultimo = registro("TablaDePruebaPaginado");
        registro("OtraTabla");

        Page<RegistroActividad> primera = repository.buscarConFiltrosPaginado(null, "%tabladepruebapaginado%", PageRequest.of(0, 2));

        assertEquals(4, primera.getTotalElements());
        assertEquals(2, primera.getContent().size());
        assertFalse(primera.isLast());
        assertEquals(ultimo.getIdRegAct(), primera.getContent().get(0).getIdRegAct());
    }
}
