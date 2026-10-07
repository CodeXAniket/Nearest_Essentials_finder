package com.codexaniket.essentials.service;

import com.codexaniket.essentials.dto.PlaceDto;
import com.codexaniket.essentials.exception.ApiException;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.Favorite;
import com.codexaniket.essentials.model.Place;
import com.codexaniket.essentials.repository.FavoriteRepository;
import com.codexaniket.essentials.repository.PlaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** A user's saved places ("my usual pharmacy", "ATM near hostel"...). */
@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PlaceRepository placeRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, PlaceRepository placeRepository) {
        this.favoriteRepository = favoriteRepository;
        this.placeRepository = placeRepository;
    }

    @Transactional(readOnly = true)
    public List<PlaceDto> list(AppUser user) {
        return favoriteRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(f -> PlaceDto.from(f.getPlace(), null, true))
                .toList();
    }

    /** Saving twice is fine — the second call is a no-op. */
    @Transactional
    public PlaceDto add(AppUser user, long placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> ApiException.notFound("Place " + placeId + " not found"));
        if (favoriteRepository.findByUserAndPlaceId(user, placeId).isEmpty()) {
            favoriteRepository.save(new Favorite(user, place));
        }
        return PlaceDto.from(place, null, true);
    }

    @Transactional
    public void remove(AppUser user, long placeId) {
        favoriteRepository.findByUserAndPlaceId(user, placeId).ifPresent(favoriteRepository::delete);
    }
}
