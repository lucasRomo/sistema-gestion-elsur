package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.models.Usuario;
import java.util.List;

public interface RegistroActividadService {
    List<RegistroActividad> listarTodos();
    List<RegistroActividad> buscarConFiltros(Integer idUsuario, String tabla);
    RegistroActividad buscarPorId(Integer id);
    RegistroActividad guardar(RegistroActividad registro);
    
    // Método helper para registrar auditorías de forma sencilla
    void registrarCambio(Usuario usuario, String accion, String tabla, String columna, 
                         Integer idRegistro, String valorViejo, String valorNuevo);
}