package com.codexaniket.essentials.dto;

import com.codexaniket.essentials.model.Category;

public record CategoryDto(String id, String label, String color) {

    public static CategoryDto from(Category category) {
        return new CategoryDto(category.name(), category.getLabel(), category.getColor());
    }
}
