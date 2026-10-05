package com.elsur.sistema_gestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;

@SpringBootApplication
public class SistemaGestionApplication {

	// Variables de entorno sin valor por defecto en application.properties: si falta alguna,
	// Spring corta con un error largo y difícil de leer ("Error creating bean 'jwtService'...").
	private static final List<String> VARIABLES_OBLIGATORIAS = List.of(
			"DB_URL", "DB_USERNAME", "DB_PASSWORD", "JWT_SECRET", "CRYPTO_SECRET",
			"CLAVE_ACCESO", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");

	public static void main(String[] args) {
		avisarVariablesFaltantes();
		SpringApplication.run(SistemaGestionApplication.class, args);
	}

	private static void avisarVariablesFaltantes() {
		List<String> faltantes = VARIABLES_OBLIGATORIAS.stream()
				.filter(nombre -> esVacia(System.getenv(nombre)) && esVacia(System.getProperty(nombre)))
				.toList();
		if (faltantes.isEmpty()) return;

		System.err.println();
		System.err.println("==================================================================");
		System.err.println(" FALTAN VARIABLES DE ENTORNO: " + String.join(", ", faltantes));
		System.err.println(" El backend no va a poder arrancar sin ellas.");
		System.err.println(" - Local (Run and Debug): agregalas en \"env\" de .vscode/launch.json");
		System.err.println(" - Render: Environment del servicio");
		System.err.println(" JWT_SECRET y CRYPTO_SECRET tienen que ser las mismas en todas las");
		System.err.println(" PCs que usan la misma base (si no, \"ver contraseña\" no funciona).");
		System.err.println("==================================================================");
		System.err.println();
	}

	private static boolean esVacia(String valor) {
		return valor == null || valor.isBlank();
	}
}
