package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.InsumoService;
import com.elsur.sistema_gestion.services.RegistroActividadService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class InsumoServiceImpl implements InsumoService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private UsuarioRepository usuarioRepository;

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
    public Insumo guardar(Insumo insumo, Integer idUsuario) {
        // Validación básica: no permitir stock negativo
        if (insumo.getStockActual() != null && insumo.getStockActual().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El stock actual no puede ser negativo");
        }

        if (insumo.getEstado() == null || insumo.getEstado().trim().isEmpty()) {
            insumo.setEstado("Activo");
        }

        // --- LÓGICA DE AUDITORÍA EN EDICIÓN ---
        if (insumo.getIdInsumo() != null && insumoRepository.existsById(insumo.getIdInsumo())) {
            
            Insumo insumoViejo = insumoRepository.findById(insumo.getIdInsumo()).orElse(null);

            if (insumoViejo != null) {
                Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

                // 1. Campos directos
                compararYRegistrar(usuarioActual, "Insumo", "nombreInsumo", insumo.getIdInsumo(),
                        insumoViejo.getNombreInsumo(), insumo.getNombreInsumo());

                compararYRegistrar(usuarioActual, "Insumo", "stockActual", insumo.getIdInsumo(),
                        insumoViejo.getStockActual(), insumo.getStockActual());

                compararYRegistrar(usuarioActual, "Insumo", "stockMinimo", insumo.getIdInsumo(),
                        insumoViejo.getStockMinimo(), insumo.getStockMinimo());

                compararYRegistrar(usuarioActual, "Insumo", "estado", insumo.getIdInsumo(),
                        insumoViejo.getEstado(), insumo.getEstado());

                // 2. Relación Proveedor (rehidratada por ID/Nombre)
                String provViejo = (insumoViejo.getProveedor() != null && insumoViejo.getProveedor().getNombreComercial() != null) 
                        ? insumoViejo.getProveedor().getNombreComercial() : "";

                String provNuevo = "";
                if (insumo.getProveedor() != null) {
                    if (insumo.getProveedor().getNombreComercial() != null && !insumo.getProveedor().getNombreComercial().trim().isEmpty()) {
                        provNuevo = insumo.getProveedor().getNombreComercial();
                    } else if (insumo.getProveedor().getIdProveedor() != null) {
                        if (insumoViejo.getProveedor() != null && 
                            insumoViejo.getProveedor().getIdProveedor().equals(insumo.getProveedor().getIdProveedor())) {
                            provNuevo = provViejo; // Mantiene el proveedor si solo vino el ID desde React
                        }
                    }
                }
                compararYRegistrar(usuarioActual, "Insumo", "proveedor", insumo.getIdInsumo(), provViejo, provNuevo);

                // 3. Relación UnidadMedida
                String uniVieja = (insumoViejo.getUnidadMedida() != null) 
                        ? String.valueOf(insumoViejo.getUnidadMedida().getNombre()) : "";

                String uniNueva = "";
                if (insumo.getUnidadMedida() != null) {
                    if (insumo.getUnidadMedida().getNombre() != null) {
                        uniNueva = String.valueOf(insumo.getUnidadMedida().getNombre());
                    }
                }
                compararYRegistrar(usuarioActual, "Insumo", "unidadMedida", insumo.getIdInsumo(), uniVieja, uniNueva);
            }
        }

        return insumoRepository.save(insumo);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        insumoRepository.deleteById(id);
    }

    @Override
    public List<Insumo> listarInsumosBajoStock() {
        return insumoRepository.findAll().stream()
                .filter(i -> i.getStockActual() != null && i.getStockMinimo() != null)
                .filter(i -> i.getStockActual().compareTo(i.getStockMinimo()) <= 0)
                .collect(Collectors.toList());
    }

    private Usuario obtenerUsuarioOperador(Integer idUsuario) {
        if (idUsuario != null) {
            Usuario u = usuarioRepository.findById(idUsuario).orElse(null);
            if (u != null) return u;
        }
        return usuarioRepository.findAll().stream().findFirst().orElse(null);
    }

    private void compararYRegistrar(Usuario usuario, String tabla, String columna, Integer idReg, Object viejoVal, Object nuevoVal) {
        if (viejoVal == null && nuevoVal == null) return;

        boolean sonIguales = false;

        if (viejoVal instanceof Number || nuevoVal instanceof Number) {
            try {
                BigDecimal bdViejo = viejoVal != null ? new BigDecimal(viejoVal.toString()) : BigDecimal.ZERO;
                BigDecimal bdNuevo = nuevoVal != null ? new BigDecimal(nuevoVal.toString()) : BigDecimal.ZERO;
                sonIguales = bdViejo.compareTo(bdNuevo) == 0;
            } catch (Exception e) {
                sonIguales = Objects.equals(viejoVal, nuevoVal);
            }
        } else {
            String stringViejo = viejoVal != null ? viejoVal.toString().trim() : "";
            String stringNuevo = nuevoVal != null ? nuevoVal.toString().trim() : "";
            sonIguales = Objects.equals(stringViejo, stringNuevo);
        }

        if (!sonIguales) {
            registroActividadService.registrarCambio(
                usuario,
                "UPDATE",
                tabla,
                columna,
                idReg,
                viejoVal != null ? viejoVal.toString() : "",
                nuevoVal != null ? nuevoVal.toString() : ""
            );
        }
    }
}