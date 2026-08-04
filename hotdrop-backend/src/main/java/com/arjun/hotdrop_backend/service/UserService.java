package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.*;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponseOnSearchDto getUserByHotDropId(String hotdropId, String currentLoggedInHotdropId);
    FollowResponseDto toggleFollowUser(UUID userIdToFollow, String currentHotdropId);
    List<FollowerUserDto> getUserFollowers(UUID profileUserId, String currentHotdropId);
    UserResponseDto updateProfileDetails(UUID userIdFromParams, String currentHotdropId, ProfileUpdateRequestDto requestDto);
    MeResponseDto getMeByHotdropId(String hotdropId);
    MeResponseDto getMe(UUID userId);
    List<UserResponseDto> getFollowersList(UUID userId);
    List<PostResponseDto.UserSummaryDto> searchTop5Users(String query);
    List<UserResponseDto> getFollowingList(UUID userId);
}
