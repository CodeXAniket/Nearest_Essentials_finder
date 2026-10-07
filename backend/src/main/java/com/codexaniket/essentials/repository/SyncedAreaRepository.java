package com.codexaniket.essentials.repository;

import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.SyncedArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface SyncedAreaRepository extends JpaRepository<SyncedArea, Long> {

    List<SyncedArea> findByCategoryAndSyncedAtAfterAndLatitudeBetweenAndLongitudeBetween(
            Category category, Instant after,
            double minLat, double maxLat, double minLng, double maxLng);
}
