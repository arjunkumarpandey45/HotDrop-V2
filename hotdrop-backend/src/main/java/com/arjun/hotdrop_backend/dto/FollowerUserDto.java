package com.arjun.hotdrop_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowerUserDto {

    private UUID id;
    private String hotdropId;
    private String firstName;
    private String lastName;
    private String profileImageUrl;


    @JsonProperty("isFollowing")
    private boolean isFollowing;
}