package com.codexaniket.essentials.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A shop or service on the map. Rows are filled from OpenStreetMap and
 * cached here so repeat searches are answered straight from MySQL.
 */
@Entity
@Table(name = "places", indexes = {
        @Index(name = "idx_place_category_lat_lng", columnList = "category, latitude, longitude")
})
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. "node/123456" — lets us update a place instead of inserting it twice. */
    @Column(name = "osm_id", unique = true, length = 40)
    private String osmId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(length = 500)
    private String address;

    @Column(length = 60)
    private String phone;

    @Column(name = "opening_hours", length = 255)
    private String openingHours;

    @Column(length = 255)
    private String website;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOsmId() { return osmId; }
    public void setOsmId(String osmId) { this.osmId = osmId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public Instant getUpdatedAt() { return updatedAt; }
}
