package com.arjun.hotdrop_backend.service;

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
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, String> uploadImageForPost(MultipartFile file) {
        try {
            if (file.isEmpty()) {
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

            return Map.of("url", url, "publicId", publicId);

        } catch (IOException e) {
            log.error("Failed to upload image file to Cloudinary cluster for post: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }
    public Map<String, String> uploadImageForProfileImage(MultipartFile file) {
        try {
            if (file.isEmpty()) {
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

            return Map.of("url", url, "publicId", publicId);

        } catch (IOException e) {
            log.error("Failed to upload image file to Cloudinary cluster for ProfileImage: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }
    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Successfully dropped resource asset from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.error("Cloudinary asset deletion failed for public_id {}: {}", publicId, e.getMessage());
        }
    }
}