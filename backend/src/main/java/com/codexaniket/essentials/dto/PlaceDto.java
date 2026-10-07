package com.codexaniket.essentials.dto;

import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.Place;

/**
 * What the frontend sees for one place. distanceKm is null when the place is
 * shown outside of a search (for example in the saved places list).
 */
public record PlaceDto(
        Long id,
        String name,
        Category category,
        String categoryLabel,
        double latitude,
        double longitude,
        String address,
        String phone,
        String openingHours,
        String website,
        Double distanceKm,
        boolean favorite
) {

    public static PlaceDto from(Place place, Double distanceKm, boolean favorite) {
        return new PlaceDto(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getCategory().getLabel(),
                place.getLatitude(),
                place.getLongitude(),
                place.getAddress(),
                place.getPhone(),
                place.getOpeningHours(),
                place.getWebsite(),
                distanceKm == null ? null : Math.round(distanceKm * 100) / 100.0,
                favorite);
    }
}
