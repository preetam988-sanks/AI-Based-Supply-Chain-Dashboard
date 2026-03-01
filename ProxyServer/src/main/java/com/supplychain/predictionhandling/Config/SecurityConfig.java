package com.supplychain.predictionhandling.Config;

import com.supplychain.predictionhandling.Security.JWTAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JWTAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JWTAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http

                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:5173",
                                    "https://supply-chain-main-chat.onrender.com",
                                    "https://ai-based-supply-chain-dashboard-ui.onrender.com"
                            ));
                    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(Arrays.asList("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))

                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/api/server/users/login").permitAll()
                        .requestMatchers("/error").permitAll()
                                .requestMatchers("/api/predictions/**").permitAll()
//                                .requestMatchers("/api/server/**").permitAll()

//                        .requestMatchers("/api/predictions/**").hasAuthority("admin")
//                        .requestMatchers("/api/server/users/**").hasAuthority("admin")
//                        .requestMatchers("/api/server/analytics/**").hasAnyAuthority("admin","user")
//
//
//                        .requestMatchers("/api/server/dashboard/**").hasAnyAuthority("admin", "user")
//                        .requestMatchers("/api/server/orders/**").hasAnyAuthority("admin", "user")
//                        .requestMatchers("/api/server/inventory/**").hasAnyAuthority("admin", "user")
//                        .requestMatchers("/api/server/logistics/**").hasAnyAuthority("admin", "user")
//                        .requestMatchers("/api/server/import/**").hasAnyAuthority("admin", "user")


                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}