package com.elsur.sistema_gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body de POST /api/usuarios/{id}/password-reset. Mismo criterio de
 * reautenticación que VerContrasenaDTO (passwordAdmin = la contraseña de quien
 * está pidiendo la operación, nunca la del usuario objetivo), más la nueva
 * contraseña a asignarle al usuario objetivo -- con el mismo mínimo/máximo que
 * ya exige CambioPasswordDTO para el cambio de contraseña de uno mismo.
 *
 * Esto es lo que faltaba para que "cambiar la contraseña" funcionara de verdad
 * desde Gestión de Usuarios: antes solo existía "Ver contraseña" (consulta) y
 * el cambio de contraseña de uno mismo (que exige conocer la contraseña
 * ACTUAL del usuario objetivo, algo que un admin normalmente no tiene). Este
 * endpoint es el que le permite a un admin fijar una contraseña nueva para
 * otro usuario sin necesitar la vieja.
 */
public class RestablecerPasswordDTO {

    @NotBlank(message = "Debe ingresar su contraseña para confirmar la operación.")
    private String passwordAdmin;

    @NotBlank(message = "La nueva contraseña no puede estar vacía.")
    @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres.")
    private String passwordNueva;

    public RestablecerPasswordDTO() {}

    public String getPasswordAdmin() { return passwordAdmin; }
    public void setPasswordAdmin(String passwordAdmin) { this.passwordAdmin = passwordAdmin; }

    public String getPasswordNueva() { return passwordNueva; }
    public void setPasswordNueva(String passwordNueva) { this.passwordNueva = passwordNueva; }
}
