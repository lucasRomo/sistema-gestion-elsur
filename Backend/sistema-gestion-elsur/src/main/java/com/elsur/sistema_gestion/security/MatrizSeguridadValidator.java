package com.elsur.sistema_gestion.security;


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

    String path = request.getServletPath();
    if (path == null || path.isEmpty()) {
        path = request.getRequestURI();
    }

    if (path.length() > 1 && path.endsWith("/")) {
        path = path.substring(0, path.length() - 1);
    }

    String metodo = request.getMethod();

    boolean esPorton = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_PORTON"));
    if (esPorton) {
        return new AuthorizationDecision(evaluarPermisoPorton(path, metodo));
    }

    String username = auth.getName();

    boolean permitido = evaluarPermisoEnBaseDeDatos(username, path, metodo);

    return new AuthorizationDecision(permitido);
}

private boolean evaluarPermisoPorton(String path, String metodo) {
    if ("GET".equalsIgnoreCase(metodo)) {
        return pathMatcher.match("/api/tipos-documento/**", path)
            || pathMatcher.match("/api/usuarios/exists", path);
    }
    if ("POST".equalsIgnoreCase(metodo)) {
        return pathMatcher.match("/api/usuarios", path);
    }
    return false;
}

    private boolean evaluarPermisoEnBaseDeDatos(String username, String path, String metodo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreUsuario(username);
        if (usuarioOpt.isEmpty() || usuarioOpt.get().getRol() == null) {
            return false;
        }

        Usuario usuario = usuarioOpt.get();

        if ("ADMIN".equalsIgnoreCase(usuario.getRol().getNombreRol())) {
            return true;
        }

        if (pathMatcher.match("/api/asistente/**", path)) {
            return true;
        }

        Set<String> permisosUsuario = usuario.getRol().getPermisos() != null
                ? usuario.getRol().getPermisos().stream()
                    .map(p -> normalizar(p.getNombrePermiso()))
                    .collect(Collectors.toSet())
                : Collections.emptySet();

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

        if (pathMatcher.match("/api/pedidos/**", path) || pathMatcher.match("/api/comprobantes/**", path)) {
            if ("POST".equalsIgnoreCase(metodo) && pathMatcher.match("/api/pedidos", path)) {
                return permisosUsuario.contains(normalizar("CREAR PEDIDO"));
            }

            if (("GET".equalsIgnoreCase(metodo) || "PUT".equalsIgnoreCase(metodo)) &&
                tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        if (pathMatcher.match("/api/detalles-pedidos/**", path)) {
            if ("POST".equalsIgnoreCase(metodo)) {
                return permisosUsuario.contains(normalizar("CREAR PEDIDO"));
            }
            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        if (pathMatcher.match("/api/historiales-estado/**", path)) {
            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA", "INFORMES")) {
                return true;
            }
        }

        if ("GET".equalsIgnoreCase(metodo)) {

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

        if ("PUT".equalsIgnoreCase(metodo)) {
            for (String patronPropio : new String[]{
                    "/api/usuarios/{id}/password", "/api/usuarios/{id}/username", "/api/usuarios/{id}/email"}) {
                if (pathMatcher.match(patronPropio, path)) {
                    String idDelPath = pathMatcher.extractUriTemplateVariables(patronPropio, path).get("id");
                    return usuario.getIdUsuario() != null && usuario.getIdUsuario().toString().equals(idDelPath);
                }
            }
        }

        if (permisosUsuario.contains(normalizar("MATRIZ DE PERMISOS"))) {
            if ("PUT".equalsIgnoreCase(metodo) && pathMatcher.match("/api/usuarios/*", path)) {
                return true;
            }
        }

        if (("POST".equalsIgnoreCase(metodo) || "PUT".equalsIgnoreCase(metodo)) &&
            (pathMatcher.match("/api/movimientos-caja/**", path) || pathMatcher.match("/api/caja/**", path))) {
            if (tieneAlgunPermiso(permisosUsuario, "CREAR PEDIDO", "PEDIDOS PENDIENTES", "HISTORIAL DE PEDIDOS", "CAJA")) {
                return true;
            }
        }

        if ("PUT".equalsIgnoreCase(metodo) && pathMatcher.match("/api/clientes/*/limite-credito", path)) {
            if (tieneAlgunPermiso(permisosUsuario, "HISTORIAL DE PEDIDOS", "PEDIDOS PENDIENTES", "CLIENTES", "CAJA")) {
                return true;
            }
        }

        if ("POST".equalsIgnoreCase(metodo) &&
            (pathMatcher.match("/api/cuentas-corrientes/**", path) || pathMatcher.match("/api/clientes/**", path))) {
            if (tieneAlgunPermiso(permisosUsuario, "HISTORIAL DE PEDIDOS", "PEDIDOS PENDIENTES", "CLIENTES", "CAJA")) {
                return true;
            }
        }

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
        if (pathMatcher.match("/api/permisos/**", path) ||
            pathMatcher.match("/api/matriz-permisos/**", path)) {
            return "Matriz de Permisos";
        }

        if (pathMatcher.match("/api/clientes/**", path) ||
            pathMatcher.match("/api/categorias-cliente/**", path) ||
            pathMatcher.match("/api/cuentas-corrientes/**", path)) {
            return "Clientes";
        }

        if (pathMatcher.match("/api/insumos/**", path) ||
            pathMatcher.match("/api/unidades-medida/**", path)) {
            return "Insumos";
        }

        if (pathMatcher.match("/api/productos/**", path) ||
            pathMatcher.match("/api/producto-insumo/**", path) ||
            pathMatcher.match("/api/categorias/**", path)) {
            return "Productos";
        }

        if (pathMatcher.match("/api/proveedores/**", path) ||
            pathMatcher.match("/api/tipos-proveedor/**", path)) {
            return "Proveedores";
        }

        if (pathMatcher.match("/api/usuarios/**", path) ||
            pathMatcher.match("/api/tipos-documento/**", path)) {
            return "Gestión de Usuarios";
        }

        if (pathMatcher.match("/api/equipos/**", path) ||
            pathMatcher.match("/api/maquinas/**", path) ||
            pathMatcher.match("/api/incidencias/**", path)) {
            return "Equipos / Máquinas";
        }

        if (pathMatcher.match("/api/pedidos/historial/**", path)) return "Historial de Pedidos";
        if (pathMatcher.match("/api/pedidos/pendientes/**", path) || pathMatcher.match("/api/pedidos/*/**", path)) return "Pedidos Pendientes";
        if (pathMatcher.match("/api/pedidos/**", path)) return "Crear Pedido";
        if (pathMatcher.match("/api/comprobantes/**", path)) return "Pedidos Pendientes";

        if (pathMatcher.match("/api/compras-insumos/**", path) ||
            pathMatcher.match("/api/compras/**", path) ||
            pathMatcher.match("/api/compras-proveedor/**", path) ||
            pathMatcher.match("/api/detalles-compra-insumo/**", path)) {
            return "Compra de Insumos";
        }

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

        if (pathMatcher.match("/api/repositorio/**", path) ||
            pathMatcher.match("/api/documentos-digital/**", path) ||
            pathMatcher.match("/api/areas-curso/**", path) ||
            pathMatcher.match("/api/instituciones/**", path)) {
            return "Repositorio Digital";
        }

        if (pathMatcher.match("/api/informes/**", path) || pathMatcher.match("/api/reportes/**", path)) {
            return "Informes";
        }

        if (pathMatcher.match("/api/registro-actividad/**", path) ||
            pathMatcher.match("/api/historial-actividad/**", path) ||
            pathMatcher.match("/api/auditoria/**", path)) {
            return "Historial de Actividad";
        }

        if (pathMatcher.match("/api/dashboard/**", path) || pathMatcher.match("/api/panel/**", path)) {
            return "Panel Principal";
        }


        if (pathMatcher.match("/api/respaldos/**", path)) {
            return null;
        }

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
