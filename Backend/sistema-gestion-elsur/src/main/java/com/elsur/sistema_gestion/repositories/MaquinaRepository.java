package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Maquina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaquinaRepository extends JpaRepository<Maquina, Integer> {
    // NOTA: existsByNombreIgnoreCase quedaba declarado pero nunca se llamaba desde
    // MaquinaServiceImpl.guardar() -- la validación de nombre duplicado nunca se
    // ejecutaba en la práctica. Se agrega la variante que excluye al propio registro
    // (para permitir editar una máquina sin chocar contra su propio nombre) y se
    // conecta desde el service.
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdMaquinaNot(String nombre, Integer idExcluido);
}