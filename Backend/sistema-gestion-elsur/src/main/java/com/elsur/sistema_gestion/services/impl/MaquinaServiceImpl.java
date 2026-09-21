package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Maquina;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.MaquinaRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.MaquinaService;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class MaquinaServiceImpl implements MaquinaService {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "OPERATIVA", "FUERA DE SERVICIO", "FALLA", "MANTENIMIENTO"
    );

    @Autowired
    private MaquinaRepository maquinaRepository;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public List<Maquina> listarTodas() {
        return maquinaRepository.findAll();
    }

    @Override
    public Maquina buscarPorId(Integer id) {
        return maquinaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Máquina no encontrada con id: " + id));
    }

    @Override
    @Transactional
    public Maquina guardar(Maquina maquina, Integer idUsuarioOperador) {

        if (maquina.getNombre() == null || maquina.getNombre().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre del equipo/máquina es obligatorio.");
        }
        String nombreNormalizado = maquina.getNombre().trim();
        Integer idMaquinaExcluida = maquina.getIdMaquina() != null ? maquina.getIdMaquina() : -1;
        if (maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(nombreNormalizado, idMaquinaExcluida)) {
            throw new RecursoDuplicadoException("Ya existe un equipo registrado con el nombre '" + nombreNormalizado + "'.");
        }
        maquina.setNombre(nombreNormalizado);

        if (maquina.getEstado() == null || maquina.getEstado().trim().isEmpty()) {
            maquina.setEstado("OPERATIVA");
        } else {
            validarEstado(maquina.getEstado());
        }

        if (maquina.getIdMaquina() != null && maquinaRepository.existsById(maquina.getIdMaquina())) {
            Maquina vieja = maquinaRepository.findById(maquina.getIdMaquina()).orElse(null);
            if (vieja != null) {

                Usuario operador = obtenerOperador(idUsuarioOperador);
                compararYRegistrar(operador, "Maquina", "nombre", maquina.getIdMaquina(), vieja.getNombre(), maquina.getNombre());
                compararYRegistrar(operador, "Maquina", "estado", maquina.getIdMaquina(), vieja.getEstado(), maquina.getEstado());
            }
        }

        return maquinaRepository.save(maquina);
    }

    @Override
    @Transactional
    public Maquina cambiarEstado(Integer id, String nuevoEstado, Integer idUsuarioOperador) {
        validarEstado(nuevoEstado);
        Maquina m = buscarPorId(id);
        String estadoAnterior = m.getEstado();

        m.setEstado(nuevoEstado.trim().toUpperCase().replace('_', ' '));

        Usuario operador = obtenerOperador(idUsuarioOperador);
        compararYRegistrar(operador, "Maquina", "estado", id, estadoAnterior, m.getEstado());

        return maquinaRepository.save(m);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        if (!maquinaRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("No se encontró la máquina con id: " + id);
        }
        try {
            maquinaRepository.deleteById(id);
            maquinaRepository.flush();
        } catch (DataIntegrityViolationException e) {

            throw new ConflictoDeIntegridadException(
                "No se puede eliminar el equipo porque está asociado a uno o más productos.");
        }
    }

    private void validarEstado(String estado) {
        if (estado == null || estado.trim().isEmpty()) {
            throw new SolicitudInvalidaException("El estado del equipo es obligatorio.");
        }
        String normalizado = estado.trim().toUpperCase().replace('_', ' ');
        if (!ESTADOS_VALIDOS.contains(normalizado)) {
            throw new SolicitudInvalidaException(
                "Estado de máquina inválido: '" + estado + "'. Valores permitidos: OPERATIVA, FUERA DE SERVICIO, FALLA, MANTENIMIENTO.");
        }
    }

    private Usuario obtenerOperador(Integer idUsuario) {
        if (idUsuario == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que realiza la modificación.");
        }
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));
    }

    private void compararYRegistrar(Usuario usuario, String tabla, String columna, Integer idReg, Object viejoVal, Object nuevoVal) {
        if (viejoVal == null && nuevoVal == null) return;
        String v1 = viejoVal != null ? viejoVal.toString().trim() : "";
        String v2 = nuevoVal != null ? nuevoVal.toString().trim() : "";

        if (!Objects.equals(v1, v2)) {
            registroActividadService.registrarCambio(
                usuario, "UPDATE", tabla, columna, idReg, v1, v2
            );
        }
    }
}