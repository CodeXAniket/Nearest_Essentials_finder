package com.codexaniket.essentials.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A login session. The browser keeps the token and sends it back as
 * "Authorization: Bearer &lt;token&gt;" on every request that needs a user.
 */
@Entity
@Table(name = "auth_tokens")
public class AuthToken {

    @Id
    @Column(length = 64)
    private String token;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected AuthToken() {
    }

    public AuthToken(String token, AppUser user, Instant expiresAt) {
        this.token = token;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    public String getToken() { return token; }
    public AppUser getUser() { return user; }
    public Instant getExpiresAt() { return expiresAt; }
}
