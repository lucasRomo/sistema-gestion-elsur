package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.Direccion;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.PersonaRepository;
import com.elsur.sistema_gestion.repositories.TipoDocumentoRepository;
import com.elsur.sistema_gestion.repositories.TipoPersonaRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.ClienteService;
import com.elsur.sistema_gestion.services.RegistroActividadService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class ClienteServiceImpl implements ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired 
    private TipoDocumentoRepository tipoDocumentoRepository;
    
    @Autowired 
    private TipoPersonaRepository tipoPersonaRepository;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    @Override
    public Cliente buscarPorId(Integer id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + id));
    }

    @Override
    @Transactional
    public Cliente guardar(Cliente cliente, Integer idUsuario) {
        // CORREGIDO: la razón social no se validaba en absoluto -- ni blanco, ni
        // duplicada -- pese a ser nullable=false y sin restricción de unicidad a
        // nivel de base. Antes de este pase, dos clientes podían quedar con la
        // misma razón social, o guardarse con el campo vacío.
        if (cliente.getRazonSocial() == null || cliente.getRazonSocial().trim().isEmpty()) {
            throw new SolicitudInvalidaException("La razón social del cliente es obligatoria.");
        }
        String razonSocialNormalizada = cliente.getRazonSocial().trim();
        Integer idClienteExcluido = cliente.getIdCliente() != null ? cliente.getIdCliente() : -1;
        if (clienteRepository.existsByRazonSocialIgnoreCaseAndIdClienteNot(razonSocialNormalizada, idClienteExcluido)) {
            throw new RecursoDuplicadoException("Ya existe un cliente registrado con la razón social '" + razonSocialNormalizada + "'.");
        }
        cliente.setRazonSocial(razonSocialNormalizada);

        // CORREGIDO: límite de crédito y saldo deudor negativos no se rechazaban
        // (mismo patrón de "negativo sin validar" ya cerrado en Insumos/Productos).
        if (cliente.getLimiteCredito() != null && cliente.getLimiteCredito().signum() < 0) {
            throw new SolicitudInvalidaException("El límite de crédito no puede ser negativo.");
        }
        if (cliente.getSaldoDeudor() != null && cliente.getSaldoDeudor().signum() < 0) {
            throw new SolicitudInvalidaException("El saldo deudor no puede ser negativo.");
        }

        if (cliente.getPersona() != null) {
            Persona persona = cliente.getPersona();

            if (persona.getTipoDocumento() != null && persona.getTipoDocumento().getIdTipoDocumento() != null) {
                var tipoDoc = tipoDocumentoRepository.findById(persona.getTipoDocumento().getIdTipoDocumento())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Tipo documento no encontrado"));
                persona.setTipoDocumento(tipoDoc);
            }

            if (persona.getTipoPersona() != null && persona.getTipoPersona().getIdTipoPersona() != null) {
                var tipoPer = tipoPersonaRepository.findById(persona.getTipoPersona().getIdTipoPersona())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Tipo persona no encontrado"));
                persona.setTipoPersona(tipoPer);
            }

            // CORREGIDO -- HALLAZGO CENTRAL: numero_documento es unique=true a nivel de
            // Persona (compartida entre Usuario y Cliente), pero acá nunca se validaba
            // antes de guardar. El único freno existente era el chequeo del frontend
            // (PersonaForm.tsx, contra la lista de clientes ya cargada en memoria), que
            // no corre si se llama a la API directamente y tampoco cubre un choque
            // contra el DNI de un Usuario. Sin este chequeo, el alta terminaba
            // reventando con un DataIntegrityViolationException crudo (constraint de
            // unicidad) en vez de un mensaje entendible. Mismo criterio que ya se usa
            // para el DNI duplicado al registrar un Usuario (UsuarioServiceImpl.guardar).
            if (persona.getNumeroDocumento() != null && !persona.getNumeroDocumento().trim().isEmpty()) {
                String documentoNormalizado = persona.getNumeroDocumento().trim();
                persona.setNumeroDocumento(documentoNormalizado);
                Optional<Persona> personaExistente = personaRepository.findByNumeroDocumento(documentoNormalizado);
                boolean esOtraPersona = personaExistente.isPresent()
                        && !personaExistente.get().getIdPersona().equals(persona.getIdPersona());
                if (esOtraPersona) {
                    throw new RecursoDuplicadoException("Ya existe una persona registrada con ese número de documento.");
                }
            }
        }

        if (cliente.getIdCliente() != null && clienteRepository.existsById(cliente.getIdCliente())) {
            Cliente clienteViejo = clienteRepository.findById(cliente.getIdCliente()).orElse(null);

            if (clienteViejo != null) {
                // CORREGIDO: antes, si no se mandaba idUsuario (o no existía), la
                // auditoría se atribuía en silencio al "primer usuario de la base" --
                // mismo patrón transversal ya cerrado en Caja/Insumos/Productos/Compra
                // de Insumos/Pedidos. Ahora se exige un usuario real y válido.
                Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

                compararYRegistrar(usuarioActual, "Cliente", "razonSocial", cliente.getIdCliente(),
                        clienteViejo.getRazonSocial(), cliente.getRazonSocial());

                compararYRegistrar(usuarioActual, "Cliente", "personaDeContacto", cliente.getIdCliente(),
                        clienteViejo.getPersonaDeContacto(), cliente.getPersonaDeContacto());

                compararYRegistrar(usuarioActual, "Cliente", "condicionDePago", cliente.getIdCliente(),
                        clienteViejo.getCondicionDePago(), cliente.getCondicionDePago());

                compararYRegistrar(usuarioActual, "Cliente", "estado", cliente.getIdCliente(),
                        clienteViejo.getEstado(), cliente.getEstado());

                compararYRegistrar(usuarioActual, "Cliente", "limiteCredito", cliente.getIdCliente(),
                        clienteViejo.getLimiteCredito(), cliente.getLimiteCredito());

                compararYRegistrar(usuarioActual, "Cliente", "saldoDeudor", cliente.getIdCliente(),
                        clienteViejo.getSaldoDeudor(), cliente.getSaldoDeudor());

                if (clienteViejo.getPersona() != null && cliente.getPersona() != null) {
                    Persona pVieja = clienteViejo.getPersona();
                    Persona pNuev = cliente.getPersona();

                    compararYRegistrar(usuarioActual, "Persona", "nombre", cliente.getIdCliente(),
                            pVieja.getNombre(), pNuev.getNombre());

                    compararYRegistrar(usuarioActual, "Persona", "apellido", cliente.getIdCliente(),
                            pVieja.getApellido(), pNuev.getApellido());

                    compararYRegistrar(usuarioActual, "Persona", "numeroDocumento", cliente.getIdCliente(),
                            pVieja.getNumeroDocumento(), pNuev.getNumeroDocumento());

                    compararYRegistrar(usuarioActual, "Persona", "telefono", cliente.getIdCliente(),
                            pVieja.getTelefono(), pNuev.getTelefono());

                    compararYRegistrar(usuarioActual, "Persona", "email", cliente.getIdCliente(),
                            pVieja.getEmail(), pNuev.getEmail());

                    if (pVieja.getDireccion() != null && pNuev.getDireccion() != null) {
                        Direccion dVieja = pVieja.getDireccion();
                        Direccion dNueva = pNuev.getDireccion();

                        compararYRegistrar(usuarioActual, "Direccion", "calle", cliente.getIdCliente(),
                                dVieja.getCalle(), dNueva.getCalle());

                        compararYRegistrar(usuarioActual, "Direccion", "numero", cliente.getIdCliente(),
                                dVieja.getNumero(), dNueva.getNumero());

                        compararYRegistrar(usuarioActual, "Direccion", "piso", cliente.getIdCliente(),
                                dVieja.getPiso(), dNueva.getPiso());

                        compararYRegistrar(usuarioActual, "Direccion", "departamento", cliente.getIdCliente(),
                                dVieja.getDepartamento(), dNueva.getDepartamento());

                        compararYRegistrar(usuarioActual, "Direccion", "codigoPostal", cliente.getIdCliente(),
                                dVieja.getCodigoPostal(), dNueva.getCodigoPostal());

                        compararYRegistrar(usuarioActual, "Direccion", "ciudad", cliente.getIdCliente(),
                                dVieja.getCiudad(), dNueva.getCiudad());

                        compararYRegistrar(usuarioActual, "Direccion", "provincia", cliente.getIdCliente(),
                                dVieja.getProvincia(), dNueva.getProvincia());

                        compararYRegistrar(usuarioActual, "Direccion", "pais", cliente.getIdCliente(),
                                dVieja.getPais(), dNueva.getPais());
                    }
                }
            }
        }
        return clienteRepository.save(cliente);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        Cliente cliente = buscarPorId(id);
        try {
            clienteRepository.delete(cliente);
            clienteRepository.flush();
        } catch (DataIntegrityViolationException e) {
            // CORREGIDO: antes esta excepción (violación de FK -- el cliente tiene
            // pedidos, movimientos de cuenta corriente, etc.) no se atrapaba acá y
            // caía en el manejador genérico de RuntimeException, mostrando el mensaje
            // crudo de Hibernate/JDBC en vez de una respuesta entendible.
            throw new ConflictoDeIntegridadException(
                "No se puede eliminar el cliente porque tiene pedidos u otros registros asociados.");
        }
    }

    // Mismo criterio que obtenerUsuarioOperador() en CompraInsumoServiceImpl /
    // PedidoServiceImpl: rechaza en vez de atribuir en silencio a un usuario
    // arbitrario cuando idUsuario falta o no existe.
    private Usuario obtenerUsuarioOperador(Integer idUsuario) {
        if (idUsuario == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que realiza la modificación.");
        }
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));
    }

    private void compararYRegistrar(Usuario usuario, String tabla, String columna, Integer idReg, Object viejoVal, Object nuevoVal) {
        if (viejoVal == null && nuevoVal == null) return;

        boolean sonIguales = false;

        if (viejoVal instanceof Number || nuevoVal instanceof Number) {
            try {
                BigDecimal bdViejo = viejoVal != null ? new BigDecimal(viejoVal.toString()) : BigDecimal.ZERO;
                BigDecimal bdNuevo = nuevoVal != null ? new BigDecimal(nuevoVal.toString()) : BigDecimal.ZERO;
                sonIguales = bdViejo.compareTo(bdNuevo) == 0;
            } catch (Exception e) {
                sonIguales = Objects.equals(viejoVal, nuevoVal);
            }
        } else {
            String stringViejo = viejoVal != null ? viejoVal.toString().trim() : "";
            String stringNuevo = nuevoVal != null ? nuevoVal.toString().trim() : "";
            sonIguales = Objects.equals(stringViejo, stringNuevo);
        }

        if (!sonIguales) {
            registroActividadService.registrarCambio(
                usuario,
                "UPDATE",
                tabla,
                columna,
                idReg,
                viejoVal != null ? viejoVal.toString() : "",
                nuevoVal != null ? nuevoVal.toString() : ""
            );
        }
    }
}