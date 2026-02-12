package com.supplychain.predictionhandling.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.util.*;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Component
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String secret;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (authHeader != null && authHeader.startsWith("Bearer ")) {


            String token = authHeader.substring(7);
            System.out.println("This is a Token"+token);

            try {
                SecretKey key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        secret.getBytes(StandardCharsets.UTF_8)
                );


                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();


                String username = claims.getSubject();
                System.out.println("This is a userName"+username);

                String role = claims.get("role", String.class); // admin / user

                if (role != null) {


                    List<SimpleGrantedAuthority> authorities =
                            Collections.singletonList(
                                    new SimpleGrantedAuthority(role.toLowerCase().trim())
                            );
                    System.out.println(List.of(authorities));


                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    null,
                                    authorities
                            );
                    System.out.println("This is authentication"+authentication);


                    SecurityContextHolder.getContext().setAuthentication(authentication);


                    SecurityContextHolder.getContext()
                            .getAuthentication()
                            .getAuthorities();
                }

            } catch (Exception e) {

                System.out.println("JWT validation failed: " + e.getMessage());
            }
        }


        filterChain.doFilter(request, response);
    }
}
