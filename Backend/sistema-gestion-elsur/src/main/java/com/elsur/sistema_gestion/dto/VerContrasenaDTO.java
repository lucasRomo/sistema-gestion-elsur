package com.elsur.sistema_gestion.dto;

import jakarta.validation.constraints.NotBlank;

public class VerContrasenaDTO {

    @NotBlank(message = "Debe ingresar su contraseña para confirmar la operación.")
    private String passwordAdmin;

    public VerContrasenaDTO() {}

    public String getPasswordAdmin() { return passwordAdmin; }
    public void setPasswordAdmin(String passwordAdmin) { this.passwordAdmin = passwordAdmin; }
}
