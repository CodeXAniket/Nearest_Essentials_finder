package com.codexaniket.essentials.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Remembers "we already downloaded every PHARMACY within 5 km of (lat, lng)".
 * If a new search fits inside a fresh synced circle, we skip OpenStreetMap
 * and answer from the database only.
 */
@Entity
@Table(name = "synced_areas", indexes = {
        @Index(name = "idx_synced_category_time", columnList = "category, synced_at")
})
public class SyncedArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "radius_km", nullable = false)
    private double radiusKm;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;

    protected SyncedArea() {
    }

    public SyncedArea(Category category, double latitude, double longitude, double radiusKm) {
        this.category = category;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radiusKm = radiusKm;
        this.syncedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Category getCategory() { return category; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getRadiusKm() { return radiusKm; }
    public Instant getSyncedAt() { return syncedAt; }
}
