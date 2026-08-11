package com.broadcom.vulndemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the intentionally-vulnerable Tanzu Platform demo application.
 */
@SpringBootApplication
public class VulnDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(VulnDemoApplication.class, args);
    }
}
