const MAX_LIMIT = 100;

export function buildQueryFeatures(query, options = {} ) {

    const {
        sortableFields = ["name", "createdAt", "isActive"],
        defaultSortBy = "createdAt",
        defaultSortOrder = "desc",
        defaultLimit = 10,
    } = options;

    const {search, page, limit, sortBy, sortOrder, isActive } = query;
//     1. filter
    const filter = {};

    if (search){
        filter.$text = { $search: search };
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }
    // 2. SORT
    const order =
        sortOrder === "desc" ? "desc" : sortOrder === "asc" ? "asc" : defaultSortOrder;
    const safeSortBy = sortableFields.includes(sortBy) ? sortBy : defaultSortBy;
    const sort = {
        [safeSortBy]: order === "asc" ? 1 : -1,
    };

    // 3. PAGINATION
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || defaultLimit, 1), MAX_LIMIT);
    const skip = (pageNumber - 1) * limitNumber;

    return { filter, sort, skip, limit: limitNumber, page: pageNumber };


}