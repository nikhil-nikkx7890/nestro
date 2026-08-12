export function buildQueryFeatures(query, options = {} ) {

    const {
        searchableFields = ["name"],
        defaultSortBy = "createdAt",
        defaultSortOrder = "desc",
        defaultLimit = 10,
    } = options;

    const {search, page, limit, sortBy, sortOrder, isActive } = query;
//     1. filter
    const filter = {};

    if (search){
        filter.$or = searchableFields.map((field) => ({
            [field]:{ $regex: search, $options: "i" },
        }));
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }
    // 2. SORT
    const order = sortOrder || defaultSortOrder;
    const sort = {
        [sortBy || defaultSortBy]: order === "asc" ? 1 : -1,
    };

    // 3. PAGINATION
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || defaultLimit, 1);
    const skip = (pageNumber - 1) * limitNumber;

    return { filter, sort, skip, limit: limitNumber, page: pageNumber };


}