import api from "@/lib/axios";

// Not built on createResourceService — that factory's update() hardcodes
// PUT against `${endpoint}/${id}`, and this resource's write endpoints
// don't fit that shape at all (checkout is its own path, status updates
// and cancellation are each their own sub-action, not a generic
// replace). Same "don't force a factory that doesn't match" call
// auth.service.js and address.service.js already make.
export const orderService = {
  // paymentMethod defaults to COD server-side too (order.validator.js) —
  // passed explicitly here so every call site is honest about which
  // path it's taking, rather than relying on an implicit default two
  // layers away.
  checkout: async (addressId, paymentMethod = "COD") => {
    const response = await api.post("/checkout", { addressId, paymentMethod });
    return response.data;
  },

  // GET /api/orders is role-branched server-side (own orders for a
  // customer, every order for an admin) — one method here mirrors that,
  // rather than two client methods for what's one endpoint.
  list: async (params = {}) => {
    const response = await api.get("/orders", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
};
