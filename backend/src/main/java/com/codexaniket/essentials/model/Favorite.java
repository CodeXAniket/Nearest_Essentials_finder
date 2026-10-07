package com.codexaniket.essentials.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "favorites", uniqueConstraints = {
        @UniqueConstraint(name = "uk_favorite_user_place", columnNames = {"user_id", "place_id"})
})
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Favorite() {
    }

    public Favorite(AppUser user, Place place) {
        this.user = user;
        this.place = place;
    }

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Place getPlace() { return place; }
    public Instant getCreatedAt() { return createdAt; }
}
