package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.CloudinaryService;
import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public Map<String, String> uploadImageForPost(MultipartFile file) {
        log.info("Uploading post image ({} bytes)...", file != null ? file.getSize() : 0);
        try {
            if (file == null || file.isEmpty()) {
                log.error("Cannot upload post image: file is empty.");
                throw new RuntimeException("Cannot upload empty file.");
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "hotdrop_posts",
                    "resource_type", "image",
                    "transformation", new Transformation<>()
                            .width(1080).height(1080).crop("limit")
                            .quality("auto:good")
                            .fetchFormat("auto")
            ));

            String url = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            log.info("Uploaded post image with ID: {}", publicId);
            return Map.of("url", url, "publicId", publicId);

        } catch (IOException e) {
            log.error("Failed to upload post image: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> uploadImageForProfileImage(MultipartFile file) {
        log.info("Uploading profile picture ({} bytes)...", file != null ? file.getSize() : 0);
        try {
            if (file == null || file.isEmpty()) {
                log.error("Cannot upload profile picture: file is empty.");
                throw new RuntimeException("Cannot upload empty file.");
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "hotdrop_profile_picture",
                    "resource_type", "image",
                    "transformation", new Transformation<>()
                            .width(1080).height(1080).crop("limit")
                            .quality("auto:good")
                            .fetchFormat("auto")
            ));

            String url = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            log.info("Uploaded profile picture with ID: {}", publicId);
            return Map.of("url", url, "publicId", publicId);

        } catch (IOException e) {
            log.error("Failed to upload profile picture: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }

    @Override
    public void deleteImage(String publicId) {
        log.info("Deleting image with ID: {}", publicId);
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted image with ID: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete image {}: {}", publicId, e.getMessage());
        }
    }
}
