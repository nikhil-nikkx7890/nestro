import api from "@/lib/axios";

/**
 * Variant's routing is hybrid (see productVariant.routes.js on the
 * backend): create/list are nested under a specific product, while
 * get/update/delete use the variant's own _id. That shape doesn't fit
 * createResourceService's single-base-endpoint assumption, so this is
 * a small hand-written service instead of the factory.
 */
export const variantService = {
  list: async (productId, params = {}) => {
    const response = await api.get(
      `/products/${productId}/variants`,
      { params },
    );
    return response.data;
  },

  getById: async (variantId) => {
    const response = await api.get(`/variants/${variantId}`);
    return response.data;
  },

  create: async (productId, data) => {
    const response = await api.post(
      `/products/${productId}/variants`,
      data,
    );
    return response.data;
  },

  update: async (variantId, data) => {
    const response = await api.put(`/variants/${variantId}`, data);
    return response.data;
  },

  remove: async (variantId) => {
    const response = await api.delete(`/variants/${variantId}`);
    return response.data;
  },
};
