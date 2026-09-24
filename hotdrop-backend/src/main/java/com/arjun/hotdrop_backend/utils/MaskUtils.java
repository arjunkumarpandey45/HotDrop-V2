package com.arjun.hotdrop_backend.utils;

/**
 * Utility for masking sensitive data and PII such as email addresses in logs.
 */
public final class MaskUtils {

    private MaskUtils() {}

    /**
     * Masks an email address for safe logging.
     * Example: "john.doe@example.com" -> "j***e@example.com"
     * Example: "a@b.com" -> "a***@b.com"
     */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "[EMPTY_EMAIL]";
        }
        String clean = email.trim();
        int atIndex = clean.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }
        String local = clean.substring(0, atIndex);
        String domain = clean.substring(atIndex);

        if (local.length() <= 1) {
            return local + "***" + domain;
        } else if (local.length() == 2) {
            return local.charAt(0) + "***" + domain;
        } else {
            return local.charAt(0) + "***" + local.charAt(local.length() - 1) + domain;
        }
    }

    /**
     * Masks an identifier that could be either a hotdropId or an email.
     * If it contains '@', it is treated as an email and masked.
     * Otherwise, it is returned as-is (hotdropId is a public username handle).
     */
    public static String maskIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return "[EMPTY_ID]";
        }
        String clean = identifier.trim();
        if (clean.contains("@")) {
            return maskEmail(clean);
        }
        return clean;
    }
}
