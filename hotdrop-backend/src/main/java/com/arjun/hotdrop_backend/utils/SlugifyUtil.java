package com.arjun.hotdrop_backend.utils;

import com.github.slugify.Slugify;

public class SlugifyUtil {

    // Initialize slugify instance with lowercasing enabled natively
    private static final Slugify slg = Slugify.builder().lowerCase(true).build();

    public static String generateSlug(String input) {
        if (input == null || input.isBlank()) {
            return "hotdrop-" + System.currentTimeMillis();
        }
        // Creates clean safe slug text and appends active UNIX timestamp epoch
        return slg.slugify(input) + "-" + System.currentTimeMillis();
    }
}