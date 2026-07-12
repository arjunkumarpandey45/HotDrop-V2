package com.arjun.hotdrop_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class ForgotPasswordRequestDto {


        @NotBlank(message = "Email cannot be blank")
        @Email(message = "Please provide a valid email address")
        private String email;

}
