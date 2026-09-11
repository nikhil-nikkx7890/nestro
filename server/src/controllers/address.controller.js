import Address from "../models/address.model.js";
import AppError from "../utils/AppError.js";

/**
 * Unsets isDefault on every one of this user's addresses except
 * `excludeId` (if given). Called before setting a new default so at most
 * one document ever has isDefault: true — a plain updateMany rather than
 * a transaction, since this app has no multi-document transaction
 * infrastructure elsewhere either and a brief window with two defaults
 * mid-request has no real consequence (nothing reads isDefault except a
 * full list, which always re-sorts default-first regardless of how many
 * are momentarily true).
 */
const clearOtherDefaults = async (userId, excludeId) => {
  const filter = { user: userId, isDefault: true };
  if (excludeId) filter._id = { $ne: excludeId };
  await Address.updateMany(filter, { isDefault: false });
};

/**
 * List, default-first then most-recently-created — matches the schema's
 * own compound index, and means Checkout (once built) can always just
 * take the first result to pre-select a default without a separate query.
 */
export const getAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return res.status(200).json({
    success: true,
    data: addresses,
  });
};

/**
 * A user's first address is always the default (ADR-065) — forced here
 * regardless of what the client sent, so there's no way to end up with a
 * lone address that isn't default. For every address after the first,
 * isDefault only takes effect as an explicit `true` (see
 * updateAddressSchema's own comment on why `false` is a no-op).
 */
export const createAddress = async (req, res) => {
  const existingCount = await Address.countDocuments({ user: req.user._id });
  const isFirstAddress = existingCount === 0;

  if (req.body.isDefault && !isFirstAddress) {
    await clearOtherDefaults(req.user._id);
  }

  const address = await Address.create({
    ...req.body,
    user: req.user._id,
    isDefault: isFirstAddress ? true : req.body.isDefault,
  });

  return res.status(201).json({
    success: true,
    message: "Address added.",
    data: address,
  });
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;

  // Same 404 for "doesn't exist" and "exists but belongs to someone
  // else" — deliberately not the 403 the review controller uses for its
  // own ownership check. A review's existence is already public (it's
  // rendered on the product page); an address is private data (a real
  // name, phone number, home address), so a customer probing ids
  // shouldn't be able to learn "id X belongs to *someone*" from a 403
  // that a 404 would otherwise hide.
  const address = await Address.findById(id);
  if (!address) {
    throw new AppError("Address not found.", 404);
  }
  if (String(address.user) !== String(req.user._id)) {
    throw new AppError("Address not found.", 404);
  }

  // isDefault: true is the only value that does anything here — clear
  // every other default first, so this address becomes the sole one.
  // isDefault: false is silently dropped from the update rather than
  // applied: unsetting the current default with no replacement chosen
  // would either leave the user with zero defaults (nothing to pre-select
  // at checkout) or — if this is their only address — contradict ADR-065's
  // rule that a lone address is always the default. Every real address
  // book (this app's cart/wishlist precedent aside) works the same way:
  // you change the default by setting a different one, not by clearing
  // the current one in place.
  const { isDefault, ...rest } = req.body;
  if (isDefault) {
    await clearOtherDefaults(req.user._id, address._id);
  }

  Object.assign(address, rest);
  if (isDefault) {
    address.isDefault = true;
  }

  await address.save();

  return res.status(200).json({
    success: true,
    message: "Address updated.",
    data: address,
  });
};

/**
 * Deleting the default address, with others remaining, promotes the
 * most-recently-created survivor (ADR-065 leaves this choice to
 * implementation) — the reasoning being that the address a user added
 * most recently is the one most likely to reflect where they currently
 * want things shipped, a better guess than an arbitrary older entry.
 */
export const deleteAddress = async (req, res) => {
  const { id } = req.params;

  // Same 404 for "doesn't exist" and "exists but belongs to someone
  // else" — deliberately not the 403 the review controller uses for its
  // own ownership check. A review's existence is already public (it's
  // rendered on the product page); an address is private data (a real
  // name, phone number, home address), so a customer probing ids
  // shouldn't be able to learn "id X belongs to *someone*" from a 403
  // that a 404 would otherwise hide.
  const address = await Address.findById(id);
  if (!address) {
    throw new AppError("Address not found.", 404);
  }
  if (String(address.user) !== String(req.user._id)) {
    throw new AppError("Address not found.", 404);
  }

  const wasDefault = address.isDefault;
  await address.deleteOne();

  if (wasDefault) {
    const nextDefault = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
    }
  }

  return res.status(200).json({
    success: true,
    message: "Address deleted.",
  });
};
