package com.supplychain.predictionhandling.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

//@Configuration
//public class WebClientConfig {
//    @Value("${python.ai.service.url}")
//    private String aiServiceUrl;
//
//    @Bean
//    public WebClient webClient(WebClient.Builder builder) {
//        return builder
//                .baseUrl(aiServiceUrl)
//                .codecs(configurer->configurer.defaultCodecs().maxInMemorySize(16*1024*1024))
//                .build();
//    }
@Configuration
public class WebClientConfig {
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16*1024*1024));
    }
}
//}
