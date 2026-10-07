package com.codexaniket.essentials.service;

import com.codexaniket.essentials.config.AppProperties;
import com.codexaniket.essentials.dto.PlaceDto;
import com.codexaniket.essentials.dto.SearchRequest;
import com.codexaniket.essentials.dto.SearchResponse;
import com.codexaniket.essentials.exception.ApiException;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.Place;
import com.codexaniket.essentials.osm.OsmUnavailableException;
import com.codexaniket.essentials.repository.FavoriteRepository;
import com.codexaniket.essentials.repository.PlaceRepository;
import com.codexaniket.essentials.util.GeoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * The heart of the app: "what essentials are near this point?"
 *
 * 1. Make sure OpenStreetMap data for this area is cached in MySQL.
 * 2. Ask MySQL for places inside a bounding box (fast, uses an index).
 * 3. Compute the real distance of each one, drop those outside the circle.
 * 4. Filter by keyword, sort nearest first, cut to the limit.
 */
@Service
public class PlaceSearchService {

    public static final double MAX_RADIUS_KM = 10;

    private static final Logger log = LoggerFactory.getLogger(PlaceSearchService.class);

    private final PlaceRepository placeRepository;
    private final FavoriteRepository favoriteRepository;
    private final PlaceSyncService syncService;
    private final SearchHistoryService historyService;
    private final boolean osmEnabled;

    public PlaceSearchService(PlaceRepository placeRepository, FavoriteRepository favoriteRepository,
                              PlaceSyncService syncService, SearchHistoryService historyService,
                              AppProperties props) {
        this.placeRepository = placeRepository;
        this.favoriteRepository = favoriteRepository;
        this.syncService = syncService;
        this.historyService = historyService;
        this.osmEnabled = props.osm().enabled();
    }

    public SearchResponse search(SearchRequest req, AppUser user) {
        String notice = null;
        if (osmEnabled) {
            List<Category> categories = req.category() == null ? List.of(Category.values()) : List.of(req.category());
            try {
                syncService.ensureCached(categories, req.latitude(), req.longitude(), req.radiusKm());
            } catch (OsmUnavailableException e) {
                log.warn("Live map data unavailable, answering from the database only: {}", e.getMessage());
                notice = "Live map data could not be loaded right now, so these results come only "
                        + "from places already saved in the database.";
            }
        }

        GeoUtils.BoundingBox box = GeoUtils.boundingBox(req.latitude(), req.longitude(), req.radiusKm());
        List<Place> candidates = placeRepository.findInBox(
                box.minLat(), box.maxLat(), box.minLng(), box.maxLng(), req.category());

        String keyword = req.keyword() == null ? "" : req.keyword().trim().toLowerCase(Locale.ROOT);
        Set<Long> favoriteIds = user == null ? Set.of() : favoriteRepository.findPlaceIdsByUser(user);

        List<PlaceDto> results = candidates.stream()
                .filter(p -> keyword.isEmpty() || matchesKeyword(p, keyword))
                .map(p -> new Scored(p, GeoUtils.distanceKm(req.latitude(), req.longitude(), p.getLatitude(), p.getLongitude())))
                .filter(s -> s.distanceKm() <= req.radiusKm())
                .sorted(Comparator.comparingDouble(Scored::distanceKm))
                .limit(req.limit())
                .map(s -> PlaceDto.from(s.place(), s.distanceKm(), favoriteIds.contains(s.place().getId())))
                .toList();

        if (user != null) {
            historyService.record(user, req, results.size());
        }
        return new SearchResponse(req.latitude(), req.longitude(), req.radiusKm(), results.size(), notice, results);
    }

    public PlaceDto getById(long id, AppUser user) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Place " + id + " not found"));
        boolean favorite = user != null && favoriteRepository.findByUserAndPlaceId(user, id).isPresent();
        return PlaceDto.from(place, null, favorite);
    }

    private static boolean matchesKeyword(Place p, String keyword) {
        return contains(p.getName(), keyword)
                || contains(p.getAddress(), keyword)
                || contains(p.getCategory().getLabel(), keyword);
    }

    private static boolean contains(String text, String keyword) {
        return text != null && text.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private record Scored(Place place, double distanceKm) {
    }
}
