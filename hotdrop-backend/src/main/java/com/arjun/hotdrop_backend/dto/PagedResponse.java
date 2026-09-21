package com.arjun.hotdrop_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.io.Serializable;
import java.util.List;
import java.util.function.Function;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> implements Serializable {

    private List<T> content;
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

    public static <T> PagedResponse<T> from(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLastPage(page.isLast())
                .build();
    }

    public static <E, D> PagedResponse<D> from(Page<E> page, List<D> mappedContent) {
        return PagedResponse.<D>builder()
                .content(mappedContent)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLastPage(page.isLast())
                .build();
    }

    public static <E, D> PagedResponse<D> from(Page<E> page, Function<E, D> mapper) {
        List<D> mappedContent = page.getContent().stream()
                .map(mapper)
                .toList();
        return from(page, mappedContent);
    }
}
