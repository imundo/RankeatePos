package com.poscl.payroll;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PayrollServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PayrollServiceApplication.class, args);
    }
}
