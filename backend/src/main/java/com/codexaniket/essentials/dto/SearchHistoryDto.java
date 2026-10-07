package com.codexaniket.essentials.dto;

import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.SearchHistory;

import java.time.Instant;

public record SearchHistoryDto(
        Long id,
        Category category,
        String categoryLabel,
        String keyword,
        String locationLabel,
        double latitude,
        double longitude,
        double radiusKm,
        int resultCount,
        Instant createdAt
) {

    public static SearchHistoryDto from(SearchHistory h) {
        return new SearchHistoryDto(
                h.getId(),
                h.getCategory(),
                h.getCategory() == null ? "All essentials" : h.getCategory().getLabel(),
                h.getKeyword(),
                h.getLocationLabel(),
                h.getLatitude(),
                h.getLongitude(),
                h.getRadiusKm(),
                h.getResultCount(),
                h.getCreatedAt());
    }
}
