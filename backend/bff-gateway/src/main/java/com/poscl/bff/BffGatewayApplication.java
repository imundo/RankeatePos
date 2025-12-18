package com.poscl.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

/**
 * BFF Gateway - Backend for Frontend
 * Punto de entrada único para el frontend POS
 */
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class
})
public class BffGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(BffGatewayApplication.class, args);
    }
}
