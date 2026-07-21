package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import org.hibernate.annotations.ColumnDefault;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

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
    @JsonProperty("cliente")
    private Cliente cliente;

    
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("pedido")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<DetallePedido> detalles;

    @Column(nullable = false, updatable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private LocalDateTime fecha_creacion = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime fecha_entrega_estimada;

    @Column
    private LocalDateTime fecha_finalizacion;

    @Column(length = 45, nullable = false)
    @ColumnDefault("'PENDIENTE'") // Formato correcto de string default para Postgres
    private String estado = "PENDIENTE";

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto_total;

    @Column(precision = 10, scale = 2, nullable = false)
    @ColumnDefault("0.00") // Formato correcto numérico default para Postgres
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
    @JsonProperty("asignaciones") // Esto permitirá que el JSON traiga la lista
    private List<AsignacionPedido> asignaciones;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("pedido")
    @JsonProperty("comprobantes")
    private List<ComprobantePago> comprobantes;

    // ➔ NUEVA RELACIÓN AGREGADA: Mapeo bidireccional con el historial
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("pedido") 
    @JsonProperty("historiales")    
    private List<HistorialEstadoPedido> historiales;

    
}