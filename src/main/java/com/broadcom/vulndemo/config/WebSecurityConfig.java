package com.broadcom.vulndemo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration that intentionally demonstrates CVE-2022-22978.
 *
 * The admin area is protected with a RegexRequestMatcher whose '.' can match a
 * newline-free path only, so a request path containing an encoded newline can
 * bypass the rule on the vulnerable spring-security-web 5.6.1.
 */
@Configuration
public class WebSecurityConfig {

    @Bean
    @SuppressWarnings("deprecation")
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Vulnerable matcher pattern (CVE-2022-22978): regex '.' + trailing segment.
            .authorizeRequests(auth -> auth
                .regexMatchers("/admin/.*").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic();

        // H2 console + dashboard are framed/inline; relax protections for the demo.
        http.csrf().disable();
        http.headers().frameOptions().disable();
        return http.build();
    }

    @Bean
    public InMemoryUserDetailsManager userDetailsService() {
        // Plaintext credentials on purpose — this is a vulnerability demo.
        UserDetails admin = User.withUsername("admin")
                .password("{noop}admin")
                .roles("ADMIN")
                .build();
        return new InMemoryUserDetailsManager(admin);
    }
}
