package com.elsur.sistema_gestion.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Punto único donde se traduce cada excepción de negocio a una respuesta HTTP.
 * Gracias a esto los controllers dejan de necesitar try/catch: simplemente
 * lanzan la excepción que corresponda (o dejan pasar una RuntimeException de un
 * service) y acá se arma siempre el mismo JSON de error (ver ApiError).
 *
 * Spring elige automáticamente el @ExceptionHandler más específico para cada
 * excepción, así que el orden de los métodos en este archivo no importa.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiError> handleRecursoNoEncontrado(RecursoNoEncontradoException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(RecursoDuplicadoException.class)
    public ResponseEntity<ApiError> handleRecursoDuplicado(RecursoDuplicadoException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler(ConflictoDeIntegridadException.class)
    public ResponseEntity<ApiError> handleConflictoDeIntegridad(ConflictoDeIntegridadException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ApiError> handleCredencialesInvalidas(CredencialesInvalidasException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(CuentaNoHabilitadaException.class)
    public ResponseEntity<ApiError> handleCuentaNoHabilitada(CuentaNoHabilitadaException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    public ResponseEntity<ApiError> handleSolicitudInvalida(SolicitudInvalidaException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // Falla una anotación de bean validation (@NotBlank, @Size, etc.) en un
    // @RequestBody marcado con @Valid -- por ejemplo, CambioPasswordDTO. Sin este
    // handler, esta excepción (que no es una RuntimeException) caía en el catch-all
    // de más abajo y devolvía 500 en vez de 400.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidacion(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return construirRespuesta(HttpStatus.BAD_REQUEST, mensaje.isEmpty() ? "Datos inválidos" : mensaje, request);
    }

    // NUEVO (surge al incorporar AuthenticationManager/UserDetailsServiceImpl en el
    // login, ver UsuarioController.login()): AuthenticationException es la excepción
    // que tira Spring Security cuando authenticate() falla (usuario inexistente,
    // password que no matchea, etc. -- todo colapsado por Spring en un
    // BadCredentialsException genérico, sin distinguir el caso, mismo criterio
    // anti-enumeración que ya usábamos a mano). Hoy UsuarioController.login() ya la
    // atrapa y la convierte en CredencialesInvalidasException antes de que llegue
    // hasta acá, así que este handler es una red de contención: si en el futuro se
    // agrega otro punto de entrada que llame a authenticationManager.authenticate()
    // sin ese try/catch, igual cae en un 401 prolijo en vez de en el catch-all de
    // RuntimeException de más abajo (que la devolvería como 400).
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas", request);
    }

    // Cubre un AccessDeniedException lanzado "a mano" desde un service (por ejemplo,
    // una regla de "esto solo lo puede hacer el dueño del recurso"). El caso de
    // MatrizSeguridadValidator negando una ruta ya lo resuelve JwtAccessDeniedHandler
    // antes de llegar acá; este handler es una red de contención adicional.
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccesoDenegado(AccessDeniedException ex, HttpServletRequest request) {
        return construirRespuesta(HttpStatus.FORBIDDEN, "No tiene permisos para realizar esta operación", request);
    }

    // Red de contención para el resto de los controllers del proyecto que todavía
    // usan "throw new RuntimeException(mensaje)" como excepción de negocio (por
    // ejemplo, varias validaciones de PedidoServiceImpl). Se loguea porque antes
    // varios controllers hacían e.printStackTrace() a mano en cada catch; ahora
    // ese log queda centralizado acá.
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        log.warn("RuntimeException no tipada en {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        return construirRespuesta(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // Cualquier otra cosa no prevista: no se expone el detalle interno (stack trace,
    // mensaje de una librería, etc.), solo un mensaje genérico. Sí se loguea completo
    // en el servidor para poder diagnosticarlo.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleErrorInesperado(Exception ex, HttpServletRequest request) {
        log.error("Error inesperado en {} {}", request.getMethod(), request.getRequestURI(), ex);
        return construirRespuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado", request);
    }

    private ResponseEntity<ApiError> construirRespuesta(HttpStatus status, String mensaje, HttpServletRequest request) {
        ApiError body = new ApiError(status.value(), status.getReasonPhrase(), mensaje, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
