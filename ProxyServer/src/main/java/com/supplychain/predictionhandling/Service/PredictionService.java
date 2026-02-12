package com.supplychain.predictionhandling.Service;

import com.supplychain.predictionhandling.Entity.PredictionRecord;
import com.supplychain.predictionhandling.Repository.PredictionRepository;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;


@Service
public class PredictionService {
    private final WebClient webClient;
    private final PredictionRepository repository;
    public PredictionService(WebClient.Builder webClientBuilder, PredictionRepository repository) {
        this.webClient = webClientBuilder.baseUrl("http://localhost:8001").build();
        this.repository=repository;
    }
    public Mono<String> getPredictionFromPython(MultipartFile file,String questions) {
        MultipartBodyBuilder builder=new MultipartBodyBuilder();
        builder.part("questions",questions);
        builder.part("file",file.getResource());

        return webClient.post()
                .uri("/chat")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(responseBody->{
                    PredictionRecord record=PredictionRecord.builder()
                            .questions(questions)
                            .result(responseBody)
                            .createdAt(LocalDateTime.now())
                            .build();
                    repository.save(record);
                    return Mono.just(responseBody);
                });
    }

}
