package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostDto {

    @NotBlank(message = "Title required ")
    @Size(max = 255, message = "Title cannot exceed 255 characters.")
    private String title;

    @NotBlank(message = "Description can't be empty.")
    private String description;

    @NotBlank(message = "Project URL is mandatory.")
    @Size(max = 512, message = "URL size exceeds limits.")
    private String projectUrl;

    private String tags;
}