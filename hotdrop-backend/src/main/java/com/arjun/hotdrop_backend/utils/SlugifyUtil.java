package com.arjun.hotdrop_backend.utils;

import com.github.slugify.Slugify;

public class SlugifyUtil {

    private static final Slugify slg = Slugify.builder().lowerCase(true).build();

    public static String generateSlug(String input) {
        if (input == null || input.isBlank()) {
            return "hotdrop-" + System.currentTimeMillis();
        }

        return slg.slugify(input) + "-" + System.currentTimeMillis();
    }
}