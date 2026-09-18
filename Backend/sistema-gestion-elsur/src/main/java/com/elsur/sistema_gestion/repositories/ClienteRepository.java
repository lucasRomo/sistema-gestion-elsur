package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    // Usado para validar razón social duplicada (insensible a mayúsculas), excluyendo
    // al propio cliente cuando se está editando -- mismo patrón que Insumo/Producto/Institución.
    boolean existsByRazonSocialIgnoreCaseAndIdClienteNot(String razonSocial, Integer idExcluido);
}