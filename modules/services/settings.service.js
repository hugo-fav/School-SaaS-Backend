import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import { encrypt } from "../../utils/encryption.js";

export const getSchoolSettings = async (schoolId) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      paystackPublicKey: true,
      paystackSecretKey: true,
    },
  });

  ensureExists(school, "School");

  // Security Best Practice: Never return the full secret key to the frontend.
  // We just return a masked version so the UI knows it has been set.
  let maskedSecretKey = null;
  if (school.paystackSecretKey) {
    maskedSecretKey = "sk_live_******** (Saved & Encrypted)";
  }

  return {
    id: school.id,
    name: school.name,
    paystackPublicKey: school.paystackPublicKey,
    hasSecretKey: !!school.paystackSecretKey,
    maskedSecretKey,
  };
};

export const updateSchoolSettings = async (schoolId, data, user) => {
  // Only Admins can update school settings
  if (user.role !== "ADMIN") {
    throw createHttpError(
      403,
      "Only school administrators can update settings.",
    );
  }

  const { name, paystackPublicKey, paystackSecretKey } = data;
  const updateData = {};

  if (name !== undefined) {
    if (!name.trim())
      throw createHttpError(400, "School name cannot be empty.");
    updateData.name = name.trim();
  }

  if (paystackPublicKey !== undefined) {
    updateData.paystackPublicKey = paystackPublicKey.trim() || null;
  }

  if (paystackSecretKey !== undefined) {
    // Encrypt the secret key before saving it to the database
    const trimmedSecret = paystackSecretKey.trim();
    if (trimmedSecret) {
      updateData.paystackSecretKey = encrypt(trimmedSecret);
    } else {
      // Allow clearing the key if they pass an empty string
      updateData.paystackSecretKey = null;
    }
  }

  const updatedSchool = await prisma.school.update({
    where: { id: schoolId },
    data: updateData,
    select: {
      id: true,
      name: true,
      paystackPublicKey: true,
      paystackSecretKey: true,
    },
  });

  return {
    id: updatedSchool.id,
    name: updatedSchool.name,
    paystackPublicKey: updatedSchool.paystackPublicKey,
    hasSecretKey: !!updatedSchool.paystackSecretKey,
  };
};
