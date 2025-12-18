package com.poscl.auth.infrastructure.security;

import com.poscl.auth.domain.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.*;

/**
 * Servicio para generación y validación de JWT
 */
@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    /**
     * Genera un access token para el usuario
     */
    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantId", user.getTenantId().toString());
        claims.put("roles", user.getRoleNames());
        claims.put("permissions", user.getPermissions());
        claims.put("email", user.getEmail());
        claims.put("nombre", user.getNombreCompleto());

        return Jwts.builder()
                .claims(claims)
                .subject(user.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Genera un refresh token
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * Obtiene la expiración del refresh token en milisegundos
     */
    public Long getRefreshExpiration() {
        return refreshExpiration;
    }

    /**
     * Obtiene la expiración del access token en segundos
     */
    public Long getAccessTokenExpirationSeconds() {
        return jwtExpiration / 1000;
    }

    /**
     * Extrae el user ID del token
     */
    public UUID extractUserId(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        return UUID.fromString(subject);
    }

    /**
     * Extrae el tenant ID del token
     */
    public UUID extractTenantId(String token) {
        Claims claims = extractAllClaims(token);
        String tenantId = claims.get("tenantId", String.class);
        return UUID.fromString(tenantId);
    }

    /**
     * Extrae los roles del token
     */
    @SuppressWarnings("unchecked")
    public Set<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        List<String> roles = claims.get("roles", List.class);
        return roles != null ? new HashSet<>(roles) : Set.of();
    }

    /**
     * Extrae los permisos del token
     */
    @SuppressWarnings("unchecked")
    public Set<String> extractPermissions(String token) {
        Claims claims = extractAllClaims(token);
        List<String> permissions = claims.get("permissions", List.class);
        return permissions != null ? new HashSet<>(permissions) : Set.of();
    }

    /**
     * Valida el token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifica si el token ha expirado
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    private <T> T extractClaim(String token, java.util.function.Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        // Use raw bytes from the secret string (must be at least 32 chars for 256-bit
        // key)
        byte[] keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
