package com.arjun.hotdrop_backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface CloudinaryService {
    Map<String, String> uploadImageForPost(MultipartFile file);
    Map<String, String> uploadImageForProfileImage(MultipartFile file);
    void deleteImage(String publicId);
}