package com.codexaniket.essentials.osm;

import com.codexaniket.essentials.config.AppProperties;
import com.codexaniket.essentials.model.Category;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Talks to the Overpass API, a free read-only query service for OpenStreetMap data.
 *
 * For "pharmacies within 2 km" it sends a query like:
 * <pre>
 * [out:json][timeout:15][maxsize:33554432];
 * (
 *   nwr["amenity"="pharmacy"](around:2000,12.9692,79.1559);
 *   nwr["shop"="chemist"](around:2000,12.9692,79.1559);
 * );
 * out center tags;
 * </pre>
 * "nwr" = nodes, ways and relations (a shop can be a point or a building outline),
 * "out center" asks for one centre point per building.
 */
@Component
public class OverpassClient {

    private static final Logger log = LoggerFactory.getLogger(OverpassClient.class);

    private final RestClient restClient;
    private final AppProperties.Osm config;

    public OverpassClient(RestClient osmRestClient, AppProperties props) {
        this.restClient = osmRestClient;
        this.config = props.osm();
    }

    /**
     * Tries each configured Overpass server in turn and returns the first good answer.
     *
     * @throws OsmUnavailableException if every server failed
     */
    public List<OsmPlace> findAround(Collection<Category> categories, double lat, double lng, double radiusKm) {
        String query = buildQuery(categories, lat, lng, radiusKm);
        OsmUnavailableException lastError = null;
        for (String url : config.overpassUrls()) {
            try {
                return toPlaces(post(url, query));
            } catch (OsmUnavailableException e) {
                log.warn("Overpass server {} failed: {}", url, e.getMessage());
                lastError = e;
            }
        }
        throw lastError != null ? lastError : new OsmUnavailableException("No Overpass servers configured", null);
    }

    private OverpassResponse post(String url, String query) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("data", query);
        OverpassResponse response;
        try {
            response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(OverpassResponse.class);
        } catch (RestClientException e) {
            throw new OsmUnavailableException(e.getMessage(), e);
        }
        // Overpass reports timeouts inside a 200 response as a "remark"; the data is then incomplete.
        if (response != null && response.remark() != null && response.remark().contains("error")) {
            throw new OsmUnavailableException(response.remark(), null);
        }
        return response;
    }

    private static List<OsmPlace> toPlaces(OverpassResponse response) {
        if (response == null || response.elements() == null) {
            return List.of();
        }
        List<OsmPlace> places = new ArrayList<>();
        for (Element el : response.elements()) {
            Double pLat = el.lat() != null ? el.lat() : el.center() != null ? el.center().lat() : null;
            Double pLon = el.lon() != null ? el.lon() : el.center() != null ? el.center().lon() : null;
            if (pLat == null || pLon == null || el.tags() == null) {
                continue;
            }
            places.add(new OsmPlace(el.type() + "/" + el.id(), pLat, pLon, el.tags()));
        }
        return places;
    }

    public static String buildQuery(Collection<Category> categories, double lat, double lng, double radiusKm) {
        int radiusMeters = (int) Math.round(radiusKm * 1000);
        String around = String.format(Locale.ROOT, "(around:%d,%.6f,%.6f)", radiusMeters, lat, lng);

        // Small declared limits (15 s, 32 MB) matter: a busy Overpass server admits
        // "cheap" queries much more readily than ones asking for its default 512 MB.
        StringBuilder q = new StringBuilder("[out:json][timeout:15][maxsize:33554432];\n(\n");
        for (Category category : categories) {
            for (Category.OsmTag tag : category.getOsmTags()) {
                q.append("  nwr").append(tag.toOverpassFilter()).append(around).append(";\n");
            }
        }
        q.append(");\nout center tags;");
        return q.toString();
    }

    // Shapes of the Overpass JSON we care about. Unknown fields are ignored.

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OverpassResponse(List<Element> elements, String remark) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Element(String type, long id, Double lat, Double lon, Center center, Map<String, String> tags) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Center(double lat, double lon) {
    }
}
