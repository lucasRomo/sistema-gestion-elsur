package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.PersonaRepository;
import com.elsur.sistema_gestion.repositories.TipoDocumentoRepository;
import com.elsur.sistema_gestion.repositories.TipoPersonaRepository;
import com.elsur.sistema_gestion.services.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    public Cliente guardar(Cliente cliente) {
        if (cliente.getPersona() != null) {
            Persona persona = cliente.getPersona();
            
            // Rehidratamos las referencias con los nombres de propiedad correctos mapeados
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
        
        return clienteRepository.save(cliente);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        Cliente cliente = buscarPorId(id);
        clienteRepository.delete(cliente);
    }
}