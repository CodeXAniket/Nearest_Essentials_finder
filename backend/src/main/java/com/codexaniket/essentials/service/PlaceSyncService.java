package com.codexaniket.essentials.service;

import com.codexaniket.essentials.config.AppProperties;
import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.Place;
import com.codexaniket.essentials.model.SyncedArea;
import com.codexaniket.essentials.osm.OsmPlace;
import com.codexaniket.essentials.osm.OverpassClient;
import com.codexaniket.essentials.repository.PlaceRepository;
import com.codexaniket.essentials.repository.SyncedAreaRepository;
import com.codexaniket.essentials.util.GeoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Keeps the MySQL "places" table filled for the areas people search in.
 *
 * Before a search we ask: "have we downloaded this category around here in the
 * last N hours?" If yes, MySQL already has the answer. If not, we fetch it once
 * from OpenStreetMap, save it, and remember the circle we covered.
 */
@Service
public class PlaceSyncService {

    private static final Logger log = LoggerFactory.getLogger(PlaceSyncService.class);
    private static final int IN_CLAUSE_CHUNK = 500;

    private final OverpassClient overpassClient;
    private final PlaceRepository placeRepository;
    private final SyncedAreaRepository syncedAreaRepository;
    private final TransactionTemplate transactionTemplate;
    private final Duration cacheDuration;

    public PlaceSyncService(OverpassClient overpassClient, PlaceRepository placeRepository,
                            SyncedAreaRepository syncedAreaRepository, TransactionTemplate transactionTemplate,
                            AppProperties props) {
        this.overpassClient = overpassClient;
        this.placeRepository = placeRepository;
        this.syncedAreaRepository = syncedAreaRepository;
        this.transactionTemplate = transactionTemplate;
        this.cacheDuration = Duration.ofHours(props.osm().cacheHours());
    }

    /**
     * Makes sure every category in the list is cached for this circle.
     * synchronized: two people searching the same spot at the same time should
     * cause one download, not two (and not duplicate rows).
     *
     * @throws com.codexaniket.essentials.osm.OsmUnavailableException when OSM cannot be reached
     */
    public synchronized void ensureCached(Collection<Category> categories, double lat, double lng, double radiusKm) {
        List<Category> missing = categories.stream()
                .filter(c -> !isCovered(c, lat, lng, radiusKm))
                .toList();
        if (missing.isEmpty()) {
            return;
        }

        // Network call happens outside the DB transaction so we never hold a connection while waiting.
        long start = System.currentTimeMillis();
        List<OsmPlace> found = overpassClient.findAround(missing, lat, lng, radiusKm);
        log.info("Fetched {} places from OpenStreetMap for {} in {} ms",
                found.size(), missing, System.currentTimeMillis() - start);

        transactionTemplate.executeWithoutResult(status -> {
            upsert(found, missing);
            missing.forEach(c -> syncedAreaRepository.save(new SyncedArea(c, lat, lng, radiusKm)));
        });
    }

    /** True if a fresh synced circle fully contains the requested circle. */
    boolean isCovered(Category category, double lat, double lng, double radiusKm) {
        Instant freshAfter = Instant.now().minus(cacheDuration);
        // A covering circle's centre can't be further away than the biggest radius we allow.
        GeoUtils.BoundingBox box = GeoUtils.boundingBox(lat, lng, PlaceSearchService.MAX_RADIUS_KM);
        return syncedAreaRepository
                .findByCategoryAndSyncedAtAfterAndLatitudeBetweenAndLongitudeBetween(
                        category, freshAfter, box.minLat(), box.maxLat(), box.minLng(), box.maxLng())
                .stream()
                .anyMatch(area -> GeoUtils.distanceKm(area.getLatitude(), area.getLongitude(), lat, lng)
                        + radiusKm <= area.getRadiusKm() + 0.001);
    }

    /** Insert new places, update ones we already have (matched by OSM id). */
    private void upsert(List<OsmPlace> found, List<Category> categories) {
        Map<String, OsmPlace> byOsmId = new LinkedHashMap<>();
        for (OsmPlace p : found) {
            byOsmId.putIfAbsent(p.osmId(), p);
        }

        Map<String, Place> existing = new HashMap<>();
        List<String> ids = new ArrayList<>(byOsmId.keySet());
        for (int i = 0; i < ids.size(); i += IN_CLAUSE_CHUNK) {
            placeRepository.findByOsmIdIn(ids.subList(i, Math.min(ids.size(), i + IN_CLAUSE_CHUNK)))
                    .forEach(p -> existing.put(p.getOsmId(), p));
        }

        List<Place> toSave = new ArrayList<>();
        for (OsmPlace osm : byOsmId.values()) {
            Category category = categories.stream().filter(c -> c.matches(osm.tags())).findFirst().orElse(null);
            if (category == null) {
                continue;
            }
            Place place = existing.getOrDefault(osm.osmId(), new Place());
            place.setOsmId(osm.osmId());
            place.setCategory(category);
            place.setName(truncate(nameFor(osm, category), 255));
            place.setLatitude(osm.latitude());
            place.setLongitude(osm.longitude());
            place.setAddress(truncate(osm.address(), 500));
            place.setPhone(truncate(osm.tag("phone", "contact:phone", "contact:mobile"), 60));
            place.setOpeningHours(truncate(osm.tag("opening_hours"), 255));
            place.setWebsite(truncate(osm.tag("website", "contact:website"), 255));
            toSave.add(place);
        }
        placeRepository.saveAll(toSave);
    }

    private static String nameFor(OsmPlace osm, Category category) {
        String name = osm.tag("name:en", "name", "brand", "operator");
        return name != null ? name : category.getLabel() + " (unnamed)";
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
