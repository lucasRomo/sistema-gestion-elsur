package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PedidoServiceImplAgregarPagoUnitTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private MovimientoCajaRepository cajaRepository;
    @Mock private MovimientoCuentaCorrienteRepository movimientoCCRepository;
    @Mock private TurnoRepository TurnoRepository; 

    @InjectMocks
    private PedidoServiceImpl pedidoService;

    private Turno turnoAbierto() {
        Turno t = new Turno();
        t.setEstado(EstadoTurno.ABIERTO);
        return t;
    }

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }

    private Cliente consumidorFinal() {
        Cliente c = new Cliente();
        c.setIdCliente(1);
        c.setRazonSocial("Consumidor Final");
        c.setSaldoDeudor(BigDecimal.ZERO);
        c.setLimiteCredito(BigDecimal.ZERO);
        return c;
    }

    private Cliente clienteReal(int id, BigDecimal saldoDeudor) {
        Cliente c = new Cliente();
        c.setIdCliente(id);
        c.setRazonSocial("Imprenta Cliente SA");
        c.setSaldoDeudor(saldoDeudor);
        c.setLimiteCredito(BigDecimal.valueOf(100000));
        return c;
    }

    private Pedido pedidoConSaldo(int idPedido, Cliente cliente, BigDecimal montoYaAdelantado) {
        Pedido p = new Pedido();
        p.setId_pedido(idPedido);
        p.setCliente(cliente);
        p.setMonto_total(BigDecimal.valueOf(1000));
        p.setMonto_pago_adelantado(montoYaAdelantado);
        return p;
    }


    @Test
    @DisplayName("TC_PP - Monto nulo -> SolicitudInvalidaException, no llega a tocar ningún repositorio")
    void agregarPago_montoNulo_lanzaSolicitudInvalida() {
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(500, null, "EFECTIVO", null, 1));

        assertTrue(ex.getMessage().toLowerCase().contains("monto"));
        verifyNoInteractions(pedidoRepository, usuarioRepository, TurnoRepository, cajaRepository);
    }

    @Test
    @DisplayName("TC_PP - Monto en 0 -> SolicitudInvalidaException")
    void agregarPago_montoCero_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(500, 0.0, "EFECTIVO", null, 1));
    }

    @Test
    @DisplayName("TC_PP - Monto negativo -> SolicitudInvalidaException (antes se aceptaba sin validar)")
    void agregarPago_montoNegativo_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(506, -50.0, "EFECTIVO", null, 1));
    }

    @Test
    @DisplayName("TC_PP - Monto NaN -> SolicitudInvalidaException")
    void agregarPago_montoNaN_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(506, Double.NaN, "EFECTIVO", null, 1));
    }

    @Test
    @DisplayName("TC_PP - Monto que supera el saldo pendiente del pedido -> SolicitudInvalidaException")
    void agregarPago_montoSuperaSaldoPendiente_lanzaSolicitudInvalida() {
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        // saldo pendiente = 1000 - 800 = 200; se intenta pagar 500
        Pedido pedido = pedidoConSaldo(507, consumidorFinal(), BigDecimal.valueOf(800));
        when(pedidoRepository.findById(507)).thenReturn(Optional.of(pedido));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(507, 500.0, "EFECTIVO", null, 1));

        assertTrue(ex.getMessage().contains("saldo pendiente"));
        verify(pedidoRepository, never()).save(any());
    }


    @Test
    @DisplayName("TC_PP - idUsuario nulo -> SolicitudInvalidaException (antes caía en silencio al usuario ID 1)")
    void agregarPago_idUsuarioNulo_lanzaSolicitudInvalida() {
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(500, 100.0, "EFECTIVO", null, null));

        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verifyNoInteractions(pedidoRepository, TurnoRepository, cajaRepository);
    }

    @Test
    @DisplayName("TC_PP - idUsuario que no existe en la base -> SolicitudInvalidaException")
    void agregarPago_usuarioInexistente_lanzaSolicitudInvalida() {
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(502, 100.0, "EFECTIVO", null, 999));

        assertTrue(ex.getMessage().toLowerCase().contains("no existe"));
        verifyNoInteractions(pedidoRepository, TurnoRepository, cajaRepository);
    }


    @Test
    @DisplayName("TC_PP - Caja cerrada -> SolicitudInvalidaException, no llega a buscar el pedido")
    void agregarPago_cajaCerrada_lanzaExcepcion() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPago(500, 100.0, "EFECTIVO", null, 1));

        assertTrue(ex.getMessage().contains("Caja No está Abierta"));
        verify(pedidoRepository, never()).findById(any());
    }


    @Test
    @DisplayName("TC_PP - Pedido inexistente -> RecursoNoEncontradoException")
    void agregarPago_pedidoInexistente_lanzaExcepcion() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        when(pedidoRepository.findById(501)).thenReturn(Optional.empty());

        RecursoNoEncontradoException ex = assertThrows(RecursoNoEncontradoException.class,
                () -> pedidoService.agregarPago(501, 100.0, "EFECTIVO", null, 1));

        assertTrue(ex.getMessage().contains("No se encontró el pedido"));
    }


    @Test
    @DisplayName("TC_PP - Consumidor Final no puede pagar/abonar a Cuenta Corriente")
    void agregarPago_consumidorFinalConCuentaCorriente_lanzaExcepcion() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Pedido pedido = pedidoConSaldo(500, consumidorFinal(), BigDecimal.ZERO);
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.agregarPago(500, 200.0, "CUENTA_CORRIENTE", null, 1));

        assertTrue(ex.getMessage().contains("Consumidor Final"));
        verify(pedidoRepository, never()).save(any());
    }


    @Test
    @DisplayName("TC_PP - Pago en efectivo válido suma el monto y genera el MovimientoCaja")
    void agregarPago_efectivoValido_sumaMontoYGeneraMovimiento() {
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Pedido pedido = pedidoConSaldo(503, consumidorFinal(), BigDecimal.valueOf(200));
        when(pedidoRepository.findById(503)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(cajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido resultado = pedidoService.agregarPago(503, 300.0, "EFECTIVO", null, 1);

        assertEquals(0, BigDecimal.valueOf(500).compareTo(resultado.getMonto_pago_adelantado()));
        verify(cajaRepository).save(any(MovimientoCaja.class));
        verify(movimientoCCRepository, never()).save(any());
    }


    @Test
    @DisplayName("TC_PP - Pago a Cuenta Corriente de un cliente real descuenta su saldo deudor y registra el movimiento de CC")
    void agregarPago_cuentaCorrienteClienteReal_descuentaSaldoDeudor() {
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Cliente cliente = clienteReal(20, BigDecimal.valueOf(1000));
        Pedido pedido = pedidoConSaldo(504, cliente, BigDecimal.ZERO);
        when(pedidoRepository.findById(504)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(cajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        pedidoService.agregarPago(504, 400.0, "CUENTA_CORRIENTE", null, 1);

        assertEquals(0, BigDecimal.valueOf(600).compareTo(cliente.getSaldoDeudor()));
        verify(clienteRepository).save(cliente);
        verify(movimientoCCRepository).save(any());
    }

    @Test
    @DisplayName("TC_PP - Pago a Cuenta Corriente que supera el saldo deudor no deja el saldo en negativo (se clampea a 0)")
    void agregarPago_cuentaCorrienteSuperaElSaldo_clampeaACero() {
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Cliente cliente = clienteReal(21, BigDecimal.valueOf(100)); // debe solo $100
        Pedido pedido = pedidoConSaldo(505, cliente, BigDecimal.ZERO);
        when(pedidoRepository.findById(505)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(cajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        pedidoService.agregarPago(505, 250.0, "CUENTA_CORRIENTE", null, 1); // paga de más

        assertEquals(0, BigDecimal.ZERO.compareTo(cliente.getSaldoDeudor()));
    }

    @Test
    @DisplayName("TC_PP - El movimiento de caja se atribuye al usuario logueado real, no a un usuario por defecto")
    void agregarPago_exitosa_atribuyeMovimientoAlUsuarioCorrecto() {
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Pedido pedido = pedidoConSaldo(508, consumidorFinal(), BigDecimal.ZERO);
        when(pedidoRepository.findById(508)).thenReturn(Optional.of(pedido));
        Usuario usuarioReal = usuario(7);
        when(usuarioRepository.findById(7)).thenReturn(Optional.of(usuarioReal));
        when(cajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        pedidoService.agregarPago(508, 100.0, "EFECTIVO", null, 7);

        verify(cajaRepository).save(argThat(mov -> mov.getUsuario() == usuarioReal));
    }
}
