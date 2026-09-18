package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.TipoDocumento;
import com.elsur.sistema_gestion.models.TipoPersona;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.PersonaRepository;
import com.elsur.sistema_gestion.repositories.TipoDocumentoRepository;
import com.elsur.sistema_gestion.repositories.TipoPersonaRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito) de ClienteServiceImpl (módulo Clientes).
 * Hasta este trabajo no existía NINGUNA suite de tests para este servicio.
 *
 * HALLAZGOS PRINCIPALES (CORREGIDOS en este pase):
 * 1) razonSocial no se validaba -- ni blanco, ni duplicado -- pese a ser
 *    nullable=false a nivel de base.
 * 2) limiteCredito / saldoDeudor negativos no se rechazaban.
 * 3) numeroDocumento de Persona (unique=true, compartida entre Usuario y
 *    Cliente) nunca se validaba antes de guardar -- el único freno existente
 *    era el chequeo del frontend (PersonaForm.tsx contra la lista de clientes
 *    ya cargada en memoria), que no corre en una llamada directa a la API y
 *    tampoco cubre un choque contra el DNI de un Usuario.
 * 4) Al editar, si no se mandaba idUsuario (o no existía), la auditoría se
 *    atribuía en silencio al "primer usuario de la base" -- mismo patrón
 *    transversal ya cerrado en Caja/Insumos/Productos/Compra de
 *    Insumos/Pedidos.
 * 5) eliminar() no atrapaba DataIntegrityViolationException (cliente con
 *    pedidos u otros registros asociados) y dejaba pasar el mensaje crudo de
 *    Hibernate/JDBC.
 */
@ExtendWith(MockitoExtension.class)
class ClienteServiceImplUnitTest {

    @Mock private ClienteRepository clienteRepository;
    @Mock private PersonaRepository personaRepository;
    @Mock private TipoDocumentoRepository tipoDocumentoRepository;
    @Mock private TipoPersonaRepository tipoPersonaRepository;
    @Mock private RegistroActividadService registroActividadService;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private ClienteServiceImpl clienteService;

    private Cliente cliente(String razonSocial, BigDecimal limiteCredito, BigDecimal saldoDeudor) {
        Cliente c = new Cliente();
        c.setRazonSocial(razonSocial);
        c.setLimiteCredito(limiteCredito);
        c.setSaldoDeudor(saldoDeudor);
        c.setEstado("Activo");
        c.setPersonaDeContacto("Juan Perez");
        c.setCondicionDePago("Contado");
        return c;
    }

    private Persona persona(Integer idPersona, String numeroDocumento) {
        Persona p = new Persona();
        p.setIdPersona(idPersona);
        p.setNumeroDocumento(numeroDocumento);
        p.setNombre("Juan");
        p.setApellido("Perez");
        return p;
    }

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }

    // ---------- buscarPorId ----------

    @Test
    @DisplayName("buscarPorId: cliente inexistente lanza RecursoNoEncontradoException")
    void buscarPorId_inexistente_lanzaRecursoNoEncontrado() {
        when(clienteRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class, () -> clienteService.buscarPorId(99));
    }

    @Test
    @DisplayName("buscarPorId: cliente existente se devuelve")
    void buscarPorId_existente_devuelveElCliente() {
        Cliente c = cliente("Distribuidora El Sur", BigDecimal.ZERO, BigDecimal.ZERO);
        c.setIdCliente(5);
        when(clienteRepository.findById(5)).thenReturn(Optional.of(c));
        assertEquals(c, clienteService.buscarPorId(5));
    }

    // ---------- guardar: razonSocial ----------

    @Test
    @DisplayName("CORREGIDO: razonSocial nula se rechaza")
    void guardar_razonSocialNula_seRechaza() {
        Cliente c = cliente(null, BigDecimal.ZERO, BigDecimal.ZERO);
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> clienteService.guardar(c, null));
        assertTrue(ex.getMessage().toLowerCase().contains("razón social"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: razonSocial en blanco (solo espacios) se rechaza")
    void guardar_razonSocialEnBlanco_seRechaza() {
        Cliente c = cliente("   ", BigDecimal.ZERO, BigDecimal.ZERO);
        assertThrows(SolicitudInvalidaException.class, () -> clienteService.guardar(c, null));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: razonSocial duplicada (case-insensitive) se rechaza")
    void guardar_razonSocialDuplicada_lanzaRecursoDuplicado() {
        Cliente c = cliente("distribuidora el sur", BigDecimal.ZERO, BigDecimal.ZERO);
        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot("distribuidora el sur", -1))
                .thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> clienteService.guardar(c, null));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: la razonSocial se recorta (trim) antes de chequear duplicados y de guardar")
    void guardar_razonSocialConEspacios_seRecorta() {
        Cliente c = cliente("  Distribuidora El Sur  ", BigDecimal.ZERO, BigDecimal.ZERO);
        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot("Distribuidora El Sur", -1))
                .thenReturn(false);
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        Cliente resultado = clienteService.guardar(c, null);

        assertEquals("Distribuidora El Sur", resultado.getRazonSocial());
        verify(clienteRepository).existsByRazonSocialIgnoreCaseAndIdClienteNot("Distribuidora El Sur", -1);
    }

    // ---------- guardar: limiteCredito / saldoDeudor negativos ----------

    @Test
    @DisplayName("CORREGIDO: limiteCredito negativo se rechaza")
    void guardar_limiteCreditoNegativo_seRechaza() {
        Cliente c = cliente("Cliente Uno", new BigDecimal("-100"), BigDecimal.ZERO);
        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> clienteService.guardar(c, null));
        assertTrue(ex.getMessage().toLowerCase().contains("límite de crédito"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: saldoDeudor negativo se rechaza")
    void guardar_saldoDeudorNegativo_seRechaza() {
        Cliente c = cliente("Cliente Uno", BigDecimal.ZERO, new BigDecimal("-50"));
        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> clienteService.guardar(c, null));
        assertTrue(ex.getMessage().toLowerCase().contains("saldo deudor"));
        verify(clienteRepository, never()).save(any());
    }

    // ---------- guardar: tipoDocumento / tipoPersona ----------

    @Test
    @DisplayName("CORREGIDO: tipoDocumento inexistente lanza RecursoNoEncontradoException (antes: RuntimeException -> 400)")
    void guardar_tipoDocumentoInexistente_lanzaRecursoNoEncontrado() {
        Cliente c = cliente("Cliente Uno", BigDecimal.ZERO, BigDecimal.ZERO);
        Persona p = persona(null, "30111222");
        p.setTipoDocumento(new TipoDocumento());
        p.getTipoDocumento().setIdTipoDocumento(999);
        c.setPersona(p);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(tipoDocumentoRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> clienteService.guardar(c, null));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: tipoPersona inexistente lanza RecursoNoEncontradoException (antes: RuntimeException -> 400)")
    void guardar_tipoPersonaInexistente_lanzaRecursoNoEncontrado() {
        Cliente c = cliente("Cliente Uno", BigDecimal.ZERO, BigDecimal.ZERO);
        Persona p = persona(null, "30111222");
        p.setTipoPersona(new TipoPersona());
        p.getTipoPersona().setIdTipoPersona(999);
        c.setPersona(p);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(tipoPersonaRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> clienteService.guardar(c, null));
        verify(clienteRepository, never()).save(any());
    }

    // ---------- guardar: numeroDocumento duplicado (hallazgo central) ----------

    @Test
    @DisplayName("CORREGIDO -- HALLAZGO CENTRAL: numeroDocumento ya usado por OTRA persona (Cliente o Usuario) se rechaza")
    void guardar_numeroDocumentoDeOtraPersona_lanzaRecursoDuplicado() {
        Cliente c = cliente("Cliente Nuevo", BigDecimal.ZERO, BigDecimal.ZERO);
        Persona pNueva = persona(null, "30111222");
        c.setPersona(pNueva);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        Persona pExistente = persona(77, "30111222"); // pertenece a otra persona (id 77)
        when(personaRepository.findByNumeroDocumento("30111222")).thenReturn(Optional.of(pExistente));

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> clienteService.guardar(c, null));
        assertTrue(ex.getMessage().toLowerCase().contains("documento"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: numeroDocumento que pertenece a la MISMA persona (edición) no se rechaza")
    void guardar_numeroDocumentoDeLaMismaPersona_sePermite() {
        Cliente c = cliente("Cliente Existente", BigDecimal.ZERO, BigDecimal.ZERO);
        Persona pPropia = persona(42, "30111222");
        c.setPersona(pPropia);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(personaRepository.findByNumeroDocumento("30111222")).thenReturn(Optional.of(persona(42, "30111222")));
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> clienteService.guardar(c, null));
        verify(clienteRepository).save(c);
    }

    // ---------- guardar: auditoría / obtenerUsuarioOperador ----------

    @Test
    @DisplayName("CORREGIDO: al editar sin idUsuario se rechaza en vez de atribuir en silencio al primer usuario de la base")
    void guardar_edicionSinIdUsuario_seRechaza() {
        Cliente c = cliente("Cliente Existente", BigDecimal.ZERO, BigDecimal.ZERO);
        c.setIdCliente(10);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(clienteRepository.existsById(10)).thenReturn(true);
        when(clienteRepository.findById(10)).thenReturn(Optional.of(cliente("Cliente Viejo", BigDecimal.ZERO, BigDecimal.ZERO)));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> clienteService.guardar(c, null));
        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: al editar con idUsuario que no existe se rechaza")
    void guardar_edicionConIdUsuarioInexistente_seRechaza() {
        Cliente c = cliente("Cliente Existente", BigDecimal.ZERO, BigDecimal.ZERO);
        c.setIdCliente(10);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(clienteRepository.existsById(10)).thenReturn(true);
        when(clienteRepository.findById(10)).thenReturn(Optional.of(cliente("Cliente Viejo", BigDecimal.ZERO, BigDecimal.ZERO)));
        when(usuarioRepository.findById(555)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class, () -> clienteService.guardar(c, 555));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: edición con usuario válido registra auditoría y persiste")
    void guardar_edicionConUsuarioValido_persisteYAuditaCambios() {
        Cliente c = cliente("Cliente Modificado", BigDecimal.ZERO, BigDecimal.ZERO);
        c.setIdCliente(10);
        Cliente viejo = cliente("Cliente Original", BigDecimal.ZERO, BigDecimal.ZERO);

        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(clienteRepository.existsById(10)).thenReturn(true);
        when(clienteRepository.findById(10)).thenReturn(Optional.of(viejo));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        Cliente resultado = clienteService.guardar(c, 1);

        assertEquals("Cliente Modificado", resultado.getRazonSocial());
        verify(registroActividadService, atLeastOnce()).registrarCambio(any(), eq("UPDATE"), eq("Cliente"), eq("razonSocial"), eq(10), anyString(), anyString());
    }

    @Test
    @DisplayName("guardar: alta de cliente nuevo (sin idCliente) no exige idUsuario")
    void guardar_altaDeClienteNuevo_noExigeUsuario() {
        Cliente c = cliente("Cliente Nuevo", BigDecimal.ZERO, BigDecimal.ZERO);
        when(clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(anyString(), any())).thenReturn(false);
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> clienteService.guardar(c, null));
        verify(usuarioRepository, never()).findById(any());
    }

    // ---------- eliminar ----------

    @Test
    @DisplayName("eliminar: cliente inexistente lanza RecursoNoEncontradoException")
    void eliminar_inexistente_lanzaRecursoNoEncontrado() {
        when(clienteRepository.findById(77)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class, () -> clienteService.eliminar(77));
        verify(clienteRepository, never()).delete(any());
    }

    @Test
    @DisplayName("CORREGIDO: eliminar un cliente con registros asociados lanza ConflictoDeIntegridadException en vez del error crudo de Hibernate/JDBC")
    void eliminar_conRegistrosAsociados_lanzaConflictoDeIntegridad() {
        Cliente c = cliente("Cliente Con Pedidos", BigDecimal.ZERO, BigDecimal.ZERO);
        c.setIdCliente(3);
        when(clienteRepository.findById(3)).thenReturn(Optional.of(c));
        doThrow(new DataIntegrityViolationException("fk violation")).when(clienteRepository).delete(c);

        assertThrows(ConflictoDeIntegridadException.class, () -> clienteService.eliminar(3));
    }

    @Test
    @DisplayName("eliminar: cliente sin registros asociados se elimina correctamente")
    void eliminar_sinRegistrosAsociados_seElimina() {
        Cliente c = cliente("Cliente Sin Pedidos", BigDecimal.ZERO, BigDecimal.ZERO);
        c.setIdCliente(4);
        when(clienteRepository.findById(4)).thenReturn(Optional.of(c));

        assertDoesNotThrow(() -> clienteService.eliminar(4));
        verify(clienteRepository).delete(c);
    }
}
