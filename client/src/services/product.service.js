import api from "@/lib/axios";
import { createResourceService } from "./resource.service";

export const productService = {
  ...createResourceService("/products"),

  // Powers the storefront filter sidebar (ADR-048) — every active
  // Category/Brand/RoomType/Material/Color with a real, published-only
  // product count. Not part of the standard CRUD shape, so it's added
  // alongside the factory output rather than forced into it.
  getFilterOptions: async () => {
    const response = await api.get("/products/filter-options");
    return response.data;
  },
};
