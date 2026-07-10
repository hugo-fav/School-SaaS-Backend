import jwt from "jsonwebtoken";

export const generateToken = (admin) => {
  //   console.log("JWT_SECRET =", process.env.JWT_SECRET);

  return jwt.sign(
    { id: admin.id, schoolId: admin.schoolId, role: admin.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};


