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

    // Estados operativos reconocidos por el resto del sistema (ver
    // PedidoServiceImpl.evaluarMaquinasYAvanzar, que normaliza a mayúsculas y
    // reemplaza '_' por ' ' antes de comparar). Se aceptan ambas grafías (con guión
    // bajo o con espacio) porque el frontend (MaquinaModal.tsx) usa espacios.
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
        // CORREGIDO: el nombre no se validaba -- ni blanco, ni duplicado. Además,
        // MaquinaRepository.existsByNombreIgnoreCase ya existía pero nunca se llamaba
        // desde acá, así que la validación de duplicados nunca corría en la práctica.
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

        // Auditoría en modificación
        if (maquina.getIdMaquina() != null && maquinaRepository.existsById(maquina.getIdMaquina())) {
            Maquina vieja = maquinaRepository.findById(maquina.getIdMaquina()).orElse(null);
            if (vieja != null) {
                // CORREGIDO: fallback en silencio al "primer usuario de la base" -- el
                // frontend (maquinasService.ts) nunca mandaba idUsuario, así que el
                // 100% de las ediciones quedaban mal atribuidas en el historial.
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
        // Normalizado a la misma grafía que usa el frontend (mayúsculas, separado
        // por espacios) para que las comparaciones exactas (MaquinaModal.tsx,
        // MaquinaFallaModal.tsx) sigan funcionando sin importar cómo llegó el string.
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
            // CORREGIDO: antes esta excepción (máquina referenciada por un Producto a
            // través de maquinaNecesaria) no se atrapaba y devolvía el mensaje crudo de
            // Hibernate/JDBC.
            throw new ConflictoDeIntegridadException(
                "No se puede eliminar el equipo porque está asociado a uno o más productos.");
        }
    }

    // CORREGIDO: cambiarEstado() aceptaba cualquier string como nuevo estado (sin
    // whitelist), lo que podía dejar la máquina en un estado que el resto del
    // sistema (chequeo de máquina caída en Crear Pedido/Dashboard) no reconoce como
    // "fuera de servicio" ni como "operativa".
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