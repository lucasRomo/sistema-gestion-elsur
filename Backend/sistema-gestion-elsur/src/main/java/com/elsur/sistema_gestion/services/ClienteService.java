package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Cliente;
import java.util.List;

public interface ClienteService {
    List<Cliente> listarTodos();
    Cliente guardar(Cliente cliente, Integer idUsuario);
    Cliente buscarPorId(Integer id);
    void eliminar(Integer id);
    
}
