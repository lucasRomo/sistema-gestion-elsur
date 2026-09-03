package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.AntPathMatcher;

import java.text.Normalizer;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Component
public class MatrizSeguridadValidator implements AuthorizationManager<RequestAuthorizationContext> {

    private final UsuarioRepository usuarioRepository;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public MatrizSeguridadValidator(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorizationDecision authorize(Supplier<? extends Authentication> authenticationSupplier, RequestAuthorizationContext context) {
        Authentication auth = authenticationSupplier.get();
        HttpServletRequest request = context.getRequest();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return new AuthorizationDecision(false);
        }

        String username = auth.getName();
        
        // Obtener la ruta limpia descartando Context Path
        String path = request.getServletPath();
        if (path == null || path.isEmpty()) {
            path = request.getRequestURI();
        }
        
        // Normalizar trailing slash
        if (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }

        String metodo = request.getMethod();

        boolean permitido = evaluarPermisoEnBaseDeDatos(username, path, metodo);

        return new AuthorizationDecision(permitido);
    }

    private boolean evaluarPermisoEnBaseDeDatos(String username, String path, String metodo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreUsuario(username);
        if (usuarioOpt.isEmpty() || usuarioOpt.get().getRol() == null) {
            return false;
        }

        Usuario usuario = usuarioOpt.get();

        // 1. Acceso total para ROL ADMIN
        if ("ADMIN".equalsIgnoreCase(usuario.getRol().getNombreRol())) {
            return true;
        }

        // Extracción de permisos normalizados (sin tildes, mayúsculas y sin espacios extra)
        Set<String> permisosUsuario = usuario.getRol().getPermisos() != null
                ? usuario.getRol().getPermisos().stream()
                    .map(p -> normalizar(p.getNombrePermiso()))
                    .collect(Collectors.toSet())
                : Collections.emptySet();

        // 2. Reglas para Mermas e Inteligencia Artificial (OCR)
        if (pathMatcher.match("/api/mermas/**", path)) {
            if (tieneAlgunPermiso(permisosUsuario, "INSUMOS", "PRODUCTOS", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        if (pathMatcher.match("/api/ia/**", path)) {
            if (tieneAlgunPermiso(permisosUsuario, "COMPRA DE INSUMOS", "INSUMOS", "CREAR PEDIDO")) {
                return true;
            }
        }

        // 3. Reglas para Módulo de Pedidos y Comprobantes
        if (pathMatcher.match("/api/pedidos/**", path) || pathMatcher.match("/api/comprobantes/**", path)) {
            if ("POST".equalsIgnoreCase(metodo) && pathMatcher.match("/api/pedidos", path)) {
                return permisosUsuario.contains(normalizar("CREAR PEDIDO"));
            }

            if (("GET".equalsIgnoreCase(metodo) || "PUT".equalsIgnoreCase(metodo)) &&
                tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        // Detalle de Pedido: las líneas se cargan junto con el pedido -> mismo permiso que crearlo
        if (pathMatcher.match("/api/detalles-pedidos/**", path)) {
            if ("POST".equalsIgnoreCase(metodo)) {
                return permisosUsuario.contains(normalizar("CREAR PEDIDO"));
            }
            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        // Historial de Estados de Pedido: seguimiento del ciclo de vida del pedido
        if (pathMatcher.match("/api/historiales-estado/**", path)) {
            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        // 4. Reglas de Lectura Cruzada (GET)
        if ("GET".equalsIgnoreCase(metodo)) {

            // Habilitación de lectura para MATRIZ DE PERMISOS (necesita listar usuarios en la barra lateral)
            if (permisosUsuario.contains(normalizar("MATRIZ DE PERMISOS"))) {
                if (pathMatcher.match("/api/permisos/**", path) || 
                    pathMatcher.match("/api/usuarios/**", path)) {
                    return true;
                }
            }

            if (permisosUsuario.contains(normalizar("INFORMES"))) {
                if (esRutaDeInformes(path)) {
                    return true;
                }
            }

            if (tieneAlgunPermiso(permisosUsuario, "CLIENTES", "PROVEEDORES", "GESTION DE USUARIOS")) {
                if (pathMatcher.match("/api/tipos-documento/**", path)) {
                    return true;
                }
            }

            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA")) {
                if (esRutaCatalogoVentasYCaja(path)) {
                    return true;
                }
            }

            if (permisosUsuario.contains(normalizar("REPOSITORIO DIGITAL"))) {
                if (pathMatcher.match("/api/productos/**", path) ||
                    pathMatcher.match("/api/producto-insumo/**", path) ||
                    pathMatcher.match("/api/insumos/**", path)) {
                    return true;
                }
            }

            if (permisosUsuario.contains(normalizar("PRODUCTOS"))) {
                if (pathMatcher.match("/api/insumos/**", path) ||
                    pathMatcher.match("/api/unidades-medida/**", path) ||
                    pathMatcher.match("/api/maquinas/**", path) ||
                    pathMatcher.match("/api/equipos/**", path)) {
                    return true;
                }
            }

            if (tieneAlgunPermiso(permisosUsuario, "INSUMOS", "COMPRA DE INSUMOS")) {
                if (pathMatcher.match("/api/proveedores/**", path) ||
                    pathMatcher.match("/api/tipos-proveedor/**", path) ||
                    pathMatcher.match("/api/insumos/**", path) ||
                    pathMatcher.match("/api/unidades-medida/**", path) ||
                    pathMatcher.match("/api/productos/**", path) ||
                    pathMatcher.match("/api/producto-insumo/**", path) ||
                    pathMatcher.match("/api/compras-proveedor/**", path) ||
                    pathMatcher.match("/api/detalles-compra-insumo/**", path)) {
                    return true;
                }
            }
        }

        // 5. Reglas de Escritura Cruzada y Auto-Gestión de Perfil (POST / PUT / DELETE)

        // Permitir a cualquier usuario autenticado actualizar sus propias credenciales (Ajustes de Perfil)
        if ("PUT".equalsIgnoreCase(metodo) && (
            pathMatcher.match("/api/usuarios/*/password", path) ||
            pathMatcher.match("/api/usuarios/*/username", path) ||
            pathMatcher.match("/api/usuarios/*/email", path)
        )) {
            return true;
        }

        // Habilitación de escritura para MATRIZ DE PERMISOS (re-asignar rol de un usuario desde la Matriz)
        if (permisosUsuario.contains(normalizar("MATRIZ DE PERMISOS"))) {
            if ("PUT".equalsIgnoreCase(metodo) && pathMatcher.match("/api/usuarios/*", path)) {
                return true;
            }
        }

        // Movimientos de Caja desde Ventas y Cobros
        if (("POST".equalsIgnoreCase(metodo) || "PUT".equalsIgnoreCase(metodo)) &&
            (pathMatcher.match("/api/movimientos-caja/**", path) || pathMatcher.match("/api/caja/**", path))) {
            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA")) {
                return true;
            }
        }

        // Límite de Crédito
        if ("PUT".equalsIgnoreCase(metodo) && pathMatcher.match("/api/clientes/*/limite-credito", path)) {
            if (tieneAlgunPermiso(permisosUsuario, "HISTORIAL DE PEDIDOS", "PEDIDOS PENDIENTES", "CLIENTES", "CAJA")) {
                return true;
            }
        }

        // Pagos e Imputaciones en Cuenta Corriente
        if ("POST".equalsIgnoreCase(metodo) && 
            (pathMatcher.match("/api/cuentas-corrientes/**", path) || pathMatcher.match("/api/clientes/**", path))) {
            if (tieneAlgunPermiso(permisosUsuario, "HISTORIAL DE PEDIDOS", "PEDIDOS PENDIENTES", "CLIENTES", "CAJA")) {
                return true;
            }
        }

        // 6. Evaluador por Módulo Directo
        String permisoRequerido = mapearRutaAPermiso(path);
        if (permisoRequerido == null) {
            return false;
        }

        return permisosUsuario.contains(normalizar(permisoRequerido));
    }

    private boolean tieneAlgunPermiso(Set<String> permisosUsuario, String... permisos) {
        for (String p : permisos) {
            if (permisosUsuario.contains(normalizar(p))) {
                return true;
            }
        }
        return false;
    }

    private boolean esRutaDeInformes(String path) {
        return pathMatcher.match("/api/informes/**", path) ||
               pathMatcher.match("/api/reportes/**", path) ||
               pathMatcher.match("/api/pedidos/**", path) ||
               pathMatcher.match("/api/caja/**", path) ||
               pathMatcher.match("/api/movimientos-caja/**", path) ||
               pathMatcher.match("/api/mermas/**", path) ||
               pathMatcher.match("/api/cuentas-corrientes/**", path) ||
               pathMatcher.match("/api/turnos/**", path) ||
               pathMatcher.match("/api/arqueos/**", path) ||
               pathMatcher.match("/api/incidencias/**", path) ||
               pathMatcher.match("/api/categorias-cliente/**", path) ||
               pathMatcher.match("/api/productos/**", path) ||
               pathMatcher.match("/api/comprobantes/**", path) ||
               pathMatcher.match("/api/registro-actividad/**", path) ||
               pathMatcher.match("/api/historial-actividad/**", path) ||
               pathMatcher.match("/api/auditoria/**", path);
    }

    private boolean esRutaCatalogoVentasYCaja(String path) {
        return pathMatcher.match("/api/clientes/**", path) ||
               pathMatcher.match("/api/categorias-cliente/**", path) ||
               pathMatcher.match("/api/cuentas-corrientes/**", path) ||
               pathMatcher.match("/api/empleados/**", path) ||
               pathMatcher.match("/api/turnos/**", path) ||
               pathMatcher.match("/api/productos/**", path) ||
               pathMatcher.match("/api/producto-insumo/**", path) ||
               pathMatcher.match("/api/maquinas/**", path) ||
               pathMatcher.match("/api/equipos/**", path);
    }

    private String mapearRutaAPermiso(String path) {
        // Módulo Matriz de Permisos
        if (pathMatcher.match("/api/permisos/**", path) ||
            pathMatcher.match("/api/matriz-permisos/**", path)) {
            return "Matriz de Permisos";
        }

        // Módulo Clientes
        if (pathMatcher.match("/api/clientes/**", path) || 
            pathMatcher.match("/api/categorias-cliente/**", path) || 
            pathMatcher.match("/api/cuentas-corrientes/**", path)) {
            return "Clientes";
        }

        // Módulo Insumos
        if (pathMatcher.match("/api/insumos/**", path) || 
            pathMatcher.match("/api/unidades-medida/**", path)) {
            return "Insumos";
        }

        // Módulo Productos
        if (pathMatcher.match("/api/productos/**", path) || 
            pathMatcher.match("/api/producto-insumo/**", path) || 
            pathMatcher.match("/api/categorias/**", path)) { 
            return "Productos";
        }

        // Módulo Proveedores
        if (pathMatcher.match("/api/proveedores/**", path) || 
            pathMatcher.match("/api/tipos-proveedor/**", path)) {
            return "Proveedores";
        }
        
        // Módulo Gestión de Usuarios y Empleados
        if (pathMatcher.match("/api/usuarios/**", path) || 
            pathMatcher.match("/api/tipos-documento/**", path)) {
            return "Gestión de Usuarios";
        }

        // Módulo Equipos / Máquinas e Incidencias 
        if (pathMatcher.match("/api/equipos/**", path) || 
            pathMatcher.match("/api/maquinas/**", path) || 
            pathMatcher.match("/api/incidencias/**", path)) {
            return "Equipos / Máquinas";
        }
        
        // Ventas y Pedidos
        if (pathMatcher.match("/api/pedidos/historial/**", path)) return "Historial de Pedidos";
        if (pathMatcher.match("/api/pedidos/pendientes/**", path) || pathMatcher.match("/api/pedidos/*/**", path)) return "Pedidos Pendientes";
        if (pathMatcher.match("/api/pedidos/**", path)) return "Crear Pedido";
        if (pathMatcher.match("/api/comprobantes/**", path)) return "Pedidos Pendientes";
        
        // Compras de Insumos (incluye Compras a Proveedores y sus Detalles, mismo módulo)
        if (pathMatcher.match("/api/compras-insumos/**", path) ||
            pathMatcher.match("/api/compras/**", path) ||
            pathMatcher.match("/api/compras-proveedor/**", path) ||
            pathMatcher.match("/api/detalles-compra-insumo/**", path)) {
            return "Compra de Insumos";
        }

        // Módulo Caja
        if (pathMatcher.match("/api/caja/**", path) || 
            pathMatcher.match("/api/turnos/**", path) || 
            pathMatcher.match("/api/movimientos-caja/**", path) ||
            pathMatcher.match("/api/arqueos/**", path) ||
            pathMatcher.match("/api/registros-arqueo/**", path) ||
            pathMatcher.match("/api/medios-pago/**", path) ||
            pathMatcher.match("/api/metodos-pago/**", path) ||
            pathMatcher.match("/api/formas-pago/**", path)) {
            return "Caja";
        }

        // Repositorio Digital
        if (pathMatcher.match("/api/repositorio/**", path) || 
            pathMatcher.match("/api/documentos-digital/**", path) || 
            pathMatcher.match("/api/areas-curso/**", path) || 
            pathMatcher.match("/api/instituciones/**", path)) {
            return "Repositorio Digital";
        }

        // Informes
        if (pathMatcher.match("/api/informes/**", path) || pathMatcher.match("/api/reportes/**", path)) {
            return "Informes";
        }
        
        // Historial de Actividad
        if (pathMatcher.match("/api/registro-actividad/**", path) || 
            pathMatcher.match("/api/historial-actividad/**", path) || 
            pathMatcher.match("/api/auditoria/**", path)) {
            return "Historial de Actividad";
        }
        
        // Panel Principal
        if (pathMatcher.match("/api/dashboard/**", path) || pathMatcher.match("/api/panel/**", path)) {
            return "Panel Principal";
        }

        // Respaldos: operación sensible (descarga/restauración de base de datos),
        // queda reservada exclusivamente a ADMIN (que ya tiene bypass total más arriba).
        // No se mapea a ningún permiso para que ningún OPERARIO pueda acceder aunque
        // tenga el permiso "Configuración".
        if (pathMatcher.match("/api/respaldos/**", path)) {
            return null;
        }

        // Módulo Configuración
        if (pathMatcher.match("/api/configuracion/**", path)) {
            return "Configuración";
        }

        return null;
    }

    private String normalizar(String texto) {
        if (texto == null) return "";
        String normalizado = Normalizer.normalize(texto, Normalizer.Form.NFD);
        return normalizado.replaceAll("\\p{M}", "").toUpperCase().trim();
    }
}