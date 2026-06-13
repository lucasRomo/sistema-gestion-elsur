package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "Pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_pedido;

    @ManyToOne
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles; // Asegúrate de que este es el nombre del atributo en DetallePedido

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fecha_creacion;

    @Column(nullable = false)
    private LocalDateTime fecha_entrega_estimada;

    @Column
    private LocalDateTime fecha_finalizacion;

    @Column(length = 45, nullable = false, columnDefinition = "VARCHAR(45) DEFAULT 'PENDIENTE'")
    private String estado = "PENDIENTE";

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto_total;

    @Column(precision = 10, scale = 2, nullable = false, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private BigDecimal monto_pago_adelantado = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String observaciones; // Este es el texto que no se puede iterar

    @Column(length = 20)
    private String ubicacion_estante;

    @Column
    private boolean es_cuenta_corriente = false;

    @Column
    private boolean es_presupuesto = false;
}