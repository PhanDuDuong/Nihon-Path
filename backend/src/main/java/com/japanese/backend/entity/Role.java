package com.japanese.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "vai_tro")
@Getter
@Setter
public class Role {

    @Id
    private Long id;

    @Column(name = "ten")
    private String name;
}
