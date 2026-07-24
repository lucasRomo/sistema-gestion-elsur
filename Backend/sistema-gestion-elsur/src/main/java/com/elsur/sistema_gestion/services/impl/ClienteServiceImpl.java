package com.elsur.sistema_gestion.services.impl;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

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
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + id));
    }

    @Override
    @Transactional
    public Cliente guardar(Cliente cliente, Integer idUsuario) {
        // Rehidratamos referencias de TipoDocumento y TipoPersona
        if (cliente.getPersona() != null) {
            Persona persona = cliente.getPersona();
            
            if (persona.getTipoDocumento() != null && persona.getTipoDocumento().getIdTipoDocumento() != null) {
                var tipoDoc = tipoDocumentoRepository.findById(persona.getTipoDocumento().getIdTipoDocumento())
                    .orElseThrow(() -> new RuntimeException("Tipo documento no encontrado"));
                persona.setTipoDocumento(tipoDoc);
            }
            
            if (persona.getTipoPersona() != null && persona.getTipoPersona().getIdTipoPersona() != null) {
                var tipoPer = tipoPersonaRepository.findById(persona.getTipoPersona().getIdTipoPersona())
                    .orElseThrow(() -> new RuntimeException("Tipo persona no encontrado"));
                persona.setTipoPersona(tipoPer);
            }
        }

        // --- LÓGICA DE AUDITORÍA EN EDICIÓN ---
        if (cliente.getIdCliente() != null && clienteRepository.existsById(cliente.getIdCliente())) {
            
            Cliente clienteViejo = clienteRepository.findById(cliente.getIdCliente()).orElse(null);

            if (clienteViejo != null) {
                // Buscamos el usuario real enviado desde el Frontend; si no viene, usamos fallback
                Usuario usuarioActual = null;
                if (idUsuario != null) {
                    usuarioActual = usuarioRepository.findById(idUsuario).orElse(null);
                }
                if (usuarioActual == null) {
                    usuarioActual = usuarioRepository.findAll().stream().findFirst().orElse(null);
                }

                // 1. Campos de Cliente
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

                // 2. Campos de Persona y Dirección
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

                    // ⬇️ SECCIÓN AGREGADA: Auditoría de Dirección ⬇️
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
        clienteRepository.delete(cliente);
    }

    private void compararYRegistrar(Usuario usuario, String tabla, String columna, Integer idReg, Object viejoVal, Object nuevoVal) {
        if (viejoVal == null && nuevoVal == null) return;

        boolean sonIguales = false;

        // Manejo especial para valores numéricos/moneda (evita falsos "0.00" vs "0")
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