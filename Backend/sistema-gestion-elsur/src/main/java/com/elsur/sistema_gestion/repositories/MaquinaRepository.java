package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Maquina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaquinaRepository extends JpaRepository<Maquina, Integer> {
    
    // Para filtrar rápido las máquinas que están funcionando
    List<Maquina> findByEstado(String estado);
}