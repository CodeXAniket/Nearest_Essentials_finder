package com.codexaniket.essentials;

import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.Place;
import com.codexaniket.essentials.repository.PlaceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs the real app against an in-memory H2 database with OpenStreetMap switched off. */
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    // A point in Vellore; the places below are placed at known distances from it.
    private static final double LAT = 12.9692;
    private static final double LNG = 79.1559;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private ObjectMapper json;

    private Place nearPharmacy;

    @BeforeEach
    void seed() {
        placeRepository.deleteAll();
        nearPharmacy = save("Apollo Pharmacy", Category.PHARMACY, LAT + 0.003, LNG);  // ~0.33 km
        save("MedPlus", Category.PHARMACY, LAT + 0.009, LNG);                      // ~1.0 km
        save("Far Away Chemist", Category.PHARMACY, LAT + 0.05, LNG);              // ~5.6 km
        save("Fresh Mart", Category.GROCERY, LAT, LNG + 0.004);                    // ~0.43 km
    }

    @Test
    void nearbySearchSortsByDistanceAndRespectsRadius() throws Exception {
        mvc.perform(get("/api/places/nearby")
                        .param("lat", String.valueOf(LAT)).param("lng", String.valueOf(LNG))
                        .param("radiusKm", "2").param("category", "PHARMACY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.places[*].name", contains("Apollo Pharmacy", "MedPlus")));
    }

    @Test
    void searchWithoutCategoryReturnsAllKindsAndKeywordFilters() throws Exception {
        mvc.perform(get("/api/places/nearby").param("lat", String.valueOf(LAT)).param("lng", String.valueOf(LNG)))
                .andExpect(jsonPath("$.places[*].name", contains("Apollo Pharmacy", "Fresh Mart", "MedPlus")));

        mvc.perform(get("/api/places/nearby").param("lat", String.valueOf(LAT)).param("lng", String.valueOf(LNG))
                        .param("q", "fresh"))
                .andExpect(jsonPath("$.places[*].name", contains("Fresh Mart")));
    }

    @Test
    void invalidInputGivesA400WithAMessage() throws Exception {
        mvc.perform(get("/api/places/nearby").param("lat", "12").param("lng", "79").param("radiusKm", "50"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        mvc.perform(get("/api/places/nearby").param("lat", "12").param("lng", "79").param("category", "SPACESHIP"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void userDataNeedsLogin() throws Exception {
        mvc.perform(get("/api/me/favorites")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me/favorites").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerLoginFavoritesAndHistoryFlow() throws Exception {
        String email = "student-" + UUID.randomUUID() + "@example.com";
        String token = register("Aniket", email, "secret123");

        // Registering the same email again is rejected.
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(body("Someone", email, "secret123")))
                .andExpect(status().isConflict());

        // Wrong password fails, right password gives a new token.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"wrong-pass\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email.toUpperCase() + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.name").value("Aniket"));

        // Save a favourite; it shows up in the list and as favorite=true in searches.
        mvc.perform(post("/api/me/favorites/" + nearPharmacy.getId()).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(get("/api/me/favorites").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Apollo Pharmacy"));

        mvc.perform(get("/api/places/nearby").header("Authorization", "Bearer " + token)
                        .param("lat", String.valueOf(LAT)).param("lng", String.valueOf(LNG))
                        .param("category", "PHARMACY").param("label", "VIT Vellore"))
                .andExpect(jsonPath("$.places[0].favorite").value(true))
                .andExpect(jsonPath("$.places[1].favorite").value(false));

        // That search was recorded in the history.
        mvc.perform(get("/api/me/searches").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].locationLabel").value("VIT Vellore"))
                .andExpect(jsonPath("$[0].resultCount").value(2));

        mvc.perform(delete("/api/me/favorites/" + nearPharmacy.getId()).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/me/favorites").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$", hasSize(0)));

        // After logout the token stops working.
        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    private String register(String name, String email, String password) throws Exception {
        String response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(body(name, email, password)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(response);
        return node.get("token").asText();
    }

    private static String body(String name, String email, String password) {
        return "{\"name\":\"" + name + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    private Place save(String name, Category category, double lat, double lng) {
        Place p = new Place();
        p.setName(name);
        p.setCategory(category);
        p.setLatitude(lat);
        p.setLongitude(lng);
        return placeRepository.save(p);
    }
}
