package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "HistorialEstadoPedido")
public class HistorialEstadoPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_historial;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fecha_cambio;

    @Column(length = 45, nullable = false)
    private String estado_anterior;

    @Column(length = 45, nullable = false)
    private String estado_nuevo;

    @ManyToOne
    @JoinColumn(name = "id_pedido", nullable = false)
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "id_usuario_responsable", nullable = false)
    private Usuario usuarioResponsable;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne
    @JoinColumn(name = "id_incidencia_asociada")
    private Incidencia incidenciaAsociada;
}