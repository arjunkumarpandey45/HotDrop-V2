package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.dto.PostResponseDto;
import com.arjun.hotdrop_backend.dto.UserResponseOnSearchDto;
import com.arjun.hotdrop_backend.entity.Post;
import com.arjun.hotdrop_backend.entity.User;
import com.arjun.hotdrop_backend.mapper.PostMapperWithID;
import com.arjun.hotdrop_backend.mapper.PostMapper;
import com.arjun.hotdrop_backend.mapper.UserMapper;
import com.arjun.hotdrop_backend.repository.PostRepo;
import com.arjun.hotdrop_backend.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final PostRepo postRepo;
    private final UserRepo userRepo;
private  final UserMapper userMapper;
private final PostMapper postMapper;
    public UserResponseOnSearchDto getUserByHotDropId(String hotdropId) {

        User currentUser = userRepo.findByHotdropId(hotdropId)
                .orElseThrow(() -> {
                    log.error("Search failed: HotdropId '{}' does not exist in database", hotdropId);
                    return new RuntimeException("User profile not found with ID: " + hotdropId);
                });
        List<PostResponseDto> userPosts = new ArrayList<>();

        if (currentUser.getRoles() != null) {

            List<Post> allPosts = postRepo.findByUserId(currentUser.getId());

            for (Post post : allPosts) {

                if (post.getUser().getId().equals(currentUser.getId())) {

                    PostResponseDto postDto = postMapper.toResponseDto(post);

                    userPosts.add(postDto);
                }
            }
        }
        return UserResponseOnSearchDto.builder()
                .firstName(currentUser.getFirstName())
                .lastName(currentUser.getLastName())
                .hotdropId(currentUser.getHotdropId())
                .id(currentUser.getId())
                .email(currentUser.getEmail())
                .bio(currentUser.getBio())
                .portfolioUrl(currentUser.getPortfolioUrl())
                .profileImageUrl(currentUser.getProfileImageUrl())
                .linkedinUrl(currentUser.getLinkedinUrl())
                .githubUrl(currentUser.getGithubUrl())
                .leetcodeUrl(currentUser.getLeetcodeUrl()).posts(userPosts).build();

    }

}
