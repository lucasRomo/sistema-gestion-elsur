package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Maquina;
import java.util.List;

public interface MaquinaService {
    List<Maquina> listarTodas();
    Maquina buscarPorId(Integer id);
    Maquina guardar(Maquina maquina, Integer idUsuarioOperador);
    Maquina cambiarEstado(Integer id, String nuevoEstado, Integer idUsuarioOperador);
    void eliminar(Integer id);
}