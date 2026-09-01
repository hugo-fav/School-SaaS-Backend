import bcrypt from "bcrypt";
import prisma from "./config/prisma.js";

async function resetPassword() {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await prisma.user.update({
      where: {
        email: "john@test.com",
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log("password reser successfully");
    console.log("Email: john@test.com");
    console.log("Password: Admin@123");
  } catch (error) {
    console.log(error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
