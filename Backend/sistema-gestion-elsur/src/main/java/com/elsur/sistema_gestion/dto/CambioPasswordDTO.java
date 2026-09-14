package com.elsur.sistema_gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CambioPasswordDTO {

    @NotBlank(message = "Debe indicar la contraseña actual.")
    private String passwordActual;

    // BCrypt solo considera los primeros 72 bytes de la contraseña; lo que sigue
    // se ignora en silencio. El máximo de 72 evita que alguien crea que tiene
    // una contraseña más larga de lo que el sistema realmente llega a comprobar.
    @NotBlank(message = "La nueva contraseña no puede estar vacía.")
    @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres.")
    private String passwordNueva;

    public CambioPasswordDTO() {}

    public CambioPasswordDTO(String passwordActual, String passwordNueva) {
        this.passwordActual = passwordActual;
        this.passwordNueva = passwordNueva;
    }

    public String getPasswordActual() { return passwordActual; }
    public void setPasswordActual(String passwordActual) { this.passwordActual = passwordActual; }

    public String getPasswordNueva() { return passwordNueva; }
    public void setPasswordNueva(String passwordNueva) { this.passwordNueva = passwordNueva; }
}
