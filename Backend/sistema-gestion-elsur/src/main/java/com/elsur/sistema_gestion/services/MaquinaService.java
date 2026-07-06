package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Maquina;
import java.util.List;

public interface MaquinaService {
    List<Maquina> listarTodas();
    List<Maquina> listarOperativas();
    Maquina guardar(Maquina maquina);
    Maquina buscarPorId(Integer id);
    void cambiarEstado(Integer id, String nuevoEstado);
}