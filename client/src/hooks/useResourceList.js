"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const DEBOUNCE_MS = 400;

export function useResourceList({ list, entityName, extraParams = {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // `list` is often passed as a fresh inline function on every render
  // (e.g. a caller binding an extra id: `(params) => service.list(id, params)`).
  // A ref lets us always call the latest version without making fetchItems'
  // useCallback identity depend on it — that dependency was the actual bug:
  // new list() reference -> new fetchItems() reference -> the effect below
  // re-fires -> setState -> re-render -> new list() reference -> forever.
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  });

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

  // extraParams lets a caller (e.g. the storefront's Category/Brand/
  // Material/Color filters) merge extra query params into every fetch
  // without this hook needing to know what they are. Stringified for the
  // dependency below — an inline object literal from the caller would
  // otherwise get a new reference every render, which is exactly the
  // fetchItems-identity-changes-every-render bug already fixed once for
  // the `list` prop (see the listRef comment above).
  const extraParamsKey = JSON.stringify(extraParams);

  useEffect(() => {
    setPage(1); // reset to page 1 whenever a filter changes
  }, [extraParamsKey]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listRef.current({
        search: debouncedSearch || undefined,
        page,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        isActive: isActive || undefined,
        ...JSON.parse(extraParamsKey),
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
  }, [entityName, debouncedSearch, page, sortBy, sortOrder, isActive, extraParamsKey]);

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

  // handleSort toggles direction on repeat clicks, which is right for a
  // sortable table header. A sort dropdown instead picks a field AND a
  // direction at once, so it needs to set both outright.
  const applySort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
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
    applySort,
    isActive,
    handleFilterActive,
    pagination,
  };
}
