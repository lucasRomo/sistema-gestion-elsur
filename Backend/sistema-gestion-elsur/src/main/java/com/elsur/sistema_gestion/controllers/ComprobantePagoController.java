package com.elsur.sistema_gestion.controllers;

// IMPORTS CRÍTICOS PARA SOLUCIONAR LOS ERRORES DE PATH Y FILES
import java.io.IOException;
import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// IMPORTS PARA MANEJAR ARCHIVOS Y RECURSOS EN SPRING
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.util.StringUtils;

// IMPORTS DE SPRING WEB Y ANOTACIONES
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// IMPORTS DE TU PROPIO SISTEMA
import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.models.ComprobantePago;
import com.elsur.sistema_gestion.repositories.PedidoRepository;
import com.elsur.sistema_gestion.repositories.ComprobantePagoRepository;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class ComprobantePagoController {

    // java.nio.file.Path correcto
    private final Path rootFolder = Paths.get("uploads/comprobantes");

    @Autowired
    private PedidoRepository pedidoRepository;
    
    @Autowired
    private ComprobantePagoRepository comprobanteRepository;

    public ComprobantePagoController() {
        try {
            // Se usa java.nio.file.Files de forma correcta
            if (!Files.exists(rootFolder)) {
                Files.createDirectories(rootFolder);
            }
        } catch (IOException e) {
            throw new RuntimeException("No se pudo inicializar la carpeta de almacenamiento", e);
        }
    }

    @PostMapping("/{id}/comprobante")
    @Transactional
    public ResponseEntity<?> subirComprobante(@PathVariable Integer id, @RequestParam("comprobante") MultipartFile file) {
        try {
            Pedido pedido = pedidoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("El archivo está vacío");
            }

            // Uso correcto de StringUtils de Spring Framework
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = "comprobante-pedido-" + id + "-" + System.currentTimeMillis() + "." + extension;
            
            // Copia física en disco
            Files.copy(file.getInputStream(), this.rootFolder.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

            // URL pública para acceder al archivo
            String urlServidor = "http://localhost:8080/api/pedidos/comprobantes/files/" + filename;

            ComprobantePago nuevoComprobante = new ComprobantePago();
            nuevoComprobante.setPedido(pedido);
            nuevoComprobante.setTipoPago("TRANSFERENCIA"); 
            nuevoComprobante.setMontoPago(BigDecimal.ZERO); 
            nuevoComprobante.setUrlArchivoComprobante(urlServidor);
            nuevoComprobante.setFechaCarga(LocalDateTime.now());

            comprobanteRepository.save(nuevoComprobante);

            return ResponseEntity.ok(Map.of("url", urlServidor));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al guardar: " + e.getMessage());
        }
    }

    @GetMapping("/comprobantes/files/{filename:.+}")
    public ResponseEntity<Resource> obtenerArchivo(@PathVariable String filename) {
        try {
            Path file = rootFolder.resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType != null ? contentType : "application/octet-stream")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}/comprobante")
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
                Path fileToDelete = rootFolder.resolve(filename);
                
                // Eliminación física del archivo en el servidor
                Files.deleteIfExists(fileToDelete);
                // Eliminación del registro en Postgres
                comprobanteRepository.delete(cp);
            }

            return ResponseEntity.ok(Map.of("mensaje", "Eliminado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al eliminar: " + e.getMessage());
        }
    }
}