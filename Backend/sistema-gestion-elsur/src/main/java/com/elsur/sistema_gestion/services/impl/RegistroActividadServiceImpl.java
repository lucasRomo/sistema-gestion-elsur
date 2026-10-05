package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;

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
        return registroActividadRepository.buscarConFiltros(idUsuario, patronTabla(tabla));
    }

    // El registro crece con cada cambio que hace cualquiera: la pantalla lo pide de a páginas.
    @Override
    public java.util.Map<String, Object> buscarConFiltrosPaginado(Integer idUsuario, String tabla, int pagina, int tamano) {
        int tamanoSeguro = Math.min(Math.max(tamano, 1), 200);
        org.springframework.data.domain.Page<RegistroActividad> resultado = registroActividadRepository
                .buscarConFiltrosPaginado(idUsuario, patronTabla(tabla),
                        org.springframework.data.domain.PageRequest.of(Math.max(pagina, 0), tamanoSeguro));

        java.util.Map<String, Object> respuesta = new java.util.LinkedHashMap<>();
        respuesta.put("contenido", resultado.getContent());
        respuesta.put("pagina", resultado.getNumber());
        respuesta.put("totalElementos", resultado.getTotalElements());
        respuesta.put("ultima", resultado.isLast());
        return respuesta;
    }

    @Override
    public List<Usuario> listarUsuariosConActividad() {
        return registroActividadRepository.buscarUsuariosConActividad();
    }

    private String patronTabla(String tabla) {
        if (tabla == null || tabla.trim().isEmpty() || "Sin Filtro".equalsIgnoreCase(tabla)) return null;
        return "%" + tabla.trim().toLowerCase() + "%";
    }

    @Override
    public RegistroActividad guardar(RegistroActividad registro) {
        return registroActividadRepository.save(registro);
    }

    @Override
    public void registrarCambio(Usuario usuario, String accion, String tabla, String columna,
                                Integer idRegistro, String valorViejo, String valorNuevo) {

        if (valorViejo != null && valorViejo.equals(valorNuevo)) return;

        RegistroActividad reg = new RegistroActividad();
        reg.setFecha(new Timestamp(System.currentTimeMillis()));
        reg.setUsuario(usuario);
        reg.setAccion(accion);
        reg.setTablaAfectada(tabla);
        reg.setColumnaAfectada(columna);
        reg.setIdRegistroMod(idRegistro);

        reg.setDatosAnteriores(valorViejo != null ? "\"" + valorViejo + "\"" : null);
        reg.setDatosNuevos(valorNuevo != null ? "\"" + valorNuevo + "\"" : null);

        registroActividadRepository.save(reg);
    }

    @Override
    public RegistroActividad buscarPorId(Integer id) {
    return registroActividadRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Registro de actividad no encontrado con ID: " + id));
}

}