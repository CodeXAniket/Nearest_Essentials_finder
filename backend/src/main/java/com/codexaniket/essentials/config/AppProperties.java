package com.codexaniket.essentials.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Typed view of the "app.*" settings in application.properties.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Osm osm, Cors cors, Auth auth) {

    /**
     * @param enabled        turn live OpenStreetMap lookups on/off (tests switch it off)
     * @param overpassUrls   Overpass API servers used to find shops, tried in order
     *                       (the public ones are free but sometimes overloaded)
     * @param nominatimUrl   Nominatim endpoint used to turn "Katpadi, Vellore" into coordinates
     * @param userAgent      OSM services ask every app to identify itself
     * @param timeoutSeconds how long to wait for one OSM server before giving up on it
     * @param cacheHours     how long a downloaded area counts as fresh
     */
    public record Osm(boolean enabled, List<String> overpassUrls, String nominatimUrl, String userAgent,
                      int timeoutSeconds, int cacheHours) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Auth(int tokenValidDays) {
    }
}
