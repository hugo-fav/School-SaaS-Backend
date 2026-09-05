import prisma from "../../config/prisma.js";
import { encrypt } from "../../utils/crypto.js";

export const getMySchool = async (schoolId) => {
  return prisma.school.findUnique({
    where: { id: schoolId },
  });
};

export const updateMySchool = async (schoolId, schoolData) => {
  const { name } = schoolData;

  const school = await prisma.school.findUnique({ where: { id: schoolId } });

  if (!school) {
    const error = new Error("School not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.school.update({
    where: { id: schoolId },
    data: { name },
  });
};

export const deactivateMySchool = async (schoolId) => {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });

  if (!school) {
    const error = new Error("School not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.school.update({
    where: { id: schoolId },
    data: { isActive: false },
  });
};

export const updatePaymentSettings = async (
  schoolId,
  { paystackSecretKey, paystackPublicKey },
) => {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });

  if (!school) {
    const error = new Error("School not found");
    error.statusCode = 404;
    throw error;
  }

  const encryptedSecretKey = encrypt(paystackSecretKey);

  return prisma.school.update({
    where: { id: schoolId },
    data: {
      paystackSecretKey: encryptedSecretKey,
      paystackPublicKey,
    },
    select: {
      id: true,
      name: true,
      paystackPublicKey: true,
      createdAt: true,
    },
  });
};
