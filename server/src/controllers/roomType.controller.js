import roomTypeModel from "../models/roomType.model.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";
import AppError from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const createRoomType = async (req, res) => {
  const { name, isActive, image } = req.body;
  const roomTypeExists = await roomTypeModel.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
  });
  if (roomTypeExists) {
    throw new AppError(`Room with name "${name}" already exists`, 409);
  }

  const roomType = await roomTypeModel.create({
    name,
    isActive,
    image: image ?? { url: "", publicId: "" },
  });
  res.status(201).json({
    success: true,
    message: "Room type created successfully",
    data: roomType,
  });
};

const getAllRoomTypes = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    searchableFields: ["name"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const [allRoomTypes, total] = await Promise.all([
    roomTypeModel.find(filter).sort(sort).skip(skip).limit(limit),
    roomTypeModel.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "All rooms types fetched successfully",
    data: allRoomTypes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

const getRoomTypeById = async (req, res) => {
  const { roomTypeId } = req.params;
  const roomType = await roomTypeModel.findById(roomTypeId);
  if (!roomType) {
    throw new AppError(`Room type not found`, 404);
  }
  res.status(200).json({
    success: true,
    message: "Room type fetched successfully",
    data: roomType,
  });
};

const updateRoomType = async (req, res) => {
  const { roomTypeId } = req.params;
  const { name, isActive, image } = req.body;
  const roomType = await roomTypeModel.findById(roomTypeId);
  if (!roomType) {
    throw new AppError(`Room type not found`, 404);
  }
  // Check for duplicate name ( excluding the current room type)
  const roomTypeExists = await roomTypeModel.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    _id: { $ne: roomTypeId },
  });
  if (roomTypeExists) {
    throw new AppError(`Room type with name "${name}" already exists`, 409);
  }
  // update fields

  roomType.name = name;
  roomType.isActive = isActive;
  roomType.image = image ?? roomType.image;
  //  save document ( this triggers the pre("save") middleware to update the slug
  await roomType.save();
  res.status(200).json({
    success: true,
    message: "Room type updated successfully",
    data: roomType,
  });
};

const deleteRoomType = async (req, res) => {
  const { roomTypeId } = req.params;
  const roomType = await roomTypeModel.findById(roomTypeId);
  if (!roomType) {
    throw new AppError(`Room type not found`, 404);
  }
  await roomType.deleteOne();
  res.status(200).json({
    success: true,
    message: "Room type deleted successfully",
  });
};

export {
  createRoomType,
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
};
