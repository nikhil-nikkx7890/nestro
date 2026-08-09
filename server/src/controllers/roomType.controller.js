import roomTypeModel from "../models/roomType.model.js";

const createRoomType = async (req, res) => {
  try {
    const { name, isActive, image } = req.body;
    const roomTypeExists = await roomTypeModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (roomTypeExists) {
      return res.status(409).json({
        success: false,
        message: `Room with name "${name}" already exists`,
      });
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
  } catch (error) {
    console.error("Error creating roomType", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllRoomTypes = async (req, res) => {
  try {
    const allRoomTypes = await roomTypeModel.find();
    res.status(200).json({
      success: true,
      message: "All rooms types fetched successfully",
      count: allRoomTypes.length,
      data: allRoomTypes,
    });
  } catch (error) {
    console.error("Error getting all roomTypes", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoomTypeById = async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const roomType = await roomTypeModel.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found`,
      });
    }
    res.status(200).json({
      success: true,
      message: "Room type fetched successfully",
      data: roomType,
    });
  } catch (error) {
    console.error("Error getting Room Type ", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRoomType = async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const { name, isActive, image } = req.body;
    const roomType = await roomTypeModel.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found`,
      });
    }
    // Check for duplicate name ( excluding the current room type)
    const roomTypeExists = await roomTypeModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: roomTypeId },
    });
    if (roomTypeExists) {
      return res.status(409).json({
        success: false,
        message: `Room type with name "${name}" already exists`,
      });
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
  } catch (error) {
    console.error("Error updating roomType", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRoomType = async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const roomType = await roomTypeModel.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found`,
      });
    }
    await roomType.deleteOne();
    res.status(200).json({
      success: true,
      message: "Room type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting roomType", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createRoomType,
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
};
