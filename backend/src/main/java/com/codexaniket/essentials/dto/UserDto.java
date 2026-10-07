package com.codexaniket.essentials.dto;

import com.codexaniket.essentials.model.AppUser;

public record UserDto(Long id, String name, String email) {

    public static UserDto from(AppUser user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail());
    }
}
