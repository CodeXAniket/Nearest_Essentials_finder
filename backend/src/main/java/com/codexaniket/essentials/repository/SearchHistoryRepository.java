package com.codexaniket.essentials.repository;

import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    List<SearchHistory> findTop20ByUserOrderByCreatedAtDesc(AppUser user);

    void deleteByUser(AppUser user);
}
