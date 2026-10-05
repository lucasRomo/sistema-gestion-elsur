package com.elsur.sistema_gestion.security;

import com.elsur.sistema_gestion.exceptions.DemasiadosIntentosException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Frena la prueba de contraseñas por fuerza bruta en los dos endpoints públicos (login y clave
 * de acceso). Con el sistema publicado en internet, cualquiera podía probar miles de claves
 * seguidas sin ninguna demora.
 *
 * Tras {@value #MAX_FALLOS} fallos dentro de la ventana, esa clave (usuario o IP) queda bloqueada
 * unos minutos. Un acierto limpia el contador. Se guarda en memoria: alcanza para una sola
 * instancia del backend y se reinicia si el servidor se reinicia.
 */
@Component
public class LimitadorIntentos {

    static final int MAX_FALLOS = 5;
    private static final Duration VENTANA = Duration.ofMinutes(15);
    private static final Duration BLOQUEO = Duration.ofMinutes(5);

    private record Registro(int fallos, Instant desde, Instant bloqueadoHasta) {}

    private final Map<String, Registro> registros = new ConcurrentHashMap<>();

    public void verificar(String clave) {
        Registro r = registros.get(normalizar(clave));
        if (r != null && r.bloqueadoHasta() != null && Instant.now().isBefore(r.bloqueadoHasta())) {
            throw new DemasiadosIntentosException(
                    "Demasiados intentos fallidos. Por seguridad, esperá unos minutos antes de volver a intentar.");
        }
    }

    public void registrarFallo(String clave) {
        Instant ahora = Instant.now();
        registros.compute(normalizar(clave), (k, r) -> {
            if (r == null || r.desde().plus(VENTANA).isBefore(ahora)
                    || (r.bloqueadoHasta() != null && ahora.isAfter(r.bloqueadoHasta()))) {
                return new Registro(1, ahora, null);
            }
            int fallos = r.fallos() + 1;
            return new Registro(fallos, r.desde(), fallos >= MAX_FALLOS ? ahora.plus(BLOQUEO) : null);
        });
        // Evita que el mapa crezca sin límite si alguien prueba miles de usuarios distintos.
        if (registros.size() > 10_000) {
            registros.entrySet().removeIf(e -> e.getValue().desde().plus(VENTANA).isBefore(ahora));
        }
    }

    public void registrarExito(String clave) {
        registros.remove(normalizar(clave));
    }

    private String normalizar(String clave) {
        return clave == null ? "" : clave.trim().toLowerCase();
    }
}
