package com.elsur.sistema_gestion.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Body de POST /api/usuarios/{id}/password-real. No lleva la contraseña del
 * usuario que se quiere ver (esa nunca la pide el frontend): lleva la contraseña
 * de quien está pidiendo verla, para reautenticar al admin antes de desencriptar.
 */
public class VerContrasenaDTO {

    @NotBlank(message = "Debe ingresar su contraseña para confirmar la operación.")
    private String passwordAdmin;

    public VerContrasenaDTO() {}

    public String getPasswordAdmin() { return passwordAdmin; }
    public void setPasswordAdmin(String passwordAdmin) { this.passwordAdmin = passwordAdmin; }
}
