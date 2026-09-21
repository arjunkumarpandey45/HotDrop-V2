import { useState, useEffect, useCallback, useRef } from "react";
import API from "../api/Api";

/**
 * Default key extractor to ensure unique keys for React rendering
 * and prevent duplicate items when paginated pages overlap or append.
 */
export const defaultKeyExtractor = (item) => {
  if (!item) return null;
  if (typeof item !== "object") return String(item);
  return (
    item.id ??
    item._id ??
    item.userId ??
    item.targetUserId ??
    item.commentId ??
    item.postId ??
    item.hotdropId ??
    item.username ??
    null
  );
};

/**
 * Deduplicate and append incoming items to existing items using a Map.
 * - Preserves existing items' original insertion order.
 * - If an item with the same key already exists, updates it with latest incoming data.
 * - If new, appends it to the list.
 */
export const mergeDeduplicated = (existingItems = [], incomingItems = [], keyExtractor = defaultKeyExtractor) => {
  const map = new Map();

  // 1. Existing items
  existingItems.forEach((item, idx) => {
    const key = keyExtractor(item);
    const keyStr = key !== null && key !== undefined ? String(key) : `existing_${idx}`;
    map.set(keyStr, item);
  });

  // 2. Incoming items (updates existing or appends if new)
  incomingItems.forEach((item, idx) => {
    const key = keyExtractor(item);
    const keyStr = key !== null && key !== undefined ? String(key) : `incoming_${idx}`;
    if (map.has(keyStr)) {
      const existing = map.get(keyStr);
      // Merge properties if object, else replace
      map.set(
        keyStr,
        typeof item === "object" && item !== null && typeof existing === "object" && existing !== null
          ? { ...existing, ...item }
          : item
      );
    } else {
      map.set(keyStr, item);
    }
  });

  return Array.from(map.values());
};

/**
 * Parse paginated response from backend.
 * Handles both Spring Boot Page representation:
 * {
 *   content: [...items],
 *   pageNumber: 0,
 *   pageSize: 10,
 *   totalElements: 42,
 *   totalPages: 5,
 *   isLastPage: false
 * }
 * and wrapped forms (response.data.data, response.data, or fallback array).
 */
export const parsePaginatedResponse = (resData, fallbackPage = 0, fallbackSize = 10) => {
  const payload = resData?.data !== undefined && !Array.isArray(resData) && typeof resData === "object" && resData.data !== null && (resData.data.content !== undefined || Array.isArray(resData.data))
    ? resData.data
    : resData;

  // Fallback for plain array
  if (Array.isArray(payload)) {
    return {
      content: payload,
      pageNumber: fallbackPage,
      pageSize: fallbackSize,
      totalElements: payload.length,
      totalPages: 1,
      isLastPage: true,
    };
  }

  const content =
    payload?.content ??
    payload?.items ??
    payload?.posts ??
    payload?.users ??
    payload?.followers ??
    payload?.following ??
    payload?.likes ??
    payload?.comments ??
    [];

  const pageNumber = payload?.pageNumber ?? payload?.number ?? payload?.page ?? fallbackPage;
  const pageSize = payload?.pageSize ?? payload?.size ?? fallbackSize;
  const totalElements = payload?.totalElements ?? payload?.total ?? (Array.isArray(content) ? content.length : 0);
  const totalPages = payload?.totalPages ?? (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 1);

  const isLastPage =
    typeof payload?.isLastPage === "boolean"
      ? payload.isLastPage
      : typeof payload?.last === "boolean"
      ? payload.last
      : pageNumber >= totalPages - 1 || (Array.isArray(content) && content.length < pageSize);

  return {
    content: Array.isArray(content) ? content : [],
    pageNumber: Number(pageNumber),
    pageSize: Number(pageSize),
    totalElements: Number(totalElements),
    totalPages: Number(totalPages),
    isLastPage: Boolean(isLastPage),
  };
};

/**
 * Custom React hook for seamless paginated data fetching with Infinite Scroll and "Load More".
 *
 * @param {Object} options
 * @param {string|null} options.url - API endpoint (e.g. `/users/${userId}/get-all-followers`)
 * @param {Object} [options.params] - Additional query params to send with request
 * @param {number} [options.pageSize=10] - Number of items per page
 * @param {boolean} [options.enabled=true] - Whether to fetch automatically
 * @param {Array} [options.initialItems=[]] - Initial items if pre-populated
 * @param {Function} [options.keyExtractor] - Deduplication key extractor
 * @param {Function} [options.transformItem] - Optional item transformer/mapper
 * @param {Function} [options.onSuccess] - Callback when page fetch succeeds
 * @param {Function} [options.fetcher] - Custom fetcher function override
 */
export function usePaginatedFetch({
  url,
  params = {},
  pageSize = 10,
  enabled = true,
  initialItems = [],
  keyExtractor = defaultKeyExtractor,
  transformItem,
  onSuccess,
  fetcher,
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(initialItems?.length || 0);
  const [totalPages, setTotalPages] = useState(1);

  // Stable references for props to avoid unnecessary effect triggers
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const transformRef = useRef(transformItem);
  transformRef.current = transformItem;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const keyExtractorRef = useRef(keyExtractor);
  keyExtractorRef.current = keyExtractor;

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const abortControllerRef = useRef(null);

  /**
   * Internal fetch method
   */
  const fetchPage = useCallback(
    async (pageToFetch, isInitial = false) => {
      if (!enabled || !url) return;

      // Abort previous in-flight request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        let resData;

        if (typeof fetcherRef.current === "function") {
          resData = await fetcherRef.current(pageToFetch, pageSize, abortControllerRef.current.signal);
        } else {
          const res = await API.get(url, {
            params: {
              page: pageToFetch,
              size: pageSize,
              pageNumber: pageToFetch,
              pageSize: pageSize,
              ...paramsRef.current,
            },
            signal: abortControllerRef.current.signal,
          });
          resData = res.data;
        }

        const parsed = parsePaginatedResponse(resData, pageToFetch, pageSize);

        const mappedContent = transformRef.current
          ? parsed.content.map(transformRef.current)
          : parsed.content;

        setItems((prev) => {
          if (isInitial || pageToFetch === 0) {
            // Deduplicate incoming page 0 in case of duplicate keys
            return mergeDeduplicated([], mappedContent, keyExtractorRef.current);
          }
          // Append with deduplication
          return mergeDeduplicated(prev, mappedContent, keyExtractorRef.current);
        });

        setPage(parsed.pageNumber);
        setTotalElements(parsed.totalElements);
        setTotalPages(parsed.totalPages);
        setHasMore(!parsed.isLastPage);

        if (onSuccessRef.current) {
          onSuccessRef.current(mappedContent, parsed);
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
          return; // request was cancelled, ignore
        }
        console.error(`usePaginatedFetch error [${url}]:`, err);
        setError(err);
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [enabled, url, pageSize]
  );

  /**
   * Reset & Refetch initial page when url or enabled state changes
   */
  useEffect(() => {
    if (!enabled || !url) {
      if (!enabled) {
        setLoading(false);
        setLoadingMore(false);
      }
      return;
    }

    setPage(0);
    setHasMore(true);
    fetchPage(0, true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, enabled, fetchPage]);

  /**
   * Load next page
   */
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    fetchPage(nextPage, false);
  }, [loading, loadingMore, hasMore, page, fetchPage]);

  /**
   * Manual refresh (resets to page 0)
   */
  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    return fetchPage(0, true);
  }, [fetchPage]);

  /**
   * Manual reset to clean state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  }, []);

  /**
   * IntersectionObserver sentinel ref for Infinite Scroll
   */
  const observerInstance = useRef(null);
  const sentinelRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerInstance.current) {
        observerInstance.current.disconnect();
      }

      if (node && hasMore) {
        observerInstance.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
              loadMore();
            }
          },
          {
            rootMargin: "120px",
            threshold: 0.1,
          }
        );
        observerInstance.current.observe(node);
      }
    },
    [loading, loadingMore, hasMore, loadMore]
  );

  /**
   * Container onScroll listener helper (alternative to IntersectionObserver)
   */
  const handleScroll = useCallback(
    (element) => {
      if (!element || loading || loadingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = element;
      if (scrollTop + clientHeight >= scrollHeight - 80) {
        loadMore();
      }
    },
    [loading, loadingMore, hasMore, loadMore]
  );

  return {
    items,
    setItems,
    loading,
    loadingMore,
    error,
    page,
    hasMore,
    totalElements,
    totalPages,
    isEmpty: !loading && items.length === 0,
    loadMore,
    refresh,
    reset,
    sentinelRef,
    handleScroll,
  };
}

export default usePaginatedFetch;
