package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {}