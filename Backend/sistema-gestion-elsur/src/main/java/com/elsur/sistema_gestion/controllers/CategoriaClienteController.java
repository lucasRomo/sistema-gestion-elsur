package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.categoriaCliente;
import com.elsur.sistema_gestion.repositories.categoriaClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/categorias-cliente")
public class CategoriaClienteController {

    @Autowired
    private categoriaClienteRepository repository;

    @GetMapping
    public List<categoriaCliente> listar() {
        return repository.findAll();
    }

    @PostMapping
    public categoriaCliente guardar(@RequestBody categoriaCliente categoria) {
        validarYNormalizar(categoria);
        return repository.save(categoria);
    }

    @PutMapping("/{id}")
    public categoriaCliente actualizar(@PathVariable Integer id, @RequestBody categoriaCliente categoriaDetalles) {
        return repository.findById(id).map(categoria -> {
            categoriaDetalles.setIdCategoria(id);
            validarYNormalizar(categoriaDetalles);
            categoria.setNombre(categoriaDetalles.getNombre());
            categoria.setDescuentoAutomatico(categoriaDetalles.getDescuentoAutomatico());
            return repository.save(categoria);
        }).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada con id: " + id));
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        if (!repository.existsById(id)) {
            throw new RecursoNoEncontradoException("No se encontró la categoría de cliente con id: " + id);
        }
        try {
            repository.deleteById(id);
            repository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ConflictoDeIntegridadException(
                "No se puede eliminar la categoría porque está en uso por uno o más clientes.");
        }
    }

    // CORREGIDO: esta categoría (nombre y % de descuento automático que se aplica en
    // Crear Pedido) no tenía NINGUNA validación -- ni nombre blanco/duplicado, ni
    // rango del descuento. Mismo patrón ya cerrado en CategoriaProducto.
    private void validarYNormalizar(categoriaCliente categoria) {
        if (categoria.getNombre() == null || categoria.getNombre().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre de la categoría es obligatorio.");
        }
        String nombreNormalizado = categoria.getNombre().trim();
        Integer idExcluido = categoria.getIdCategoria() != null ? categoria.getIdCategoria() : -1;
        if (repository.existsByNombreIgnoreCaseAndIdCategoriaNot(nombreNormalizado, idExcluido)) {
            throw new RecursoDuplicadoException("Ya existe una categoría de cliente con el nombre '" + nombreNormalizado + "'.");
        }
        categoria.setNombre(nombreNormalizado);

        BigDecimal descuento = categoria.getDescuentoAutomatico();
        if (descuento == null) {
            categoria.setDescuentoAutomatico(BigDecimal.ZERO);
        } else if (descuento.signum() < 0 || descuento.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new SolicitudInvalidaException("El descuento automático debe estar entre 0 y 100.");
        }
    }
}