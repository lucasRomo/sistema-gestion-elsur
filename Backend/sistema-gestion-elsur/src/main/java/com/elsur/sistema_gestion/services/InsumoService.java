package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Insumo;
import java.util.List;

public interface InsumoService {
    List<Insumo> listarTodos();
    Insumo guardar(Insumo insumo);
    Insumo buscarPorId(Integer id);
    void eliminar(Integer id);
    List<Insumo> listarInsumosBajoStock();
}