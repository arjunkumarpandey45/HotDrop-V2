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
        log.info("Starting post image upload to Cloudinary (file size: {} bytes)", file != null ? file.getSize() : 0);
        try {
            if (file == null || file.isEmpty()) {
                log.error("Cannot upload post image: file is empty or missing");
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

            log.info("Post image uploaded successfully to Cloudinary. Public ID: {}", publicId);
            return Map.of("url", url, "publicId", publicId);

        } catch (IOException e) {
            log.error("Failed to upload post image to Cloudinary: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> uploadImageForProfileImage(MultipartFile file) {
        log.info("Starting profile image upload to Cloudinary (file size: {} bytes)", file != null ? file.getSize() : 0);
        try {
            if (file == null || file.isEmpty()) {
                log.error("Cannot upload profile image: file is empty or missing");
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

            log.info("Profile image uploaded successfully to Cloudinary. Public ID: {}", publicId);
            return Map.of("url", url, "publicId", publicId);

        } catch (IOException e) {
            log.error("Failed to upload profile image to Cloudinary: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }

    @Override
    public void deleteImage(String publicId) {
        log.info("Deleting image from Cloudinary with publicId: {}", publicId);
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Successfully deleted image from Cloudinary with publicId: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary for publicId {}: {}", publicId, e.getMessage());
        }
    }
}
