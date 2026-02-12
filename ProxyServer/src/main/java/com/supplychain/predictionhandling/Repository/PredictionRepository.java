package com.supplychain.predictionhandling.Repository;

import com.supplychain.predictionhandling.Entity.PredictionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PredictionRepository extends JpaRepository<PredictionRecord,Long> {

}
