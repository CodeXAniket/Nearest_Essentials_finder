package com.codexaniket.essentials.controller;

import com.codexaniket.essentials.auth.CurrentUser;
import com.codexaniket.essentials.dto.PlaceDto;
import com.codexaniket.essentials.dto.SearchHistoryDto;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.service.FavoriteService;
import com.codexaniket.essentials.service.SearchHistoryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Everything under /api/me belongs to the logged-in user. */
@RestController
@RequestMapping("/api/me")
public class UserDataController {

    private final FavoriteService favoriteService;
    private final SearchHistoryService historyService;

    public UserDataController(FavoriteService favoriteService, SearchHistoryService historyService) {
        this.favoriteService = favoriteService;
        this.historyService = historyService;
    }

    @GetMapping("/favorites")
    public List<PlaceDto> favorites(@CurrentUser AppUser user) {
        return favoriteService.list(user);
    }

    @PostMapping("/favorites/{placeId}")
    public PlaceDto addFavorite(@CurrentUser AppUser user, @PathVariable long placeId) {
        return favoriteService.add(user, placeId);
    }

    @DeleteMapping("/favorites/{placeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(@CurrentUser AppUser user, @PathVariable long placeId) {
        favoriteService.remove(user, placeId);
    }

    @GetMapping("/searches")
    public List<SearchHistoryDto> searches(@CurrentUser AppUser user) {
        return historyService.recent(user);
    }

    @DeleteMapping("/searches")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearSearches(@CurrentUser AppUser user) {
        historyService.clear(user);
    }
}
