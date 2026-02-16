package com.poscl.marketing.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "sales.events";
    public static final String QUEUE_NAME = "marketing.sales.queue";

    @Bean
    public Queue salesQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public TopicExchange salesExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding binding(Queue salesQueue, TopicExchange salesExchange) {
        return BindingBuilder.bind(salesQueue).to(salesExchange).with("sale.completed");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
