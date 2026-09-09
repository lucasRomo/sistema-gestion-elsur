package com.elsur.sistema_gestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SistemaGestionApplication {
	public static void main(String[] args) {
		String pass = System.getenv("DB_PASSWORD");
		System.out.println("DEBUG >> DB_PASSWORD detectada, longitud: " + (pass != null ? pass.length() : "NULL"));

		SpringApplication.run(SistemaGestionApplication.class, args);
	}

}