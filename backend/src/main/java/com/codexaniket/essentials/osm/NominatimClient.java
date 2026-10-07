package com.codexaniket.essentials.osm;

import com.codexaniket.essentials.config.AppProperties;
import com.codexaniket.essentials.dto.GeocodeResult;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Arrays;
import java.util.List;

/**
 * Nominatim is OpenStreetMap's search box: it turns text like
 * "VIT Vellore" into latitude/longitude ("geocoding").
 */
@Component
public class NominatimClient {

    private final RestClient restClient;
    private final AppProperties.Osm config;

    public NominatimClient(RestClient osmRestClient, AppProperties props) {
        this.restClient = osmRestClient;
        this.config = props.osm();
    }

    public List<GeocodeResult> search(String text) {
        NominatimResult[] results;
        try {
            results = restClient.get()
                    .uri(config.nominatimUrl() + "/search?format=jsonv2&limit=5&q={q}", text)
                    .retrieve()
                    .body(NominatimResult[].class);
        } catch (RestClientException e) {
            throw new OsmUnavailableException("Nominatim request failed: " + e.getMessage(), e);
        }
        if (results == null) {
            return List.of();
        }
        return Arrays.stream(results)
                .map(r -> new GeocodeResult(r.displayName(), Double.parseDouble(r.lat()), Double.parseDouble(r.lon())))
                .toList();
    }

    /** Nominatim sends lat/lon as strings. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record NominatimResult(@JsonProperty("display_name") String displayName, String lat, String lon) {
    }
}
