package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.Pedido;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

// Ejecuta las consultas del historial paginado contra H2: valida que el JPQL sea correcto
// (si no, el backend ni arranca) y que filtre, ordene y pagine como se espera.
@SpringBootTest
@Transactional
class PedidoRepositoryHistorialIntegrationTest {

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private ClienteRepository clienteRepository;

    private static final List<String> HISTORIAL = List.of("ENTREGADO", "CANCELADO", "FINALIZADO", "DEVUELTO");

    private Cliente cliente(String razonSocial) {
        Cliente c = new Cliente();
        c.setRazonSocial(razonSocial);
        c.setSaldoDeudor(BigDecimal.ZERO);
        c.setLimiteCredito(BigDecimal.ZERO);
        c.setEstado("Activo");
        c.setPersonaDeContacto("-");
        c.setCondicionDePago("Contado");
        return clienteRepository.save(c);
    }

    private Pedido pedido(Cliente c, String estado, LocalDateTime cierre) {
        Pedido p = new Pedido();
        p.setCliente(c);
        p.setEstado(estado);
        p.setMonto_total(BigDecimal.TEN);
        p.setFecha_entrega_estimada(LocalDateTime.now());
        p.setFecha_finalizacion(cierre);
        return pedidoRepository.save(p);
    }

    @Test
    @DisplayName("Busca por cliente, excluye pedidos activos y devuelve los más recientes primero")
    void buscaPorClienteYOrdenaDescendente() {
        Cliente imprenta = cliente("Imprenta Norte");
        Cliente otro = cliente("Colegio Sur");
        Pedido viejo = pedido(imprenta, "ENTREGADO", LocalDateTime.now().minusDays(3));
        Pedido nuevo = pedido(imprenta, "CANCELADO", LocalDateTime.now());
        pedido(imprenta, "PENDIENTE", null);
        pedido(otro, "ENTREGADO", LocalDateTime.now());

        Page<Pedido> pagina = pedidoRepository.buscarHistorial(HISTORIAL, "norte", "%norte%", PageRequest.of(0, 10));

        assertEquals(2, pagina.getTotalElements());
        assertEquals(nuevo.getId_pedido(), pagina.getContent().get(0).getId_pedido());
        assertEquals(viejo.getId_pedido(), pagina.getContent().get(1).getId_pedido());
    }

    @Test
    @DisplayName("Sin texto trae todo el historial, paginado")
    void sinTextoPagina() {
        Cliente c = cliente("Cliente Uno");
        for (int i = 0; i < 5; i++) pedido(c, "ENTREGADO", LocalDateTime.now());

        Page<Pedido> primera = pedidoRepository.buscarHistorial(HISTORIAL, "", "%%", PageRequest.of(0, 2));

        assertEquals(2, primera.getContent().size());
        assertTrue(primera.getTotalElements() >= 5);
        assertFalse(primera.isLast());
    }

    @Test
    @DisplayName("Busca por fecha de cierre")
    void buscaPorFecha() {
        Cliente c = cliente("Cliente Fecha");
        LocalDateTime dia = LocalDateTime.of(2026, 7, 14, 15, 30);
        Pedido delDia = pedido(c, "ENTREGADO", dia);
        pedido(c, "ENTREGADO", dia.minusDays(1));

        Page<Pedido> pagina = pedidoRepository.buscarHistorialPorFecha(HISTORIAL,
                dia.toLocalDate().atStartOfDay(), dia.toLocalDate().plusDays(1).atStartOfDay(), PageRequest.of(0, 10));

        assertEquals(1, pagina.getTotalElements());
        assertEquals(delDia.getId_pedido(), pagina.getContent().get(0).getId_pedido());
    }
}
