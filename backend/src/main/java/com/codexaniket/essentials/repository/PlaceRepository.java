package com.codexaniket.essentials.repository;

import com.codexaniket.essentials.model.Category;
import com.codexaniket.essentials.model.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    List<Place> findByOsmIdIn(Collection<String> osmIds);

    /**
     * Cheap first pass: everything inside a lat/lng rectangle (uses the index).
     * The service then works out the exact distance and drops the corners.
     */
    @Query("""
            select p from Place p
            where p.latitude between :minLat and :maxLat
              and p.longitude between :minLng and :maxLng
              and (:category is null or p.category = :category)
            """)
    List<Place> findInBox(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
                          @Param("minLng") double minLng, @Param("maxLng") double maxLng,
                          @Param("category") Category category);
}
