package com.codexaniket.essentials.dto;

import java.util.List;

/**
 * @param notice optional message for the user, e.g. when live map data could not be fetched
 */
public record SearchResponse(
        double latitude,
        double longitude,
        double radiusKm,
        int count,
        String notice,
        List<PlaceDto> places
) {
}
