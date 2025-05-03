package com.social.socialmedia.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtService {

    // Replace this with a secure key in a real application, ideally fetched from environment variables
    
    @Value("${jwt.secret}")
    private String secretKey;//jwt service và jwttoken provider phải dùng chung 1 key
    // Generate token with only username
    public String generateToken(String username, String roles) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities", List.of("ROLE_USER"));
        return generateToken(claims, username);
    }

    // Generate token with additional claims
    public String generateToken(Map<String, Object> claims, String username) {
        return Jwts.builder()
                .setClaims(claims) // Add claims
                .setSubject(username) // Set username as subject
                .setIssuedAt(new Date()) // Set issued date
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // Token valid for 10 hours
                .signWith(getSignKey(), SignatureAlgorithm.HS256) // Sign with secret key
                .compact();
    }

    // Extract username from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract a specific claim from token
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extract all claims from token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey()) // Use the same signing key
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Extract expiration date from token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Validate token against user details and expiration
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Check if token is expired
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Get signing key for JWT
    private Key getSignKey() {
        System.out.println("SECRET key used for signing789: " + secretKey);
        byte[] keyBytes = Decoders.BASE64.decode(secretKey); // Decode SECRET key từ Base64
        return Keys.hmacShaKeyFor(keyBytes); // Tạo Key từ SECRET key
    }
}