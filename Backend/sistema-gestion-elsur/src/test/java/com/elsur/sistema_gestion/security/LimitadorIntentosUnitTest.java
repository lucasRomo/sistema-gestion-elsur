package com.elsur.sistema_gestion.security;

import com.elsur.sistema_gestion.exceptions.DemasiadosIntentosException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LimitadorIntentosUnitTest {

    private final LimitadorIntentos limitador = new LimitadorIntentos();

    @Test
    @DisplayName("Con menos fallos que el máximo se puede seguir intentando")
    void pocosFallos_noBloquea() {
        for (int i = 0; i < LimitadorIntentos.MAX_FALLOS - 1; i++) limitador.registrarFallo("login:juan");
        assertDoesNotThrow(() -> limitador.verificar("login:juan"));
    }

    @Test
    @DisplayName("Al llegar al máximo de fallos bloquea esa clave, sin afectar a otras")
    void maximoFallos_bloquea() {
        for (int i = 0; i < LimitadorIntentos.MAX_FALLOS; i++) limitador.registrarFallo("login:juan");
        assertThrows(DemasiadosIntentosException.class, () -> limitador.verificar("login:JUAN "));
        assertDoesNotThrow(() -> limitador.verificar("login:maria"));
    }

    @Test
    @DisplayName("Un acierto reinicia el contador de fallos")
    void exito_reiniciaContador() {
        for (int i = 0; i < LimitadorIntentos.MAX_FALLOS - 1; i++) limitador.registrarFallo("login:juan");
        limitador.registrarExito("login:juan");
        limitador.registrarFallo("login:juan");
        assertDoesNotThrow(() -> limitador.verificar("login:juan"));
    }
}
