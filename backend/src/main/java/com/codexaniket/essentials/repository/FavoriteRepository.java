package com.codexaniket.essentials.repository;

import com.codexaniket.essentials.model.AppUser;
import com.codexaniket.essentials.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserOrderByCreatedAtDesc(AppUser user);

    Optional<Favorite> findByUserAndPlaceId(AppUser user, Long placeId);

    @Query("select f.place.id from Favorite f where f.user = :user")
    Set<Long> findPlaceIdsByUser(@Param("user") AppUser user);
}
