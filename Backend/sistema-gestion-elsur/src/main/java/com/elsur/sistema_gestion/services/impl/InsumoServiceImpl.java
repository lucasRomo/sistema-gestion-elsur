package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
import com.elsur.sistema_gestion.services.InsumoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsumoServiceImpl implements InsumoService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Override
    public List<Insumo> listarTodos() {
        return insumoRepository.findAll();
    }

    @Override
    public Insumo buscarPorId(Integer id) {
        return insumoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado con id: " + id));
    }

    @Override
@Transactional
public Insumo guardar(Insumo insumo) {
    // Validación básica: no permitir stock negativo
    // compareTo devuelve: -1 si es menor, 0 si es igual, 1 si es mayor
    if (insumo.getStockActual() != null && insumo.getStockActual().compareTo(java.math.BigDecimal.ZERO) < 0) {
        throw new RuntimeException("El stock actual no puede ser negativo");
    }
    return insumoRepository.save(insumo);
}

    @Override
    public void eliminar(Integer id) {
        insumoRepository.deleteById(id);
    }

    @Override
public List<Insumo> listarInsumosBajoStock() {
    return insumoRepository.findAll().stream()
            .filter(i -> i.getStockActual() != null && i.getStockMinimo() != null)
            // Aquí: si compareTo devuelve -1 o 0, es porque el stock es menor o igual al mínimo
            .filter(i -> i.getStockActual().compareTo(i.getStockMinimo()) <= 0)
            .collect(Collectors.toList());
}
}