package com.codexaniket.essentials.controller;

import com.codexaniket.essentials.auth.CurrentUser;
import com.codexaniket.essentials.dto.AuthResponse;
import com.codexaniket.essentials.dto.LoginRequest;
import com.codexaniket.essentials.dto.RegisterRequest;
import com.codexaniket.essentials.dto.UserDto;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        authService.logout(AuthService.extractBearerToken(authorization));
    }

    /** Lets the frontend check if a saved token is still valid. */
    @GetMapping("/me")
    public UserDto me(@CurrentUser AppUser user) {
        return UserDto.from(user);
    }
}
