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
class PedidoServiceImplAgregarPagoConArchivoUnitTest {

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

    private Pedido pedidoConSaldo(int idPedido, Cliente cliente, BigDecimal montoYaAdelantado) {
        Pedido p = new Pedido();
        p.setId_pedido(idPedido);
        p.setCliente(cliente);
        p.setMonto_total(BigDecimal.valueOf(1000));
        p.setMonto_pago_adelantado(montoYaAdelantado);
        return p;
    }


    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: monto nulo -> SolicitudInvalidaException")
    void agregarPagoConArchivo_montoNulo_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPagoConArchivo(500, null, "EFECTIVO", 1, null));
        verifyNoInteractions(pedidoRepository, usuarioRepository, TurnoRepository, cajaRepository);
    }

    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: monto negativo -> SolicitudInvalidaException (antes se aceptaba sin validar)")
    void agregarPagoConArchivo_montoNegativo_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPagoConArchivo(500, -50.0, "EFECTIVO", 1, null));
    }

    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: monto que supera el saldo pendiente -> SolicitudInvalidaException")
    void agregarPagoConArchivo_montoSuperaSaldoPendiente_lanzaSolicitudInvalida() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Pedido pedido = pedidoConSaldo(507, consumidorFinal(), BigDecimal.valueOf(800)); // saldo pendiente = 200
        when(pedidoRepository.findById(507)).thenReturn(Optional.of(pedido));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPagoConArchivo(507, 500.0, "EFECTIVO", 1, null));

        assertTrue(ex.getMessage().contains("saldo pendiente"));
        verify(pedidoRepository, never()).save(any());
    }


    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: idUsuario nulo -> SolicitudInvalidaException (antes caía en silencio al usuario ID 1)")
    void agregarPagoConArchivo_idUsuarioNulo_lanzaSolicitudInvalida() {
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPagoConArchivo(500, 100.0, "EFECTIVO", null, null));

        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verifyNoInteractions(pedidoRepository, TurnoRepository, cajaRepository);
    }

    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: idUsuario inexistente -> SolicitudInvalidaException")
    void agregarPagoConArchivo_usuarioInexistente_lanzaSolicitudInvalida() {
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPagoConArchivo(502, 100.0, "EFECTIVO", 999, null));
        verifyNoInteractions(pedidoRepository, TurnoRepository, cajaRepository);
    }


    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: caja cerrada -> SolicitudInvalidaException")
    void agregarPagoConArchivo_cajaCerrada_lanzaExcepcion() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.agregarPagoConArchivo(500, 100.0, "EFECTIVO", 1, null));
        verify(pedidoRepository, never()).findById(any());
    }

    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: pedido inexistente -> RecursoNoEncontradoException")
    void agregarPagoConArchivo_pedidoInexistente_lanzaExcepcion() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        when(pedidoRepository.findById(501)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> pedidoService.agregarPagoConArchivo(501, 100.0, "EFECTIVO", 1, null));
    }


    @Test
    @DisplayName("TC_PP - agregarPagoConArchivo: pago válido sin comprobante adjunto suma el monto, genera el " +
                 "MovimientoCaja y lo atribuye al usuario logueado real")
    void agregarPagoConArchivo_sinComprobante_sumaMontoYAtribuyeUsuarioCorrecto() {
        when(TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto()));
        Pedido pedido = pedidoConSaldo(503, consumidorFinal(), BigDecimal.valueOf(200));
        when(pedidoRepository.findById(503)).thenReturn(Optional.of(pedido));
        Usuario usuarioReal = usuario(7);
        when(usuarioRepository.findById(7)).thenReturn(Optional.of(usuarioReal));
        when(cajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido resultado = pedidoService.agregarPagoConArchivo(503, 300.0, "EFECTIVO", 7, null);

        assertEquals(0, BigDecimal.valueOf(500).compareTo(resultado.getMonto_pago_adelantado()));
        verify(cajaRepository).save(argThat(mov -> mov.getUsuario() == usuarioReal));
        assertEquals(1, resultado.getComprobantes().size());
    }
}
