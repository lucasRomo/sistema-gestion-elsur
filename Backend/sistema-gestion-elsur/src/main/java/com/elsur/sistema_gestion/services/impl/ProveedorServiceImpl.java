package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Direccion;
import com.elsur.sistema_gestion.models.Proveedor;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ProveedorRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.ProveedorService;
import com.elsur.sistema_gestion.services.RegistroActividadService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class ProveedorServiceImpl implements ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    @Override
    @Transactional
    public Proveedor guardar(Proveedor proveedor, Integer idUsuario) {
        if (proveedor.getEstado() == null || proveedor.getEstado().trim().isEmpty()) {
            proveedor.setEstado("Activo");
        }

        // --- LÓGICA DE AUDITORÍA EN EDICIÓN ---
        if (proveedor.getIdProveedor() != null && proveedorRepository.existsById(proveedor.getIdProveedor())) {
            
            Proveedor proveedorViejo = proveedorRepository.findById(proveedor.getIdProveedor()).orElse(null);

            if (proveedorViejo != null) {
                // Buscamos el usuario operador
                Usuario usuarioActual = null;
                if (idUsuario != null) {
                    usuarioActual = usuarioRepository.findById(idUsuario).orElse(null);
                }
                if (usuarioActual == null) {
                    usuarioActual = usuarioRepository.findAll().stream().findFirst().orElse(null);
                }

                // 1. Auditoría de campos directos de Proveedor
                compararYRegistrar(usuarioActual, "Proveedor", "nombreComercial", proveedor.getIdProveedor(),
                        proveedorViejo.getNombreComercial(), proveedor.getNombreComercial());

                compararYRegistrar(usuarioActual, "Proveedor", "contactoNombre", proveedor.getIdProveedor(),
                        proveedorViejo.getContactoNombre(), proveedor.getContactoNombre());

                compararYRegistrar(usuarioActual, "Proveedor", "emailContacto", proveedor.getIdProveedor(),
                        proveedorViejo.getEmailContacto(), proveedor.getEmailContacto());

                compararYRegistrar(usuarioActual, "Proveedor", "estado", proveedor.getIdProveedor(),
                        proveedorViejo.getEstado(), proveedor.getEstado());

                // 2. Auditoría de Dirección asociada al Proveedor
                if (proveedorViejo.getDireccion() != null && proveedor.getDireccion() != null) {
                    Direccion dVieja = proveedorViejo.getDireccion();
                    Direccion dNueva = proveedor.getDireccion();

                    compararYRegistrar(usuarioActual, "Direccion", "calle", proveedor.getIdProveedor(),
                            dVieja.getCalle(), dNueva.getCalle());

                    compararYRegistrar(usuarioActual, "Direccion", "numero", proveedor.getIdProveedor(),
                            dVieja.getNumero(), dNueva.getNumero());

                    compararYRegistrar(usuarioActual, "Direccion", "piso", proveedor.getIdProveedor(),
                            dVieja.getPiso(), dNueva.getPiso());

                    compararYRegistrar(usuarioActual, "Direccion", "departamento", proveedor.getIdProveedor(),
                            dVieja.getDepartamento(), dNueva.getDepartamento());

                    compararYRegistrar(usuarioActual, "Direccion", "codigoPostal", proveedor.getIdProveedor(),
                            dVieja.getCodigoPostal(), dNueva.getCodigoPostal());

                    compararYRegistrar(usuarioActual, "Direccion", "ciudad", proveedor.getIdProveedor(),
                            dVieja.getCiudad(), dNueva.getCiudad());

                    compararYRegistrar(usuarioActual, "Direccion", "provincia", proveedor.getIdProveedor(),
                            dVieja.getProvincia(), dNueva.getProvincia());

                    compararYRegistrar(usuarioActual, "Direccion", "pais", proveedor.getIdProveedor(),
                            dVieja.getPais(), dNueva.getPais());
                }
            }
        }

        return proveedorRepository.save(proveedor);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        proveedorRepository.deleteById(id);
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