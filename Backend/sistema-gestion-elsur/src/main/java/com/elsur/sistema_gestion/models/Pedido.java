package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import org.hibernate.annotations.ColumnDefault;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    @JsonProperty("cliente")
    private Cliente cliente;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JsonIgnoreProperties("pedido")
    @JsonProperty("detalles")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<DetallePedido> detalles = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha_creacion = LocalDateTime.now();

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha_entrega_estimada;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha_finalizacion;

    @Column(length = 45, nullable = false)
    @ColumnDefault("'PENDIENTE'")
    private String estado = "PENDIENTE";

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto_total;

    @Column(precision = 10, scale = 2, nullable = false)
    @ColumnDefault("0.00")
    private BigDecimal monto_pago_adelantado = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(length = 20)
    private String ubicacion_estante;

    @Column(nullable = false)
    private boolean es_cuenta_corriente = false;

    @Column(nullable = false)
    private boolean es_presupuesto = false;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("pedido")
    @JsonProperty("asignaciones")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<AsignacionPedido> asignaciones;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("pedido")
    @JsonProperty("comprobantes")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<ComprobantePago> comprobantes;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("pedido") 
    @JsonProperty("historiales")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<HistorialEstadoPedido> historiales;

    // Relación vinculada con los movimientos de caja (Tickets generados para el pedido)
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("pedido")
    @JsonProperty("movimientos")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<MovimientoCaja> movimientos;
}