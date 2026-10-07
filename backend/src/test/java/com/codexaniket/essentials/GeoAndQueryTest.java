package com.codexaniket.essentials;

import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.osm.OsmPlace;
import com.codexaniket.essentials.osm.OverpassClient;
import com.codexaniket.essentials.util.GeoUtils;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GeoAndQueryTest {

    @Test
    void oneDegreeOfLatitudeIsAbout111Km() {
        assertThat(GeoUtils.distanceKm(12.0, 79.0, 13.0, 79.0)).isCloseTo(111.19, within(0.1));
    }

    @Test
    void samePointIsZeroKmAway() {
        assertThat(GeoUtils.distanceKm(12.97, 79.16, 12.97, 79.16)).isZero();
    }

    @Test
    void boundingBoxContainsTheWholeCircle() {
        GeoUtils.BoundingBox box = GeoUtils.boundingBox(12.97, 79.16, 2);
        // Points exactly 2 km north and east must still be inside the box.
        assertThat(GeoUtils.distanceKm(12.97, 79.16, box.maxLat(), 79.16)).isCloseTo(2, within(0.01));
        assertThat(GeoUtils.distanceKm(12.97, 79.16, 12.97, box.maxLng())).isCloseTo(2, within(0.01));
    }

    @Test
    void categoriesMatchTheirOsmTags() {
        assertThat(Category.PHARMACY.matches(Map.of("amenity", "pharmacy"))).isTrue();
        assertThat(Category.PHARMACY.matches(Map.of("shop", "chemist"))).isTrue();
        assertThat(Category.GROCERY.matches(Map.of("shop", "supermarket"))).isTrue();
        assertThat(Category.GROCERY.matches(Map.of("shop", "bakery"))).isFalse();
        assertThat(Category.PHARMACY.getOsmTags().get(0).toOverpassFilter())
                .isEqualTo("[\"amenity\"=\"pharmacy\"]");
    }

    @Test
    void overpassQueryAsksForEveryTagOfTheCategoryInsideTheCircle() {
        String query = OverpassClient.buildQuery(List.of(Category.PHARMACY), 12.9692, 79.1559, 1.5);
        assertThat(query)
                .startsWith("[out:json][timeout:15]")
                .contains("nwr[\"amenity\"=\"pharmacy\"](around:1500,12.969200,79.155900);")
                .contains("nwr[\"shop\"=\"chemist\"](around:1500,12.969200,79.155900);")
                .endsWith("out center tags;");
    }

    @Test
    void addressIsBuiltFromAddrTags() {
        OsmPlace place = new OsmPlace("node/1", 0, 0, Map.of(
                "addr:housenumber", "12",
                "addr:street", "MG Road",
                "addr:city", "Vellore",
                "addr:postcode", "632007"));
        assertThat(place.address()).isEqualTo("12, MG Road, Vellore 632007");
    }
}
