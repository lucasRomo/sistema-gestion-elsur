package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.models.Usuario;
import java.util.List;

public interface RegistroActividadService {
    List<RegistroActividad> listarTodos();
    List<RegistroActividad> buscarConFiltros(Integer idUsuario, String tabla);
    java.util.Map<String, Object> buscarConFiltrosPaginado(Integer idUsuario, String tabla, int pagina, int tamano);
    List<Usuario> listarUsuariosConActividad();
    RegistroActividad buscarPorId(Integer id);
    RegistroActividad guardar(RegistroActividad registro);
    
    void registrarCambio(Usuario usuario, String accion, String tabla, String columna, 
                         Integer idRegistro, String valorViejo, String valorNuevo);
}