package com.elsur.sistema_gestion.dto;

public class CambioEmailDTO {
    private String emailActual;
    private String emailNuevo;

    public CambioEmailDTO() {}

    public CambioEmailDTO(String emailActual, String emailNuevo) {
        this.emailActual = emailActual;
        this.emailNuevo = emailNuevo;
    }

    public String getEmailActual() { return emailActual; }
    public void setEmailActual(String emailActual) { this.emailActual = emailActual; }

    public String getEmailNuevo() { return emailNuevo; }
    public void setEmailNuevo(String emailNuevo) { this.emailNuevo = emailNuevo; }
}