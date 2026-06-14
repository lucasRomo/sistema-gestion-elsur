package com.elsur.sistema_gestion.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;

@Entity
@Table(name = "Empleado")
@Data
public class Empleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_empleado")
    private Integer idEmpleado;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "fecha_contratacion")
    private LocalDate fechaContratacion;

    @Column(name = "cargo", nullable = false, length = 45)
    private String cargo;

    @Column(name = "salario", nullable = false, precision = 10, scale = 2)
    private BigDecimal salario;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @ManyToOne
    @JoinColumn(name = "id_persona")
    private Persona persona;

}