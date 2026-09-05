import api from "@/lib/axios";

// Nested under a product for list/create, flat for update/delete —
// mirrors variant.service.js, because the routes are shaped the same way.
export const reviewService = {
  // Admin moderation list — every review across every product.
  listAll: async (params) => {
    const response = await api.get("/reviews", { params });
    return response.data;
  },

  list: async (productId, params) => {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return response.data;
  },

  create: async (productId, data) => {
    const response = await api.post(`/products/${productId}/reviews`, data);
    return response.data;
  },

  update: async (reviewId, data) => {
    const response = await api.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  remove: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};
