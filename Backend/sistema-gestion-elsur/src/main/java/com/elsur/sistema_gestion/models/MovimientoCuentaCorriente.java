package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_cuenta_corriente")
@Data
public class MovimientoCuentaCorriente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Integer idMovimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    @JsonIgnoreProperties({"persona", "categoriaCliente"})
    private Cliente cliente;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    private String tipo; // "CARGO" o "PAGO"

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(length = 255)
    private String descripcion;

    @Column(name = "metodo_pago", length = 30)
    private String metodoPago = "EFECTIVO";

    @Column(name = "comprobante_imagen", columnDefinition = "TEXT")
    private String comprobanteImagen;
}