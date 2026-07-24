package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.RegistroActividadRepository;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;

@Service
public class RegistroActividadServiceImpl implements RegistroActividadService {

    @Autowired
    private RegistroActividadRepository registroActividadRepository;

    @Override
    public List<RegistroActividad> listarTodos() {
        return registroActividadRepository.findAllByOrderByIdRegActDesc();
    }

    @Override
    public List<RegistroActividad> buscarConFiltros(Integer idUsuario, String tabla) {
    if ("Sin Filtro".equalsIgnoreCase(tabla) || (tabla != null && tabla.trim().isEmpty())) {
        tabla = null;
    } else if (tabla != null) {
        // Concatenamos los comodines '%' aquí para no usar CONCAT() en SQL
        tabla = "%" + tabla.trim().toLowerCase() + "%";
    }
    
    return registroActividadRepository.buscarConFiltros(idUsuario, tabla);
    }

    @Override
    public RegistroActividad guardar(RegistroActividad registro) {
        return registroActividadRepository.save(registro);
    }

    @Override
    public void registrarCambio(Usuario usuario, String accion, String tabla, String columna, 
                                Integer idRegistro, String valorViejo, String valorNuevo) {
        
        // Si los datos son iguales, no guardamos auditoría
        if (valorViejo != null && valorViejo.equals(valorNuevo)) return;

        RegistroActividad reg = new RegistroActividad();
        reg.setFecha(new Timestamp(System.currentTimeMillis()));
        reg.setUsuario(usuario);
        reg.setAccion(accion);
        reg.setTablaAfectada(tabla);
        reg.setColumnaAfectada(columna);
        reg.setIdRegistroMod(idRegistro);
        
        // Guardamos comillas dobles si es string/json para el frontend
        reg.setDatosAnteriores(valorViejo != null ? "\"" + valorViejo + "\"" : null);
        reg.setDatosNuevos(valorNuevo != null ? "\"" + valorNuevo + "\"" : null);

        registroActividadRepository.save(reg);
    }

    @Override
    public RegistroActividad buscarPorId(Integer id) {
    return registroActividadRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Registro de actividad no encontrado con ID: " + id));
}

}