package com.arjun.hotdrop_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;
@Data
@AllArgsConstructor
@Builder
@NoArgsConstructor
public class UserResponseDto {
    private UUID id;

    private String firstName;
    private String lastName;

    private String username;

    private String email;

    private Set<String> roles;
}
