package com.arjun.hotdrop_backend.controller;

import com.arjun.hotdrop_backend.dto.ApiResponse;
import com.arjun.hotdrop_backend.dto.UserResponseOnSearchDto;
import com.arjun.hotdrop_backend.service.UserService;
import com.arjun.hotdrop_backend.utils.ResponseHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
   private final UserService userService;
   @GetMapping("/{hotdropId}")
    public ResponseEntity<ApiResponse<UserResponseOnSearchDto>> userByHotDropId(@PathVariable String hotdropId){
       UserResponseOnSearchDto user=userService.getUserByHotDropId(hotdropId);
       return ResponseHandler.generateResponse(
               HttpStatus.OK,"User fetched successfully",user
       );
   }
}
