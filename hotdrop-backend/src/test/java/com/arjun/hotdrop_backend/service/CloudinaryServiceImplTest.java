package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.service.impl.CloudinaryServiceImpl;
import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryServiceImpl cloudinaryService;

    @Mock
    private MultipartFile multipartFile;

    @BeforeEach
    void setUp() {
        lenient().when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Nested
    @DisplayName("Upload Image For Post Tests")
    class UploadImageForPostTests {

        @Test
        @DisplayName("Should successfully upload image for post and return url and publicId")
        void uploadImageForPost_Success() throws IOException {
            byte[] fileBytes = "test image data".getBytes();
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getBytes()).thenReturn(fileBytes);

            Map<String, Object> mockCloudinaryResponse = Map.of(
                    "secure_url", "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
                    "public_id", "sample_public_id"
            );
            when(uploader.upload(eq(fileBytes), anyMap())).thenReturn(mockCloudinaryResponse);

            Map<String, String> result = cloudinaryService.uploadImageForPost(multipartFile);

            assertThat(result).isNotNull();
            assertThat(result.get("url")).isEqualTo("https://res.cloudinary.com/demo/image/upload/v1/sample.jpg");
            assertThat(result.get("publicId")).isEqualTo("sample_public_id");
            verify(uploader).upload(eq(fileBytes), anyMap());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when post file is null")
        void uploadImageForPost_NullFile_ThrowsException() {
            assertThatThrownBy(() -> cloudinaryService.uploadImageForPost(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cannot upload empty file.");

            verifyNoInteractions(uploader);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when post file is empty")
        void uploadImageForPost_EmptyFile_ThrowsException() {
            when(multipartFile.isEmpty()).thenReturn(true);

            assertThatThrownBy(() -> cloudinaryService.uploadImageForPost(multipartFile))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cannot upload empty file.");

            verifyNoInteractions(uploader);
        }

        @Test
        @DisplayName("Should throw RuntimeException when upload throws IOException")
        void uploadImageForPost_IOException_ThrowsRuntimeException() throws IOException {
            byte[] fileBytes = "test image data".getBytes();
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getBytes()).thenReturn(fileBytes);
            when(uploader.upload(eq(fileBytes), anyMap())).thenThrow(new IOException("Cloudinary timeout"));

            assertThatThrownBy(() -> cloudinaryService.uploadImageForPost(multipartFile))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Image upload failed due to an external service error.");
        }
    }

    @Nested
    @DisplayName("Upload Image For Profile Picture Tests")
    class UploadImageForProfileImageTests {

        @Test
        @DisplayName("Should successfully upload profile image and return url and publicId")
        void uploadImageForProfileImage_Success() throws IOException {
            byte[] fileBytes = "avatar data".getBytes();
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getBytes()).thenReturn(fileBytes);

            Map<String, Object> mockCloudinaryResponse = Map.of(
                    "secure_url", "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
                    "public_id", "avatar_public_id"
            );
            when(uploader.upload(eq(fileBytes), anyMap())).thenReturn(mockCloudinaryResponse);

            Map<String, String> result = cloudinaryService.uploadImageForProfileImage(multipartFile);

            assertThat(result).isNotNull();
            assertThat(result.get("url")).isEqualTo("https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg");
            assertThat(result.get("publicId")).isEqualTo("avatar_public_id");
            verify(uploader).upload(eq(fileBytes), anyMap());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when profile picture file is null")
        void uploadImageForProfileImage_NullFile_ThrowsException() {
            assertThatThrownBy(() -> cloudinaryService.uploadImageForProfileImage(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cannot upload empty file.");

            verifyNoInteractions(uploader);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when profile picture file is empty")
        void uploadImageForProfileImage_EmptyFile_ThrowsException() {
            when(multipartFile.isEmpty()).thenReturn(true);

            assertThatThrownBy(() -> cloudinaryService.uploadImageForProfileImage(multipartFile))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cannot upload empty file.");

            verifyNoInteractions(uploader);
        }

        @Test
        @DisplayName("Should throw RuntimeException when profile picture upload throws IOException")
        void uploadImageForProfileImage_IOException_ThrowsRuntimeException() throws IOException {
            byte[] fileBytes = "avatar data".getBytes();
            when(multipartFile.isEmpty()).thenReturn(false);
            when(multipartFile.getBytes()).thenReturn(fileBytes);
            when(uploader.upload(eq(fileBytes), anyMap())).thenThrow(new IOException("Network error"));

            assertThatThrownBy(() -> cloudinaryService.uploadImageForProfileImage(multipartFile))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Image upload failed due to an external service error.");
        }
    }

    @Nested
    @DisplayName("Delete Image Tests")
    class DeleteImageTests {

        @Test
        @DisplayName("Should destroy image on Cloudinary")
        void deleteImage_Success() throws IOException {
            cloudinaryService.deleteImage("public_id_to_delete");

            verify(uploader).destroy(eq("public_id_to_delete"), anyMap());
        }

        @Test
        @DisplayName("Should catch IOException during delete and handle gracefully")
        void deleteImage_IOException_HandledGracefully() throws IOException {
            when(uploader.destroy(eq("failing_id"), anyMap())).thenThrow(new IOException("Delete failed"));

            // Should not throw exception
            cloudinaryService.deleteImage("failing_id");

            verify(uploader).destroy(eq("failing_id"), anyMap());
        }
    }
}
