package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.util.StringUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.models.ComprobantePago;
import com.elsur.sistema_gestion.repositories.PedidoRepository;
import com.elsur.sistema_gestion.repositories.ComprobantePagoRepository;
import com.elsur.sistema_gestion.services.SupabaseStorageService;

@RestController
@RequestMapping("/api/pedidos")
public class ComprobantePagoController {

    // Antes este comprobante "físico" se guardaba en un disco local (uploads/comprobantes) con
    // una URL hardcodeada a localhost:8080. En Render el disco es efímero -- el archivo se pierde
    // en cada redeploy o cuando el servicio se reinicia -- así que aunque el link apuntara bien,
    // el archivo detrás iba a desaparecer solo. Ahora usa el mismo Supabase Storage (bucket
    // "comprobantes") que ya usa el flujo de comprobante digital en PedidoController, y se guarda
    // solo el nombre de archivo (no una URL completa) en urlArchivoComprobante -- así el frontend
    // lo descarga con el mismo helper (descargarArchivoProtegido) que ya usa para los digitales,
    // pegándole a GET /api/pedidos/comprobantes/archivo/{nombreArchivo} de PedidoController.
    private static final String BUCKET = "comprobantes";

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ComprobantePagoRepository comprobanteRepository;

    @Autowired
    private SupabaseStorageService supabaseStorageService;

    @PostMapping("/{id}/comprobante-fisico")
    @Transactional
    public ResponseEntity<?> subirComprobante(@PathVariable Integer id, @RequestParam("archivo") MultipartFile file) {
        try {
            Pedido pedido = pedidoRepository.findById(id)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("El archivo está vacío");
            }

            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = "comprobante-pedido-" + id + "-" + System.currentTimeMillis()
                    + (extension != null && !extension.isBlank() ? "." + extension : "");

            String contentType = StringUtils.hasText(file.getContentType())
                    ? file.getContentType() : "application/octet-stream";

            supabaseStorageService.subirBytes(file.getBytes(), filename, contentType, BUCKET);

            ComprobantePago nuevoComprobante = new ComprobantePago();
            nuevoComprobante.setPedido(pedido);
            nuevoComprobante.setTipoPago("TRANSFERENCIA");
            nuevoComprobante.setMontoPago(BigDecimal.ZERO);
            nuevoComprobante.setUrlArchivoComprobante(filename);
            nuevoComprobante.setFechaCarga(LocalDateTime.now());

            comprobanteRepository.save(nuevoComprobante);

            return ResponseEntity.ok(Map.of("url", filename));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al guardar: " + e.getMessage());
        }
    }

    // Se mantiene esta ruta por compatibilidad con comprobantes que ya hayan quedado guardados
    // con el formato de URL viejo (http://localhost:8080/api/pedidos/comprobantes/files/...):
    // igual que antes se extrae el nombre de archivo del final de la URL guardada, pero ahora se
    // busca ese archivo en Supabase en vez de en disco. Para comprobantes nuevos, el frontend ya
    // usa GET /api/pedidos/comprobantes/archivo/{nombreArchivo} (en PedidoController).
    @GetMapping("/comprobantes/files/{filename:.+}")
    public ResponseEntity<byte[]> obtenerArchivo(@PathVariable String filename) {
        try {
            byte[] datos = supabaseStorageService.descargarArchivo(BUCKET, filename);
            String contentType = supabaseStorageService.detectarContentType(filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(datos);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/comprobante-fisico")
    @Transactional
    public ResponseEntity<?> eliminarComprobante(@PathVariable Integer id) {
        try {
            List<ComprobantePago> lista = comprobanteRepository.findByPedidoId(id);
            if (lista.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            for (ComprobantePago cp : lista) {
                String url = cp.getUrlArchivoComprobante();
                String filename = url.substring(url.lastIndexOf("/") + 1);

                try {
                    supabaseStorageService.eliminarArchivo(BUCKET, filename);
                } catch (Exception e) {
                    System.err.println("No se pudo eliminar el archivo de Supabase Storage: " + e.getMessage());
                }

                comprobanteRepository.delete(cp);
            }

            return ResponseEntity.ok(Map.of("mensaje", "Eliminado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al eliminar: " + e.getMessage());
        }
    }
}
