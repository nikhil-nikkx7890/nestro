"use client";

import { useEffect, useState, useCallback } from "react";

const DEBOUNCE_MS = 400;

export function useResourceList({ list, entityName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Query state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Debounce: wait until the user stops typing for DEBOUNCE_MS before
  // letting `search` actually trigger a refetch.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 whenever the search term changes
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await list({
        search: debouncedSearch || undefined,
        page,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        isActive: isActive || undefined,
      });
      setItems(response.data);
      setPagination(response.pagination);
      setError("");
    } catch (error) {
      console.error(error);
      setError(`Failed to fetch ${entityName}s.`);
    } finally {
      setLoading(false);
    }
  }, [list, entityName, debouncedSearch, page, sortBy, sortOrder, isActive]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleFilterActive = (value) => {
    setIsActive(value);
    setPage(1);
  };

  // Wraps setPage with a scroll-to-top, used specifically for explicit
  // Prev/Next clicks — kept separate from the raw setPage so that the
  // silent page-1 resets above (search/sort/filter) don't also scroll.
  const goToPage = (newPage) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    items,
    loading,
    error,
    refetch: fetchItems,

    // Query state + controls
    search,
    setSearch,
    page,
    setPage,
    goToPage,
    sortBy,
    sortOrder,
    handleSort,
    isActive,
    handleFilterActive,
    pagination,
  };
}
