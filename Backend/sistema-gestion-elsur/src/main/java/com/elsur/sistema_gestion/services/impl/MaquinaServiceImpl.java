package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Maquina;
import com.elsur.sistema_gestion.repositories.MaquinaRepository;
import com.elsur.sistema_gestion.services.MaquinaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MaquinaServiceImpl implements MaquinaService {

    @Autowired
    private MaquinaRepository maquinaRepository;

    @Override
    public List<Maquina> listarTodas() {
        return maquinaRepository.findAll();
    }

    @Override
    public List<Maquina> listarOperativas() {
        return maquinaRepository.findByEstado("OPERATIVA");
    }

    @Override
    public Maquina buscarPorId(Integer id) {
        return maquinaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Máquina no encontrada"));
    }

    @Override
    @Transactional
    public Maquina guardar(Maquina maquina) {
        return maquinaRepository.save(maquina);
    }

    @Override
    @Transactional
    public void cambiarEstado(Integer id, String nuevoEstado) {
        Maquina m = buscarPorId(id);
        m.setEstado(nuevoEstado);
        maquinaRepository.save(m);
    }
}