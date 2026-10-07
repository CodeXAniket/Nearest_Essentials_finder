package com.codexaniket.essentials.repository;

import com.codexaniket.essentials.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {

    void deleteByExpiresAtBefore(Instant time);
}
