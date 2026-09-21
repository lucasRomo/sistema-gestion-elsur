package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.models.MovimientoCuentaCorriente;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.MovimientoCuentaCorrienteRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CuentaCorrienteControllerUnitTest {

    @Mock private ClienteRepository clienteRepository;
    @Mock private MovimientoCuentaCorrienteRepository movimientoCtaCteRepository;
    @Mock private MovimientoCajaService movimientoCajaService;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private CuentaCorrienteController controller;

    private Cliente clienteConPersona(Integer id, BigDecimal saldoDeudor, BigDecimal limiteCredito) {
        Cliente c = new Cliente();
        c.setIdCliente(id);
        c.setSaldoDeudor(saldoDeudor);
        c.setLimiteCredito(limiteCredito);
        Persona p = new Persona();
        p.setNombre("Juan");
        p.setApellido("Perez");
        c.setPersona(p);
        return c;
    }

    private Usuario usuario(Integer id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }


    @Test
    @DisplayName("actualizarLimite: cliente inexistente lanza RecursoNoEncontradoException")
    void actualizarLimite_clienteInexistente_lanzaRecursoNoEncontrado() {
        when(clienteRepository.findById(99)).thenReturn(Optional.empty());
        Map<String, BigDecimal> payload = Map.of("limiteCredito", BigDecimal.TEN);

        assertThrows(RecursoNoEncontradoException.class, () -> controller.actualizarLimite(99, payload));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: actualizarLimite sin el campo limiteCredito se rechaza en vez de romper con NullPointerException")
    void actualizarLimite_sinLimite_seRechaza() {
        Cliente cliente = clienteConPersona(1, BigDecimal.ZERO, BigDecimal.TEN);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));

        assertThrows(SolicitudInvalidaException.class, () -> controller.actualizarLimite(1, Map.of()));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: actualizarLimite con un límite negativo se rechaza")
    void actualizarLimite_negativo_seRechaza() {
        Cliente cliente = clienteConPersona(1, BigDecimal.ZERO, BigDecimal.TEN);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));
        Map<String, BigDecimal> payload = Map.of("limiteCredito", new BigDecimal("-500"));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> controller.actualizarLimite(1, payload));
        assertTrue(ex.getMessage().toLowerCase().contains("negativo"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizarLimite: un límite válido se persiste correctamente")
    void actualizarLimite_valido_seActualiza() {
        Cliente cliente = clienteConPersona(1, BigDecimal.ZERO, BigDecimal.TEN);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));
        Map<String, BigDecimal> payload = Map.of("limiteCredito", new BigDecimal("50000"));

        assertDoesNotThrow(() -> controller.actualizarLimite(1, payload));

        assertEquals(0, new BigDecimal("50000").compareTo(cliente.getLimiteCredito()));
        verify(clienteRepository).save(cliente);
    }


    @Test
    @DisplayName("CORREGIDO: registrarPago sin el campo monto se rechaza")
    void registrarPago_sinMonto_seRechaza() {
        assertThrows(SolicitudInvalidaException.class, () -> controller.registrarPago(1, Map.of("idUsuario", 5)));
        verify(clienteRepository, never()).findById(any());
    }

    @Test
    @DisplayName("CORREGIDO: registrarPago con un monto en cero o negativo se rechaza")
    void registrarPago_montoInvalido_seRechaza() {
        Map<String, Object> payload = Map.of("monto", 0, "idUsuario", 5);
        assertThrows(SolicitudInvalidaException.class, () -> controller.registrarPago(1, payload));
        verify(clienteRepository, never()).findById(any());
    }

    @Test
    @DisplayName("CORREGIDO: registrarPago sin idUsuario se rechaza en vez de atribuir el pago a un usuario cualquiera")
    void registrarPago_sinIdUsuario_seRechaza() {
        Map<String, Object> payload = Map.of("monto", 1000);
        assertThrows(SolicitudInvalidaException.class, () -> controller.registrarPago(1, payload));
        verify(usuarioRepository, never()).findAll();
    }

    @Test
    @DisplayName("registrarPago: cliente inexistente lanza RecursoNoEncontradoException")
    void registrarPago_clienteInexistente_lanzaRecursoNoEncontrado() {
        when(clienteRepository.findById(99)).thenReturn(Optional.empty());
        Map<String, Object> payload = Map.of("monto", 1000, "idUsuario", 5);

        assertThrows(RecursoNoEncontradoException.class, () -> controller.registrarPago(99, payload));
    }

    @Test
    @DisplayName("CORREGIDO: registrarPago con un idUsuario que no existe se rechaza, sin caer en el fallback del 'primer usuario de la base'")
    void registrarPago_usuarioInexistente_seRechaza() {
        Cliente cliente = clienteConPersona(1, new BigDecimal("1000"), new BigDecimal("5000"));
        when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());
        when(movimientoCtaCteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Map<String, Object> payload = Map.of("monto", 500, "idUsuario", 999);

        assertThrows(SolicitudInvalidaException.class, () -> controller.registrarPago(1, payload));

        verify(usuarioRepository, never()).findAll();
        verify(movimientoCajaService, never()).guardar(any());
    }

    @Test
    @DisplayName("registrarPago: un pago válido resta el saldo deudor, registra el movimiento de cta. cte. y su impacto en caja")
    void registrarPago_valido_actualizaSaldoYRegistraMovimientos() {
        Cliente cliente = clienteConPersona(1, new BigDecimal("1000"), new BigDecimal("5000"));
        when(clienteRepository.findById(1)).thenReturn(Optional.of(cliente));
        when(usuarioRepository.findById(5)).thenReturn(Optional.of(usuario(5)));
        when(movimientoCtaCteRepository.save(any(MovimientoCuentaCorriente.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(movimientoCajaService.guardar(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> payload = Map.of("monto", 300, "idUsuario", 5, "metodoPago", "EFECTIVO");

        assertDoesNotThrow(() -> controller.registrarPago(1, payload));

        assertEquals(0, new BigDecimal("700").compareTo(cliente.getSaldoDeudor()));
        verify(clienteRepository).save(cliente);
        verify(movimientoCtaCteRepository).save(any(MovimientoCuentaCorriente.class));
        verify(movimientoCajaService).guardar(any(MovimientoCaja.class));
        verify(usuarioRepository, never()).findAll();
    }
}
