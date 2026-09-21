package com.arjun.hotdrop_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostListResponseDto {
    private List<PostResponseDto> posts;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    @JsonProperty("isLastPage")
    private boolean isLastPage;

    @JsonProperty("isLastPage")
    public boolean isLastPage() {
        return isLastPage;
    }

    @JsonProperty("isLastPage")
    public void setLastPage(boolean lastPage) {
        this.isLastPage = lastPage;
    }
}