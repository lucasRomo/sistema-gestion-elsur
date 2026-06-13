package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.PersonaRepository;
import com.elsur.sistema_gestion.repositories.DireccionRepository;
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
    private DireccionRepository direccionRepository;

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
            
            // 1. Si la persona trae una dirección nueva, la guardamos primero
            if (persona.getDireccion() != null) {
                direccionRepository.save(persona.getDireccion());
            }
            
            // 2. Guardamos/Actualizamos los datos de la Persona
            personaRepository.save(persona);
        }
        
        // 3. Finalmente guardamos el Cliente vinculado a esa persona
        return clienteRepository.save(cliente);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        // Buscamos el cliente para saber qué persona borrar también si fuera necesario
        Cliente cliente = buscarPorId(id);
        clienteRepository.delete(cliente);
        // Opcional: podrías decidir si borrar la Persona física o dejarla en la BD
    }
    
}