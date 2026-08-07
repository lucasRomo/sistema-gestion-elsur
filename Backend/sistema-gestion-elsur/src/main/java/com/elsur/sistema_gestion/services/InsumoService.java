package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Insumo;
import java.math.BigDecimal;
import java.util.List;

public interface InsumoService {
    List<Insumo> listarTodos();
    Insumo buscarPorId(Integer id);
    Insumo guardar(Insumo insumo, Integer idUsuario);
    void eliminar(Integer id);
    List<Insumo> listarInsumosBajoStock();
    void actualizarMasivo(double porcentaje, Integer idProveedor, List<Integer> idsInsumos, String criterio, Integer idUsuario);
    Insumo convertirStock(Integer idInsumo, BigDecimal cantidadBultos, Integer idUsuario);
}