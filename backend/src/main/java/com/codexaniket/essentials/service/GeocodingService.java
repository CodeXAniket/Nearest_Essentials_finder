package com.codexaniket.essentials.service;

import com.codexaniket.essentials.config.AppProperties;
import com.codexaniket.essentials.dto.GeocodeResult;
import com.codexaniket.essentials.exception.ApiException;
import com.codexaniket.essentials.osm.NominatimClient;
import com.codexaniket.essentials.osm.OsmUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Turns typed locations into coordinates. Answers are kept in a small
 * in-memory cache because Nominatim asks apps not to repeat identical queries.
 */
@Service
public class GeocodingService {

    private static final int CACHE_SIZE = 200;

    private final NominatimClient nominatimClient;
    private final boolean enabled;
    private final Map<String, List<GeocodeResult>> cache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, List<GeocodeResult>> eldest) {
            return size() > CACHE_SIZE;
        }
    };

    public GeocodingService(NominatimClient nominatimClient, AppProperties props) {
        this.nominatimClient = nominatimClient;
        this.enabled = props.osm().enabled();
    }

    public List<GeocodeResult> search(String query) {
        if (!enabled) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Location search is turned off on this server");
        }
        String key = query.trim().toLowerCase(Locale.ROOT);
        synchronized (cache) {
            List<GeocodeResult> cached = cache.get(key);
            if (cached != null) {
                return cached;
            }
        }
        try {
            List<GeocodeResult> results = nominatimClient.search(query.trim());
            synchronized (cache) {
                cache.put(key, results);
            }
            return results;
        } catch (OsmUnavailableException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Location search is unavailable right now, try again shortly");
        }
    }
}
