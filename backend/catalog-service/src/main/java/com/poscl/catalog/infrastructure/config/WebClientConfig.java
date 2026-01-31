package com.poscl.catalog.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Configuration
public class WebClientConfig {

    @Value("${services.inventory.url}")
    private String inventoryServiceUrl;

    @Bean
    @Value("${services.auth.url:http://localhost:8081}")
    private String authServiceUrl;

    @Bean
    public WebClient inventoryWebClient() {
        log.info("Creating WebClient for inventory-service at URL: {}", inventoryServiceUrl);
        return WebClient.builder()
                .baseUrl(inventoryServiceUrl)
                .build();
    }

    @Bean
    public WebClient authWebClient() {
        log.info("Creating WebClient for auth-service at URL: {}", authServiceUrl);
        return WebClient.builder()
                .baseUrl(authServiceUrl)
                .build();
    }
}
