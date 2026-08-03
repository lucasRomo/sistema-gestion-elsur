package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Area_Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Area_CursoRepository extends JpaRepository<Area_Curso, Long> {
}