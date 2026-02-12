package com.supplychain.predictionhandling.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name="ai_predictions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionRecord {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private String questions;
    @Column(columnDefinition = "TEXT")
    private String result;
    private LocalDateTime createdAt;

}
