package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "respaldos_log")
public class RespaldoLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRespaldo;

    private LocalDateTime fechaHora;
    private String nombreArchivo;
    private String tamanio;
    private String usuarioOperador;
    private String tipo; // "Manual" o "Contingencia"

    public RespaldoLog() {}

    public RespaldoLog(LocalDateTime fechaHora, String nombreArchivo, String tamanio, String usuarioOperador, String tipo) {
        this.fechaHora = fechaHora;
        this.nombreArchivo = nombreArchivo;
        this.tamanio = tamanio;
        this.usuarioOperador = usuarioOperador;
        this.tipo = tipo;
    }

    // Getters y Setters
    public Integer getIdRespaldo() { return idRespaldo; }
    public void setIdRespaldo(Integer idRespaldo) { this.idRespaldo = idRespaldo; }

    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }

    public String getNombreArchivo() { return nombreArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }

    public String getTamanio() { return tamanio; }
    public void setTamanio(String tamanio) { this.tamanio = tamanio; }

    public String getUsuarioOperador() { return usuarioOperador; }
    public void setUsuarioOperador(String usuarioOperador) { this.usuarioOperador = usuarioOperador; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
}