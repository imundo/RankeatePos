package com.poscl.bff.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * WebClient configuration for calling downstream services
 * Configured with longer timeouts for Render.com free tier cold starts
 */
@Slf4j
@Configuration
public class WebClientConfig {

    @Value("${services.auth.url}")
    private String authServiceUrl;

    @Value("${services.catalog.url}")
    private String catalogServiceUrl;

    @Value("${services.sales.url}")
    private String salesServiceUrl;

    // Longer timeout for Render free tier cold starts (up to 60 seconds)
    private static final int CONNECTION_TIMEOUT_MS = 60000;
    private static final int READ_TIMEOUT_SECONDS = 60;
    private static final int WRITE_TIMEOUT_SECONDS = 30;

    private HttpClient createHttpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECTION_TIMEOUT_MS)
                .responseTimeout(Duration.ofSeconds(READ_TIMEOUT_SECONDS))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)));
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.info("Calling {} {}", request.method(), request.url());
            return Mono.just(request);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.info("Response status: {}", response.statusCode());
            return Mono.just(response);
        });
    }

    @Bean
    public WebClient authWebClient() {
        log.info("Creating authWebClient with baseUrl: {}", authServiceUrl);
        return WebClient.builder()
                .baseUrl(authServiceUrl)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    @Bean
    public WebClient catalogWebClient() {
        log.info("Creating catalogWebClient with baseUrl: {}", catalogServiceUrl);
        return WebClient.builder()
                .baseUrl(catalogServiceUrl)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    @Bean
    public WebClient salesWebClient() {
        log.info("Creating salesWebClient with baseUrl: {}", salesServiceUrl);
        return WebClient.builder()
                .baseUrl(salesServiceUrl)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * RestTemplate bean for ERP services (Payroll, Accounting, Purchases, Payments)
     * Used by proxy controllers for synchronous HTTP calls
     */
    @Bean
    public org.springframework.web.client.RestTemplate restTemplate() {
        log.info("Creating RestTemplate for ERP services");
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECTION_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_SECONDS * 1000);
        return new org.springframework.web.client.RestTemplate(factory);
    }
}
