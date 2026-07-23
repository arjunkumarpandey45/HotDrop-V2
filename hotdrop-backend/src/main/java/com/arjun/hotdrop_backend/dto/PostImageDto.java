package com.arjun.hotdrop_backend.dto;

import java.util.UUID;

public record PostImageDto(
        UUID id,
        String url,
        String publicId
) {}
