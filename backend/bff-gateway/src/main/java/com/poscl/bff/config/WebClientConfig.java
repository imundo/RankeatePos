package com.poscl.bff.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient configuration for calling downstream services
 */
@Configuration
public class WebClientConfig {

    @Value("${services.auth.url}")
    private String authServiceUrl;

    @Value("${services.catalog.url}")
    private String catalogServiceUrl;

    @Value("${services.sales.url}")
    private String salesServiceUrl;

    @Bean
    public WebClient authWebClient() {
        return WebClient.builder()
                .baseUrl(authServiceUrl)
                .build();
    }

    @Bean
    public WebClient catalogWebClient() {
        return WebClient.builder()
                .baseUrl(catalogServiceUrl)
                .build();
    }

    @Bean
    public WebClient salesWebClient() {
        return WebClient.builder()
                .baseUrl(salesServiceUrl)
                .build();
    }
}
