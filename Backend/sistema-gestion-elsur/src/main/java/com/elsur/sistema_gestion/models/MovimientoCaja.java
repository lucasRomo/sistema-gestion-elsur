package com.elsur.sistema_gestion.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "movimientos_caja")
public class MovimientoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_movimiento;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(length = 20, nullable = false)
    private String tipoMovimiento; // 'INGRESO', 'EGRESO'

    @Column(length = 50)
    private String categoria; // 'EGRESO_MANTENIMIENTO', 'INSUMOS', 'VENTA', 'VARIOS'

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_pedido", nullable = true)
    @JsonIgnoreProperties("movimientos")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "id_incidencia", nullable = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Incidencia incidencia;

    @ManyToOne
    @JoinColumn(name = "id_turno", nullable = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Turno turno;

    @Column(length = 20, nullable = true) 
    private String metodoPago; // 'EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'

    @Column(name = "comprobante_imagen", columnDefinition = "TEXT")
    private String comprobanteImagen;
}