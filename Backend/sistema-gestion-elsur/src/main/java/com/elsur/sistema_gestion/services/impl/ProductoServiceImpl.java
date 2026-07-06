package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ProductoServiceImpl implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @Override
    public Producto buscarPorId(Integer id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
    }

    @Override
    @Transactional
    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        productoRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void actualizarPreciosMasivo(double porcentaje) {
        List<Producto> productos = productoRepository.findAll();
        aplicarAumento(productos, porcentaje);
    }

    @Override
    @Transactional
    public void actualizarPreciosPorCategoria(Integer idCategoria, double porcentaje) {
        // Suponiendo que agregaste este método al ProductoRepository
        // List<Producto> productos = productoRepository.findByCategoriaIdCategoria(idCategoria);
        // Si no querés tocar el repo todavía, podés filtrar con stream:
        List<Producto> productos = productoRepository.findAll().stream()
                .filter(p -> p.getCategoria() != null && p.getCategoria().getIdCategoria().equals(idCategoria))
                .toList();
        
        aplicarAumento(productos, porcentaje);
    }

    // Método privado para reutilizar la lógica de aumento y redondeo
    private void aplicarAumento(List<Producto> productos, double porcentaje) {
        BigDecimal factor = new BigDecimal(porcentaje / 100).add(BigDecimal.ONE);
        
        for (Producto p : productos) {
            if (p.getPrecioBase() != null) {
                BigDecimal nuevoPrecio = p.getPrecioBase().multiply(factor);
                // Redondeamos a 2 decimales para que no tire error la base de datos
                p.setPrecioBase(nuevoPrecio.setScale(2, RoundingMode.HALF_UP));
            }
        }
        productoRepository.saveAll(productos);
    }
}