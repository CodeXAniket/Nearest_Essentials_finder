package com.codexaniket.essentials.controller;

import com.codexaniket.essentials.auth.CurrentUser;
import com.codexaniket.essentials.dto.CategoryDto;
import com.codexaniket.essentials.dto.GeocodeResult;
import com.codexaniket.essentials.dto.PlaceDto;
import com.codexaniket.essentials.dto.SearchRequest;
import com.codexaniket.essentials.dto.SearchResponse;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.service.GeocodingService;
import com.codexaniket.essentials.service.PlaceSearchService;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PlaceController {

    private final PlaceSearchService searchService;
    private final GeocodingService geocodingService;

    public PlaceController(PlaceSearchService searchService, GeocodingService geocodingService) {
        this.searchService = searchService;
        this.geocodingService = geocodingService;
    }

    /** GET /api/categories — what the user can search for. */
    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return Arrays.stream(Category.values()).map(CategoryDto::from).toList();
    }

    /**
     * GET /api/places/nearby?lat=12.97&amp;lng=79.16&amp;radiusKm=2&amp;category=PHARMACY&amp;q=apollo
     */
    @GetMapping("/places/nearby")
    public SearchResponse nearby(
            @RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
            @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng,
            @RequestParam(defaultValue = "2") @DecimalMin("0.2") @DecimalMax("10") double radiusKm,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(defaultValue = "60") @Min(1) @Max(200) int limit,
            @RequestParam(required = false) @Size(max = 200) String label,
            @CurrentUser(required = false) AppUser user) {
        return searchService.search(new SearchRequest(lat, lng, radiusKm, category, q, limit, label), user);
    }

    /** GET /api/places/42 */
    @GetMapping("/places/{id}")
    public PlaceDto place(@PathVariable long id, @CurrentUser(required = false) AppUser user) {
        return searchService.getById(id, user);
    }

    /** GET /api/geocode?q=Katpadi Vellore — turn typed text into coordinates. */
    @GetMapping("/geocode")
    public List<GeocodeResult> geocode(@RequestParam @NotBlank @Size(min = 2, max = 200) String q) {
        return geocodingService.search(q);
    }
}
