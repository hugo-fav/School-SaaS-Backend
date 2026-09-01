import {
  createFee,
  getFees,
  getFeeById,
  updateFee,
  deleteFee,
} from "./fee.service.js";

// CREATE FEE
export const createFeeController = async (req, res) => {
  try {
    const { name, description, amount, sessionId, termId, classId } = req.body;

    const fee = await createFee({
      name,
      description,
      amount,
      sessionId,
      termId,
      classId,
      schoolId: req.user.schoolId,
    });

    return res.status(201).json({
      message: "Fee created successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Create fee error:", error);

    return res.status(400).json({
      message: error.message || "Failed to create fee",
    });
  }
};

// GET ALL FEES / FILTER FEES
export const getFeesController = async (req, res) => {
  try {
    const { sessionId, termId, classId } = req.query;

    const fees = await getFees({
      schoolId: req.user.schoolId,
      sessionId,
      termId,
      classId,
    });

    return res.status(200).json({
      message: "Fees fetched successfully",
      data: fees,
    });
  } catch (error) {
    console.error("Get fees error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch fees",
    });
  }
};

// GET SINGLE FEE
export const getFeeByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await getFeeById(id, req.user.schoolId);

    if (!fee) {
      return res.status(404).json({
        message: "Fee not found",
      });
    }

    return res.status(200).json({
      message: "Fee fetched successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Get fee error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch fee",
    });
  }
};

// UPDATE FEE
export const updateFeeController = async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await updateFee(id, req.body, req.user.schoolId);

    return res.status(200).json({
      message: "Fee updated successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Update fee error:", error);

    return res.status(400).json({
      message: error.message || "Failed to update fee",
    });
  }
};

// DELETE FEE
export const deleteFeeController = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteFee(id, req.user.schoolId);

    return res.status(200).json({
      message: "Fee deleted successfully",
    });
  } catch (error) {
    console.error("Delete fee error:", error);

    return res.status(400).json({
      message: error.message || "Failed to delete fee",
    });
  }
};
