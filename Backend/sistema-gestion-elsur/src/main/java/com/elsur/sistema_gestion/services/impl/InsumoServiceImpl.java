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
import java.math.RoundingMode;
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
        if (insumo.getPrecio() != null && insumo.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El precio no puede ser negativo");
        }

        if (insumo.getStockActual() != null && insumo.getStockActual().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El stock actual no puede ser negativo");
        }

        if (insumo.getStockEmpaquetado() != null && insumo.getStockEmpaquetado().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El stock empaquetado no puede ser negativo");
        }

        if (insumo.getFactorConversion() != null && insumo.getFactorConversion().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El factor de conversión debe ser mayor a cero");
        }

        if (insumo.getEstado() == null || insumo.getEstado().trim().isEmpty()) {
            insumo.setEstado("Activo");
        }

        if (insumo.getIdInsumo() != null && insumoRepository.existsById(insumo.getIdInsumo())) {
            Insumo insumoViejo = insumoRepository.findById(insumo.getIdInsumo()).orElse(null);

            if (insumoViejo != null) {
                Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

                compararYRegistrar(usuarioActual, "Insumo", "nombreInsumo", insumo.getIdInsumo(),
                        insumoViejo.getNombreInsumo(), insumo.getNombreInsumo());

                compararYRegistrar(usuarioActual, "Insumo", "precio", insumo.getIdInsumo(),
                        insumoViejo.getPrecio(), insumo.getPrecio());

                compararYRegistrar(usuarioActual, "Insumo", "stockActual", insumo.getIdInsumo(),
                        insumoViejo.getStockActual(), insumo.getStockActual());

                compararYRegistrar(usuarioActual, "Insumo", "stockEmpaquetado", insumo.getIdInsumo(),
                        insumoViejo.getStockEmpaquetado(), insumo.getStockEmpaquetado());

                compararYRegistrar(usuarioActual, "Insumo", "factorConversion", insumo.getIdInsumo(),
                        insumoViejo.getFactorConversion(), insumo.getFactorConversion());

                compararYRegistrar(usuarioActual, "Insumo", "stockMinimo", insumo.getIdInsumo(),
                        insumoViejo.getStockMinimo(), insumo.getStockMinimo());

                compararYRegistrar(usuarioActual, "Insumo", "estado", insumo.getIdInsumo(),
                        insumoViejo.getEstado(), insumo.getEstado());

                String provViejo = (insumoViejo.getProveedor() != null && insumoViejo.getProveedor().getNombreComercial() != null) 
                        ? insumoViejo.getProveedor().getNombreComercial() : "";

                String provNuevo = "";
                if (insumo.getProveedor() != null) {
                    if (insumo.getProveedor().getNombreComercial() != null && !insumo.getProveedor().getNombreComercial().trim().isEmpty()) {
                        provNuevo = insumo.getProveedor().getNombreComercial();
                    } else if (insumo.getProveedor().getIdProveedor() != null) {
                        if (insumoViejo.getProveedor() != null && 
                            insumoViejo.getProveedor().getIdProveedor().equals(insumo.getProveedor().getIdProveedor())) {
                            provNuevo = provViejo;
                        }
                    }
                }
                compararYRegistrar(usuarioActual, "Insumo", "proveedor", insumo.getIdInsumo(), provViejo, provNuevo);

                String uniVieja = (insumoViejo.getUnidadMedida() != null) 
                        ? String.valueOf(insumoViejo.getUnidadMedida().getNombre()) : "";

                String uniNueva = "";
                if (insumo.getUnidadMedida() != null && insumo.getUnidadMedida().getNombre() != null) {
                    uniNueva = String.valueOf(insumo.getUnidadMedida().getNombre());
                }
                compararYRegistrar(usuarioActual, "Insumo", "unidadMedida", insumo.getIdInsumo(), uniVieja, uniNueva);

                String uniCompraVieja = (insumoViejo.getUnidadCompra() != null) 
                        ? String.valueOf(insumoViejo.getUnidadCompra().getNombre()) : "";

                String uniCompraNueva = "";
                if (insumo.getUnidadCompra() != null && insumo.getUnidadCompra().getNombre() != null) {
                    uniCompraNueva = String.valueOf(insumo.getUnidadCompra().getNombre());
                }
                compararYRegistrar(usuarioActual, "Insumo", "unidadCompra", insumo.getIdInsumo(), uniCompraVieja, uniCompraNueva);
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

    @Override
    @Transactional
    public void actualizarMasivo(double porcentaje, Integer idProveedor, List<Integer> idsInsumos, String criterio, Integer idUsuario) {
        List<Insumo> todos = insumoRepository.findAll();
        List<Insumo> aModificar;

        if ("SELECCION".equalsIgnoreCase(criterio)) {
            if (idsInsumos == null || idsInsumos.isEmpty()) {
                return;
            }
            List<Integer> ids = idsInsumos.stream()
                    .map(num -> Integer.parseInt(num.toString()))
                    .collect(Collectors.toList());

            aModificar = todos.stream()
                    .filter(i -> ids.contains(i.getIdInsumo()))
                    .collect(Collectors.toList());

        } else if ("PROVEEDOR".equalsIgnoreCase(criterio) || "CATEGORIA".equalsIgnoreCase(criterio)) {
            if (idProveedor == null || idProveedor <= 0) {
                return;
            }
            aModificar = todos.stream()
                    .filter(i -> i.getProveedor() != null && idProveedor.equals(i.getProveedor().getIdProveedor()))
                    .collect(Collectors.toList());

        } else { 
            aModificar = todos;
        }

        if (aModificar.isEmpty()) return;

        Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

        for (Insumo ins : aModificar) {
            BigDecimal precioViejo = ins.getPrecio() != null ? ins.getPrecio() : BigDecimal.ZERO;
            BigDecimal factor = BigDecimal.valueOf(1.0 + (porcentaje / 100.0));
            BigDecimal nuevoPrecio = precioViejo.multiply(factor).setScale(2, RoundingMode.HALF_UP);

            ins.setPrecio(nuevoPrecio);

            compararYRegistrar(usuarioActual, "Insumo", "precio", ins.getIdInsumo(), precioViejo, nuevoPrecio);
        }

        insumoRepository.saveAll(aModificar);
    }

    // GP.33: Registrar Conversión de Insumos (Atómica)
    @Override
    @Transactional
    public Insumo convertirStock(Integer idInsumo, BigDecimal cantidadBultos, Integer idUsuario) {
        if (cantidadBultos == null || cantidadBultos.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("La cantidad de bultos a abrir debe ser mayor a cero");
        }

        Insumo insumo = buscarPorId(idInsumo);

        if (insumo.getFactorConversion() == null || insumo.getFactorConversion().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El insumo no tiene un factor de conversión configurado");
        }

        BigDecimal stockEmp = insumo.getStockEmpaquetado() != null ? insumo.getStockEmpaquetado() : BigDecimal.ZERO;
        if (stockEmp.compareTo(cantidadBultos) < 0) {
            throw new RuntimeException("Stock insuficiente de empaques/bultos cerrados. Disponible: " + stockEmp);
        }

        BigDecimal stockEmpaquetadoAnterior = stockEmp;
        BigDecimal stockActualAnterior = insumo.getStockActual() != null ? insumo.getStockActual() : BigDecimal.ZERO;

        // Operación atómica: restar de empaques y sumar a consumo suelto
        BigDecimal nuevoStockEmpaquetado = stockEmp.subtract(cantidadBultos);
        BigDecimal incrementoUnidadesSueltas = cantidadBultos.multiply(insumo.getFactorConversion());
        BigDecimal nuevoStockActual = stockActualAnterior.add(incrementoUnidadesSueltas);

        insumo.setStockEmpaquetado(nuevoStockEmpaquetado);
        insumo.setStockActual(nuevoStockActual);

        Usuario usuarioActual = obtenerUsuarioOperador(idUsuario);

        compararYRegistrar(usuarioActual, "Insumo", "stockEmpaquetado", insumo.getIdInsumo(), stockEmpaquetadoAnterior, nuevoStockEmpaquetado);
        compararYRegistrar(usuarioActual, "Insumo", "stockActual", insumo.getIdInsumo(), stockActualAnterior, nuevoStockActual);

        return insumoRepository.save(insumo);
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