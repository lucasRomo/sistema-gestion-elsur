package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Maquina;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.MaquinaRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.MaquinaService;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class MaquinaServiceImpl implements MaquinaService {

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
                .orElseThrow(() -> new RuntimeException("Máquina no encontrada con id: " + id));
    }

    @Override
    @Transactional
    public Maquina guardar(Maquina maquina, Integer idUsuarioOperador) {
        if (maquina.getEstado() == null || maquina.getEstado().trim().isEmpty()) {
            maquina.setEstado("OPERATIVA");
        }

        // Auditoría en modificación
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
        Maquina m = buscarPorId(id);
        String estadoAnterior = m.getEstado();
        m.setEstado(nuevoEstado);

        Usuario operador = obtenerOperador(idUsuarioOperador);
        compararYRegistrar(operador, "Maquina", "estado", id, estadoAnterior, nuevoEstado);

        return maquinaRepository.save(m);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        maquinaRepository.deleteById(id);
    }

    private Usuario obtenerOperador(Integer idUsuario) {
        if (idUsuario != null) {
            Usuario u = usuarioRepository.findById(idUsuario).orElse(null);
            if (u != null) return u;
        }
        return usuarioRepository.findAll().stream().findFirst().orElse(null);
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