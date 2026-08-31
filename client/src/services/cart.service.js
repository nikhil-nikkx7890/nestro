import api from "@/lib/axios";

// Hand-written, not createResourceService — same reasoning as
// variant.service.js and auth.service.js: the shape (a single cart per
// user, mutated via item-scoped sub-routes) doesn't fit that factory's
// list/getById/create/update/remove assumption.
export const cartService = {
  get: async () => {
    const response = await api.get("/cart");
    return response.data;
  },

  addItem: async (variantId, quantity = 1) => {
    const response = await api.post("/cart/items", { variant: variantId, quantity });
    return response.data;
  },

  updateItem: async (variantId, quantity) => {
    const response = await api.put(`/cart/items/${variantId}`, { quantity });
    return response.data;
  },

  removeItem: async (variantId) => {
    const response = await api.delete(`/cart/items/${variantId}`);
    return response.data;
  },
};
