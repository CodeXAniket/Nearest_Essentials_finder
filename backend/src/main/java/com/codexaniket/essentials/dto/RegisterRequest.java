package com.codexaniket.essentials.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 6, max = 72, message = "must be 6 to 72 characters") String password
) {
}
