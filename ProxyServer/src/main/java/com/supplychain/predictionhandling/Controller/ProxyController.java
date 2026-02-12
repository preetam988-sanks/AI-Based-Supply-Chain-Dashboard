package com.supplychain.predictionhandling.Controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;

//@RestController
//public class ProxyController {
//    private final String FASTAPI_SERVER="http://localhost:8000";
//    private final RestTemplate restTemplate = new RestTemplate();
//    @RequestMapping("/api/server/**")
//    public ResponseEntity<?> proxyToFastAPI(HttpServletRequest request) throws URISyntaxException, IOException {
//        String requestURI=request.getRequestURI();
//        String pathInsideFastAPI=requestURI.replace("/api/server","/api");
//        String url=FASTAPI_SERVER+pathInsideFastAPI+
//                (request.getQueryString()!=null ? "?"+request.getQueryString() : "");
//        URI uri = new URI(url);
//        HttpHeaders headers=new HttpHeaders();
//        Collections.list(request.getHeaderNames()).forEach(
//                name->headers.add(name,request.getHeader(name))
//        );
//        byte[] body= StreamUtils.copyToByteArray(request.getInputStream());
//        HttpEntity<byte[]> entity=new HttpEntity<>(body,headers);
//        try{
//            return restTemplate.exchange(uri, HttpMethod.valueOf(request.getMethod()),entity,byte[].class);
//        }catch(HttpStatusCodeException e){
//            return ResponseEntity.status(e.getStatusCode())
//                    .headers(e.getResponseHeaders())
//                    .body(e.getResponseBodyAsByteArray());
//        }
//    }
//}
@RestController
public class ProxyController {
    private final WebClient fastApiClient;

    public ProxyController(WebClient.Builder builder) {
        // This client is dedicated to the Port 8000 pass-through
        this.fastApiClient = builder.baseUrl("http://localhost:8000").build();
    }

    @RequestMapping("/api/server/**")
    public Mono<ResponseEntity<byte[]>> proxyToFastAPI(HttpServletRequest request) throws IOException {
        String path = request.getRequestURI().replace("/api/server", "/api");
//        String path = request.getRequestURI();
        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";

        // Forward ONLY necessary headers to avoid proxy conflicts
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", request.getHeader("Authorization"));
        headers.add("Content-Type", request.getHeader("Content-Type"));

        return fastApiClient.method(org.springframework.http.HttpMethod.valueOf(request.getMethod()))
                .uri(path + query)
                .headers(h -> h.addAll(headers))
                .bodyValue(request.getInputStream().readAllBytes())
                .retrieve()
                .toEntity(byte[].class)
                .onErrorResume(org.springframework.web.reactive.function.client.WebClientResponseException.class,
                        e -> Mono.just(ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsByteArray())));
    }
}
