package com.elsur.sistema_gestion.dto;

public class CambioUsuarioDTO {
    private String usuarioActual;
    private String usuarioNuevo;

    public CambioUsuarioDTO() {}

    public CambioUsuarioDTO(String usuarioActual, String usuarioNuevo) {
        this.usuarioActual = usuarioActual;
        this.usuarioNuevo = usuarioNuevo;
    }

    public String getUsuarioActual() { return usuarioActual; }
    public void setUsuarioActual(String usuarioActual) { this.usuarioActual = usuarioActual; }

    public String getUsuarioNuevo() { return usuarioNuevo; }
    public void setUsuarioNuevo(String usuarioNuevo) { this.usuarioNuevo = usuarioNuevo; }
}