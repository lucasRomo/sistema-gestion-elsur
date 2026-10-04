package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.RespaldoLog;
import com.elsur.sistema_gestion.services.RespaldoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RespaldoAutomaticoSchedulerUnitTest {

    @Mock private RespaldoService respaldoService;
    @Mock private TransactionTemplate transactionTemplate;

    private RespaldoAutomaticoScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new RespaldoAutomaticoScheduler(respaldoService, transactionTemplate);
        doAnswer(inv -> {
            Consumer<TransactionStatus> accion = inv.getArgument(0);
            accion.accept(null);
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    private RespaldoLog respaldo(int id, int diasAtras, String usuario) {
        return new RespaldoLog(LocalDateTime.now().minusDays(diasAtras), "r" + id + ".json", "1 KB", usuario, "Contingencia Local") {
            @Override public Integer getIdRespaldo() { return id; }
        };
    }

    @Test
    @DisplayName("Si hay un respaldo de hace menos de 7 días, no genera otro")
    void respaldoReciente_noGenera() {
        when(respaldoService.obtenerHistorial()).thenReturn(List.of(respaldo(1, 2, "admin")));

        scheduler.generarSiCorresponde();

        verify(respaldoService, never()).generarRespaldoContingente(any());
    }

    @Test
    @DisplayName("Sin respaldos en 7 días genera uno y conserva solo los últimos 4 automáticos")
    void respaldoViejo_generaYLimpia() {
        List<RespaldoLog> historial = new ArrayList<>();
        historial.add(respaldo(1, 8, "admin"));
        when(respaldoService.obtenerHistorial()).thenReturn(historial);

        List<RespaldoLog> despues = new ArrayList<>();
        for (int i = 10; i < 16; i++) despues.add(respaldo(i, i, RespaldoAutomaticoScheduler.USUARIO_AUTOMATICO));
        when(respaldoService.generarRespaldoContingente(RespaldoAutomaticoScheduler.USUARIO_AUTOMATICO)).thenAnswer(inv -> {
            when(respaldoService.obtenerHistorial()).thenReturn(despues);
            return new byte[0];
        });

        scheduler.generarSiCorresponde();

        verify(respaldoService).generarRespaldoContingente(RespaldoAutomaticoScheduler.USUARIO_AUTOMATICO);
        verify(respaldoService).eliminarRespaldo(14);
        verify(respaldoService).eliminarRespaldo(15);
        verify(respaldoService, never()).eliminarRespaldo(13);
    }
}
