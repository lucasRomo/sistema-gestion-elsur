package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.services.TurnoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Cierra a medianoche la caja que quedó abierta. En vez de un horario fijo (que se pierde si
 * el servidor de Render está dormido justo a las 00:00), revisa al arrancar y cada minuto si
 * hay una caja abierta de un día anterior. También se revisa cada vez que alguien consulta el
 * estado de la caja (TurnoService.obtenerTurnoAbiertoHoy).
 */
@Configuration
@EnableScheduling
@Profile("!test")
public class CierreAutomaticoCajaScheduler {

    private static final Logger log = LoggerFactory.getLogger(CierreAutomaticoCajaScheduler.class);

    private final TurnoService turnoService;

    public CierreAutomaticoCajaScheduler(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    @Scheduled(initialDelayString = "PT20S", fixedDelayString = "PT1M")
    public void cerrarCajasVencidas() {
        try {
            int cerradas = turnoService.cerrarTurnosVencidos();
            if (cerradas > 0) {
                log.info("Cierre automático de caja: {} turno(s) de días anteriores cerrado(s).", cerradas);
            }
        } catch (Exception e) {
            log.warn("No se pudo revisar el cierre automático de caja: {}", e.getMessage());
        }
    }
}
