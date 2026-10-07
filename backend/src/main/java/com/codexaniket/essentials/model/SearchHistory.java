package com.codexaniket.essentials.model;

import jakarta.persistence.*;

import java.time.Instant;

/** One row per search made by a logged-in user, shown as "Recent searches". */
@Entity
@Table(name = "search_history", indexes = {
        @Index(name = "idx_history_user_time", columnList = "user_id, created_at")
})
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Category category;

    @Column(length = 120)
    private String keyword;

    /** Human friendly place name, e.g. "Katpadi, Vellore" (optional). */
    @Column(name = "location_label", length = 200)
    private String locationLabel;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "radius_km", nullable = false)
    private double radiusKm;

    @Column(name = "result_count", nullable = false)
    private int resultCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected SearchHistory() {
    }

    public SearchHistory(AppUser user, Category category, String keyword, String locationLabel,
                         double latitude, double longitude, double radiusKm, int resultCount) {
        this.user = user;
        this.category = category;
        this.keyword = keyword;
        this.locationLabel = locationLabel;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radiusKm = radiusKm;
        this.resultCount = resultCount;
    }

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Category getCategory() { return category; }
    public String getKeyword() { return keyword; }
    public String getLocationLabel() { return locationLabel; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getRadiusKm() { return radiusKm; }
    public int getResultCount() { return resultCount; }
    public Instant getCreatedAt() { return createdAt; }
}
