package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface IncidenciaService {
    Incidencia registrarFalla(Integer idMaquina, String descripcion, String prioridad, Integer idEmpleadoReporta);
    Incidencia ponerEnMantenimiento(Integer idIncidencia, String notaMantenimiento, Integer idEmpleadoMantenimiento);
    Incidencia resolverIncidencia(Integer idIncidencia, String resolucion, Integer idEmpleadoResuelve);
    MovimientoCaja registrarPagoMantenimiento(Integer idIncidencia, BigDecimal monto, String metodoPago, String descripcion, Integer idUsuario, boolean forzarSaldoInsuficiente, MultipartFile comprobante);
    List<Incidencia> obtenerPorMaquina(Integer idMaquina);
    List<Incidencia> listarTodas();
}