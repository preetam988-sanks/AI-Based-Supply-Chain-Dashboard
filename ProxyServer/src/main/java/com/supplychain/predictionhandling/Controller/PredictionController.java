package com.supplychain.predictionhandling.Controller;

import com.supplychain.predictionhandling.Entity.PredictionRecord;
import com.supplychain.predictionhandling.Repository.PredictionRepository;
import com.supplychain.predictionhandling.Service.PredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.List;
@RestController
@RequestMapping("/api/predictions")
//@CrossOrigin(origins = "http://localhost:5173")
public class PredictionController {
   private final PredictionService predictionService;
   private final PredictionRepository Repository;
   public  PredictionController(PredictionService predictionService, PredictionRepository Repository) {
       this.predictionService = predictionService;
       this.Repository = Repository;
   }
   @PostMapping("/analyze")
    public Mono<String> analyzeData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("questions") String questions
   ){
       return predictionService.getPredictionFromPython(file,questions);
   }
   @GetMapping("/history")
    public ResponseEntity<List<PredictionRecord>> getHistory(){
       return ResponseEntity.ok(Repository.findAll());
   }

}
