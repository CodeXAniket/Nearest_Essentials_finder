package com.codexaniket.essentials.service;

import com.codexaniket.essentials.config.AppProperties;
import com.codexaniket.essentials.dto.AuthResponse;
import com.codexaniket.essentials.dto.LoginRequest;
import com.codexaniket.essentials.dto.RegisterRequest;
import com.codexaniket.essentials.dto.UserDto;
import com.codexaniket.essentials.exception.ApiException;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.AuthToken;
import com.codexaniket.essentials.repository.AppUserRepository;
import com.codexaniket.essentials.repository.AuthTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;

/**
 * Simple token based login:
 * 1. register / login checks the password with BCrypt,
 * 2. a long random token is saved in the auth_tokens table and returned,
 * 3. the frontend sends it back as a Bearer token; we look it up on each request.
 */
@Service
public class AuthService {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AppUserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    private final Duration tokenValidity;

    public AuthService(AppUserRepository userRepository, AuthTokenRepository tokenRepository,
                       AppProperties props) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.tokenValidity = Duration.ofDays(props.auth().tokenValidDays());
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        AppUser user = userRepository.save(
                new AppUser(request.name().trim(), email, passwordEncoder.encode(request.password())));
        return issueToken(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // Same message for "no such email" and "wrong password" so nobody can probe for accounts.
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        return issueToken(user);
    }

    @Transactional
    public void logout(String token) {
        if (token != null) {
            tokenRepository.deleteById(token);
        }
    }

    @Transactional
    public Optional<AppUser> findUserByToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return tokenRepository.findById(token).flatMap(t -> {
            if (t.getExpiresAt().isBefore(Instant.now())) {
                tokenRepository.delete(t);
                return Optional.empty();
            }
            return Optional.of(t.getUser());
        });
    }

    public static String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return authorizationHeader.substring(BEARER_PREFIX.length()).trim();
    }

    private AuthResponse issueToken(AppUser user) {
        tokenRepository.deleteByExpiresAtBefore(Instant.now()); // tidy up old sessions
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.save(new AuthToken(token, user, Instant.now().plus(tokenValidity)));
        return new AuthResponse(token, UserDto.from(user));
    }
}
