package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.RespaldoLog;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RespaldoService {
    byte[] generarRespaldoContingente(String usuarioOperador);
    List<RespaldoLog> obtenerHistorial();
    void eliminarRespaldo(Integer idRespaldo);
    byte[] descargarRespaldoPorId(Integer idRespaldo);
    void restaurarRespaldo(MultipartFile archivo);
}