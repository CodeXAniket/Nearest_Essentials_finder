package com.codexaniket.essentials;

import com.codexaniket.essentials.dto.SearchRequest;
import com.codexaniket.essentials.dto.SearchResponse;
import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.osm.OsmPlace;
import com.codexaniket.essentials.osm.OsmUnavailableException;
import com.codexaniket.essentials.osm.OverpassClient;
import com.codexaniket.essentials.repository.PlaceRepository;
import com.codexaniket.essentials.repository.SyncedAreaRepository;
import com.codexaniket.essentials.service.PlaceSearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Checks the "download once, then answer from MySQL" caching logic with a fake Overpass. */
@SpringBootTest(properties = "app.osm.enabled=true")
class PlaceSyncServiceTest {

    private static final double LAT = 12.9692;
    private static final double LNG = 79.1559;

    @MockitoBean
    private OverpassClient overpassClient;

    @Autowired
    private PlaceSearchService searchService;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private SyncedAreaRepository syncedAreaRepository;

    @BeforeEach
    void clean() {
        syncedAreaRepository.deleteAll();
        placeRepository.deleteAll();
    }

    @Test
    void downloadsOnceThenServesSmallerSearchesFromTheDatabase() {
        when(overpassClient.findAround(any(), anyDouble(), anyDouble(), anyDouble())).thenReturn(List.of(
                new OsmPlace("node/1", LAT + 0.002, LNG, Map.of("amenity", "atm", "operator", "SBI")),
                new OsmPlace("way/2", LAT + 0.004, LNG, Map.of("amenity", "atm", "name", "HDFC ATM"))));

        SearchResponse first = searchService.search(request(3), null);
        assertThat(first.places()).extracting("name").containsExactly("SBI", "HDFC ATM");

        // A smaller circle inside the first one must not hit OpenStreetMap again.
        SearchResponse second = searchService.search(request(1), null);
        assertThat(second.count()).isEqualTo(2);
        verify(overpassClient, times(1)).findAround(any(), anyDouble(), anyDouble(), anyDouble());
        assertThat(placeRepository.count()).isEqualTo(2);
    }

    @Test
    void fallsBackToTheDatabaseWhenOpenStreetMapIsDown() {
        when(overpassClient.findAround(any(), anyDouble(), anyDouble(), anyDouble()))
                .thenThrow(new OsmUnavailableException("timeout", null));

        SearchResponse response = searchService.search(request(2), null);
        assertThat(response.notice()).contains("could not be loaded");
        assertThat(response.places()).isEmpty();
    }

    private static SearchRequest request(double radiusKm) {
        return new SearchRequest(LAT, LNG, radiusKm, Category.ATM, null, 50, null);
    }
}
