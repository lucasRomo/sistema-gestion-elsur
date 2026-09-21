package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.ProductoInsumo;
import com.elsur.sistema_gestion.models.ProductoInsumo.ProductoInsumoId;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoInsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/producto-insumo")
public class ProductoInsumoController {

    @Autowired
    private ProductoInsumoRepository productoInsumoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @GetMapping
    public List<ProductoInsumo> listar() {
        return productoInsumoRepository.findAll();
    }

    @GetMapping("/producto/{idProducto}")
    public List<ProductoInsumo> obtenerPorProducto(@PathVariable Integer idProducto) {
        return productoInsumoRepository.findByIdIdProducto(idProducto);
    }

    @PutMapping("/producto/{idProducto}")
    @Transactional
    public ResponseEntity<?> actualizarReceta(
            @PathVariable Integer idProducto,
            @RequestBody List<RecetaItemDTO> recetaDTOs) {

        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con ID: " + idProducto));

        Set<Integer> idsInsumosVistos = new HashSet<>();
        for (RecetaItemDTO dto : recetaDTOs) {
            if (dto.getIdInsumo() == null) {
                throw new SolicitudInvalidaException("Cada ítem de la receta debe indicar un insumo");
            }
            if (dto.getCantidadConsumo() == null || dto.getCantidadConsumo().compareTo(BigDecimal.ZERO) <= 0) {
                throw new SolicitudInvalidaException("La cantidad a consumir debe ser mayor a cero");
            }
            if (!idsInsumosVistos.add(dto.getIdInsumo())) {
                throw new SolicitudInvalidaException("El insumo con ID " + dto.getIdInsumo() + " está repetido en la receta");
            }
        }

        List<ProductoInsumo> recetaExistente = productoInsumoRepository.findByIdIdProducto(idProducto);
        if (!recetaExistente.isEmpty()) {
            productoInsumoRepository.deleteAll(recetaExistente);
        }

        List<ProductoInsumo> nuevasEntradas = new ArrayList<>();
        for (RecetaItemDTO dto : recetaDTOs) {
            Insumo insumo = insumoRepository.findById(dto.getIdInsumo())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Insumo no encontrado con ID: " + dto.getIdInsumo()));

            ProductoInsumo pi = new ProductoInsumo();
            pi.setId(new ProductoInsumoId(idProducto, dto.getIdInsumo()));
            pi.setProducto(producto);
            pi.setInsumo(insumo);
            pi.setCantidadConsumo(dto.getCantidadConsumo());

            nuevasEntradas.add(pi);
        }

        List<ProductoInsumo> guardados = productoInsumoRepository.saveAll(nuevasEntradas);
        return ResponseEntity.ok(guardados);
    }

    public static class RecetaItemDTO {
        private Integer idProducto;
        private Integer idInsumo;
        private BigDecimal cantidadConsumo;

        public Integer getIdProducto() { return idProducto; }
        public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }
        public Integer getIdInsumo() { return idInsumo; }
        public void setIdInsumo(Integer idInsumo) { this.idInsumo = idInsumo; }
        public BigDecimal getCantidadConsumo() { return cantidadConsumo; }
        public void setCantidadConsumo(BigDecimal cantidadConsumo) { this.cantidadConsumo = cantidadConsumo; }
    }
}