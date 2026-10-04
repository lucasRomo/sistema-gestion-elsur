package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.RespaldoLog;
import com.elsur.sistema_gestion.services.RespaldoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Respaldo automático semanal. Antes dependía de que el administrador viera el aviso de los
 * viernes y lo generara a mano: si nadie lo hacía, no había respaldo.
 *
 * En vez de un horario fijo (que se pierde si el servidor de Render está dormido justo en ese
 * momento), revisa al arrancar y cada 6 horas si pasaron 7 días desde el último respaldo
 * (manual o automático) y, si es así, genera uno. Conserva solo los últimos automáticos.
 */
@Configuration
@EnableScheduling
@Profile("!test")
public class RespaldoAutomaticoScheduler {

    static final String USUARIO_AUTOMATICO = "Respaldo automático";
    private static final int DIAS_ENTRE_RESPALDOS = 7;
    private static final int AUTOMATICOS_A_CONSERVAR = 4;

    private static final Logger log = LoggerFactory.getLogger(RespaldoAutomaticoScheduler.class);

    private final RespaldoService respaldoService;
    private final TransactionTemplate transactionTemplate;

    public RespaldoAutomaticoScheduler(RespaldoService respaldoService, TransactionTemplate transactionTemplate) {
        this.respaldoService = respaldoService;
        this.transactionTemplate = transactionTemplate;
    }

    @Scheduled(initialDelayString = "PT2M", fixedDelayString = "PT6H")
    public void generarSiCorresponde() {
        try {
            List<RespaldoLog> historial = respaldoService.obtenerHistorial();
            LocalDateTime ultimo = historial.isEmpty() ? null : historial.get(0).getFechaHora();
            if (ultimo != null && ultimo.isAfter(LocalDateTime.now().minusDays(DIAS_ENTRE_RESPALDOS))) {
                return;
            }

            // El respaldo recorre todas las entidades con relaciones LAZY: necesita una
            // transacción abierta (fuera de un request HTTP no hay "open in view").
            transactionTemplate.executeWithoutResult(estado -> respaldoService.generarRespaldoContingente(USUARIO_AUTOMATICO));
            log.info("Respaldo automático semanal generado.");

            limpiarAutomaticosViejos();
        } catch (Exception e) {
            // Nunca tirar abajo el backend por esto: se reintenta en el próximo ciclo.
            log.warn("No se pudo generar el respaldo automático: {}", e.getMessage());
        }
    }

    private void limpiarAutomaticosViejos() {
        List<RespaldoLog> automaticos = respaldoService.obtenerHistorial().stream()
                .filter(r -> USUARIO_AUTOMATICO.equals(r.getUsuarioOperador()))
                .toList();
        automaticos.stream()
                .skip(AUTOMATICOS_A_CONSERVAR)
                .forEach(r -> respaldoService.eliminarRespaldo(r.getIdRespaldo()));
    }
}
