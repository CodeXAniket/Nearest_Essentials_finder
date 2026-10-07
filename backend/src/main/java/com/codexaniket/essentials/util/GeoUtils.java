package com.codexaniket.essentials.util;

/** Small helpers for distances on the surface of the Earth. */
public final class GeoUtils {

    public static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {
    }

    /**
     * Haversine formula: straight-line ("as the crow flies") distance in km
     * between two lat/lng points.
     */
    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    /**
     * The rectangle that fully contains a circle of radiusKm around (lat, lng).
     * One degree of latitude is ~111 km everywhere; one degree of longitude
     * shrinks towards the poles, hence the cos(lat).
     */
    public static BoundingBox boundingBox(double lat, double lng, double radiusKm) {
        double dLat = Math.toDegrees(radiusKm / EARTH_RADIUS_KM);
        double cosLat = Math.max(Math.cos(Math.toRadians(lat)), 0.01);
        double dLng = Math.toDegrees(radiusKm / (EARTH_RADIUS_KM * cosLat));
        return new BoundingBox(lat - dLat, lat + dLat, lng - dLng, lng + dLng);
    }

    public record BoundingBox(double minLat, double maxLat, double minLng, double maxLng) {
    }
}
