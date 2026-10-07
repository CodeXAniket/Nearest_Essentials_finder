package com.codexaniket.essentials.service;

import com.codexaniket.essentials.dto.SearchHistoryDto;
import com.codexaniket.essentials.dto.SearchRequest;
import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.SearchHistory;
import com.codexaniket.essentials.repository.SearchHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SearchHistoryService {

    private final SearchHistoryRepository repository;

    public SearchHistoryService(SearchHistoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(AppUser user, SearchRequest req, int resultCount) {
        repository.save(new SearchHistory(user, req.category(), blankToNull(req.keyword()), blankToNull(req.label()),
                req.latitude(), req.longitude(), req.radiusKm(), resultCount));
    }

    @Transactional(readOnly = true)
    public List<SearchHistoryDto> recent(AppUser user) {
        return repository.findTop20ByUserOrderByCreatedAtDesc(user).stream()
                .map(SearchHistoryDto::from)
                .toList();
    }

    @Transactional
    public void clear(AppUser user) {
        repository.deleteByUser(user);
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String trimmed = s.trim();
        return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
    }
}
