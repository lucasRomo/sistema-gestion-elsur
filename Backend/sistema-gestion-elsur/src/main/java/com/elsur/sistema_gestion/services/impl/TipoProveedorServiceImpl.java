package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.TipoProveedor;
import com.elsur.sistema_gestion.repositories.TipoProveedorRepository;
import com.elsur.sistema_gestion.services.TipoProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TipoProveedorServiceImpl implements TipoProveedorService {

    @Autowired
    private TipoProveedorRepository tipoProveedorRepository;

    @Override
    public List<TipoProveedor> listarTodo() {
        return tipoProveedorRepository.findAll();
    }

    @Override
    public TipoProveedor guardar(TipoProveedor tipoProveedor) {
        // CORREGIDO: no se validaba descripción blanca ni duplicada (el frontend,
        // ProveedorModal.tsx, sí revisa duplicados pero solo contra la lista ya
        // cargada en memoria -- una llamada directa a la API lo saltea por completo).
        if (tipoProveedor.getDescripcion() == null || tipoProveedor.getDescripcion().trim().isEmpty()) {
            throw new SolicitudInvalidaException("La descripción del tipo de proveedor es obligatoria.");
        }
        String descripcionNormalizada = tipoProveedor.getDescripcion().trim();
        Integer idExcluido = tipoProveedor.getIdTipoProveedor() != null ? tipoProveedor.getIdTipoProveedor() : -1;
        if (tipoProveedorRepository.existsByDescripcionIgnoreCaseAndIdTipoProveedorNot(descripcionNormalizada, idExcluido)) {
            throw new RecursoDuplicadoException("Ya existe un tipo de proveedor con la descripción '" + descripcionNormalizada + "'.");
        }
        tipoProveedor.setDescripcion(descripcionNormalizada);
        return tipoProveedorRepository.save(tipoProveedor);
    }

    @Override
    public void eliminar(Integer id) {
        if (!tipoProveedorRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("No se encontró el tipo de proveedor con id: " + id);
        }
        try {
            tipoProveedorRepository.deleteById(id);
            tipoProveedorRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ConflictoDeIntegridadException(
                "No se puede eliminar el tipo de proveedor porque está en uso por uno o más proveedores.");
        }
    }
}