package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "MovimientoCaja")
public class MovimientoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_movimiento;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fecha;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(length = 20, nullable = false)
    private String tipoMovimiento; // 'INGRESO', 'EGRESO'

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_pedido", nullable = true)
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "id_turno", nullable = true)
    private Turno turno;
}