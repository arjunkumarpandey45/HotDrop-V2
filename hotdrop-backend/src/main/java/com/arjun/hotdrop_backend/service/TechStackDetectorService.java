package com.arjun.hotdrop_backend.service;

import java.util.Set;

public interface TechStackDetectorService {
    Set<String> detectTechStack(String url);
}
