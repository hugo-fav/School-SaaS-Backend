import prisma from "../../config/prisma.js";
import { encrypt } from "../../utils/crypto.js";

export const createSchool = async (schoolData) => {
  const { name } = schoolData;

  return prisma.school.create({
    data: {
      name,
      createdAt: new Date(),
    },
  });
};

export const getSchools = async () => {
  return prisma.school.findMany();
};

export const getSchool = async (userSchoolId, schoolId) => {
  if (schoolId !== userSchoolId) {
    return null;
  }

  return prisma.school.findUnique({
    where: { id: schoolId },
  });
};

export const updateSchool = async (userSchoolId, schoolId, schoolData) => {
  if (schoolId !== userSchoolId) {
    return null;
  }

  const { name } = schoolData;

  return prisma.school.update({
    where: { id: schoolId },
    data: { name },
  });
};

export const deleteSchool = async (userSchoolId, schoolId) => {
  if (schoolId !== userSchoolId) {
    return null;
  }

  return prisma.school.delete({
    where: { id: schoolId },
  });
};

export const updatePaymentSettings = async (
  schoolId,
  { paystackSecretKey, paystackPublicKey },
) => {
  const school = await prisma.school.findUnique({
    where: {
      id: schoolId,
    },
  });

  if (!school) {
    throw new Error("School not found");
  }

  const encryptedSecretKey = encrypt(paystackSecretKey);

  return prisma.school.update({
    where: {
      id: schoolId,
    },
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
