package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "Turno")
@Data
public class Turno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_turno")
    private Integer idTurno;

    @ManyToOne
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    
    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "monto_inicial", nullable = false)
    private Double montoInicial;

    @Column(name = "monto_esperado_sistema")
    private Double montoEsperadoSistema;

    @Column(name = "monto_real_contado")
    private Double montoRealContado;

    @Column(name = "diferencia_arqueo")
    private Double diferenciaArqueo;

    @Column(name = "estado", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EstadoTurno estado;
}