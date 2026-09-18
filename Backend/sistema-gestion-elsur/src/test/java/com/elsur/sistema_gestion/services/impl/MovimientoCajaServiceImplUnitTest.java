package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.repositories.PedidoRepository;
import com.elsur.sistema_gestion.repositories.TurnoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito) de MovimientoCajaServiceImpl -- el servicio
 * que registra ingresos/egresos manuales de Caja y calcula los totales y el desglose
 * de arqueo que se muestran en CajaView.tsx. Hasta este trabajo no existía NINGUNA
 * suite de tests para este servicio.
 */
@ExtendWith(MockitoExtension.class)
class MovimientoCajaServiceImplUnitTest {

    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private TurnoRepository turnoRepository;
    @Mock private PedidoRepository pedidoRepository;

    @InjectMocks
    private MovimientoCajaServiceImpl movimientoCajaService;

    private MovimientoCaja movimiento(String tipo, double monto, String metodoPago) {
        MovimientoCaja m = new MovimientoCaja();
        m.setTipoMovimiento(tipo);
        m.setMonto(BigDecimal.valueOf(monto));
        m.setMetodoPago(metodoPago);
        return m;
    }

    // ==================== guardar() ====================

    @Test
    @DisplayName("guardar() sin turno explícito le asigna automáticamente el turno ABIERTO actual")
    void guardar_sinTurnoAsignado_seAsignaAutomaticamenteElTurnoAbierto() {
        Turno abierto = new Turno();
        abierto.setIdTurno(5);
        abierto.setEstado(EstadoTurno.ABIERTO);
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(abierto));
        when(movimientoCajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        MovimientoCaja entrada = movimiento("INGRESO", 100.0, "EFECTIVO");

        MovimientoCaja guardado = movimientoCajaService.guardar(entrada);

        assertNotNull(guardado.getTurno());
        assertEquals(5, guardado.getTurno().getIdTurno());
    }

    @Test
    @DisplayName("FIX: guardar() ahora rechaza un movimiento cuando no hay ningún turno ABIERTO, igual que agregarPago()")
    void guardar_sinTurnoAbierto_seRechaza() {
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());

        MovimientoCaja entrada = movimiento("EGRESO", 50.0, "EFECTIVO");

        assertThrows(SolicitudInvalidaException.class, () -> movimientoCajaService.guardar(entrada));
        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
        // ANTES: a diferencia de PedidoServiceImpl.agregarPago() (que sí valida que haya una
        // caja abierta y rechaza con "La Caja no está abierta..."), MovimientoCajaServiceImpl
        // .guardar() no tenía ningún control equivalente -- un movimiento manual de Caja podía
        // registrarse con la caja cerrada y quedaba "flotando" sin turno. Corregido: ahora
        // rechaza con el mismo mensaje que agregarPago().
    }

    @Test
    @DisplayName("guardar() con un pedido existente lo resuelve y vincula la entidad persistida desde la base")
    void guardar_conPedidoExistente_loResuelveYVinculaDesdeLaBase() {
        Turno abierto = new Turno();
        abierto.setIdTurno(6);
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(abierto));

        Pedido pedidoDb = new Pedido();
        pedidoDb.setId_pedido(77);
        when(pedidoRepository.findById(77)).thenReturn(Optional.of(pedidoDb));
        when(movimientoCajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        MovimientoCaja entrada = movimiento("INGRESO", 300.0, "EFECTIVO");
        Pedido refPedido = new Pedido();
        refPedido.setId_pedido(77);
        entrada.setPedido(refPedido);

        MovimientoCaja guardado = movimientoCajaService.guardar(entrada);

        assertSame(pedidoDb, guardado.getPedido());
    }

    @Test
    @DisplayName("guardar() con un idPedido inexistente lanza RuntimeException")
    void guardar_conPedidoInexistente_lanzaRuntimeException() {
        Turno abierto = new Turno();
        abierto.setIdTurno(7);
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(abierto));
        when(pedidoRepository.findById(999)).thenReturn(Optional.empty());

        MovimientoCaja entrada = movimiento("EGRESO", 10.0, "EFECTIVO");
        Pedido refPedido = new Pedido();
        refPedido.setId_pedido(999);
        entrada.setPedido(refPedido);

        assertThrows(RuntimeException.class, () -> movimientoCajaService.guardar(entrada));
        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
    }

    // ==================== calcularTotales() ====================

    @Test
    @DisplayName("calcularTotalesDelDia() suma ingresos y egresos ignorando mayúsculas/minúsculas de tipoMovimiento")
    void calcularTotales_esCaseInsensitive_sumaIngresoEnMinusculas() {
        when(movimientoCajaRepository.findByFechaBetween(any(), any())).thenReturn(List.of(
                movimiento("ingreso", 100.0, "EFECTIVO"),
                movimiento("INGRESO", 50.0, "EFECTIVO"),
                movimiento("Egreso", 30.0, "EFECTIVO")
        ));

        Map<String, Double> totales = movimientoCajaService.calcularTotalesDelDia();

        // TurnoServiceImpl.cerrarTurno() ahora usa el mismo criterio case-insensitive (ver
        // TurnoServiceImplUnitTest.cerrarTurno_movimientoConTipoMovimientoEnMinuscula_ahoraSiSeCuenta),
        // así que ambos servicios quedan consistentes entre sí.
        assertEquals(150.0, totales.get("totalIngresos"));
        assertEquals(30.0, totales.get("totalEgresos"));
        assertEquals(120.0, totales.get("saldoActual"));
    }

    @Test
    @DisplayName("calcularDesglose(): un movimiento sin metodoPago se asume EFECTIVO por defecto")
    void calcularDesglose_metodoPagoNull_seAsumeEfectivoPorDefecto() {
        when(movimientoCajaRepository.findByFechaBetween(any(), any())).thenReturn(List.of(
                movimiento("INGRESO", 200.0, null)
        ));

        Map<String, Double> desglose = movimientoCajaService.obtenerDesgloseArqueo();

        assertEquals(200.0, desglose.get("efectivoIngresos"));
        assertEquals(0.0, desglose.get("transferenciaIngresos"));
    }

    @Test
    @DisplayName("calcularDesglose(): separa correctamente ingresos/egresos por Transferencia de los de Efectivo")
    void calcularDesglose_transferencia_seSeparaCorrectamenteDeEfectivo() {
        when(movimientoCajaRepository.findByFechaBetween(any(), any())).thenReturn(List.of(
                movimiento("INGRESO", 100.0, "EFECTIVO"),
                movimiento("INGRESO", 400.0, "TRANSFERENCIA"),
                movimiento("EGRESO", 50.0, "TRANSFERENCIA")
        ));

        Map<String, Double> desglose = movimientoCajaService.obtenerDesgloseArqueo();

        assertEquals(100.0, desglose.get("efectivoIngresos"));
        assertEquals(100.0, desglose.get("totalEfectivo"));
        assertEquals(400.0, desglose.get("transferenciaIngresos"));
        assertEquals(50.0, desglose.get("transferenciaEgresos"));
        assertEquals(350.0, desglose.get("totalTransferencias"));
        assertEquals(450.0, desglose.get("saldoTotal"));
    }

    @Test
    @DisplayName("FIX: DEBITO/CREDITO ahora se tratan como dinero digital (no físico), igual que TRANSFERENCIA")
    void calcularDesglose_debitoYCredito_ahoraSeTratanComoDigital() {
        when(movimientoCajaRepository.findByFechaBetween(any(), any())).thenReturn(List.of(
                movimiento("INGRESO", 150.0, "DEBITO"),
                movimiento("INGRESO", 80.0, "CREDITO"),
                movimiento("INGRESO", 20.0, "EFECTIVO")
        ));

        Map<String, Double> desglose = movimientoCajaService.obtenerDesgloseArqueo();

        // ANTES: calcularDesglose() solo reconocía "TRANSFERENCIA" como método digital --
        // pagos con DEBITO o CREDITO (ambos ofrecidos como opciones reales en
        // ModalNuevoIngreso.tsx y en el Ajuste de CajaView.tsx) se sumaban dentro de
        // "efectivo" en el arqueo, inflando el "Total Esperado Físico" que se le pide al
        // cajero que cuente a mano. Corregido: ahora cualquier método distinto de EFECTIVO
        // se trata como dinero no físico.
        assertEquals(20.0, desglose.get("efectivoIngresos"), "Solo el pago en EFECTIVO debe contarse como físico");
        assertEquals(230.0, desglose.get("transferenciaIngresos"), "DEBITO + CREDITO deben sumarse como dinero digital");
    }
}
