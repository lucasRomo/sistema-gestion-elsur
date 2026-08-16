package com.elsur.sistema_gestion.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import com.elsur.sistema_gestion.models.Usuario;

import java.time.LocalDateTime;

@Entity
@Table(name = "mermas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_merma")
    private Long idMerma;

    @ManyToOne(optional = true)
    @JoinColumn(name = "id_pedido", nullable = true)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto", nullable = true)
    @JsonIgnoreProperties({"receta", "insumos"})
    private Producto producto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_insumo", nullable = true)
    private Insumo insumo;

    @Column(nullable = false)
    private Double cantidad;

    @Column(length = 500)
    private String descripcion;

    @Column(name = "fecha_merma", nullable = false)
    @Builder.Default
    private LocalDateTime fechaMerma = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = true)
    @JsonIgnoreProperties({"password", "rol"})
    private Usuario usuario;    
}