package com.codexaniket.essentials.dto;

import com.codexaniket.essentials.model.Category;

/**
 * Everything a nearby search needs. Built by the controller from query params.
 *
 * @param category null means "all categories"
 * @param label    optional human readable name of the location (only stored in history)
 */
public record SearchRequest(
        double latitude,
        double longitude,
        double radiusKm,
        Category category,
        String keyword,
        int limit,
        String label
) {
}
