package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Merma;
import java.util.List;

public interface MermaService {
    List<Merma> registrarMermas(List<Merma> mermas);
    List<Merma> obtenerPorPedido(Long idPedido);
    List<Merma> obtenerTodas();
}