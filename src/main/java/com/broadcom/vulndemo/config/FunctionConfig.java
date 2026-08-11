package com.broadcom.vulndemo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Function;

/**
 * Registers a trivial function so the vulnerable spring-cloud-function-web
 * RoutingFunction has something to route to. The CVE-2022-22963 demo sends a
 * SpEL routing-expression header that resolves to this function's name — proving
 * the header is evaluated as SpEL (the primitive behind the RCE).
 */
@Configuration
public class FunctionConfig {

    @Bean
    public Function<String, String> uppercase() {
        return value -> value == null ? "" : value.toUpperCase();
    }
}
