import prisma from "./config/prisma.js";

try {
  const result = await prisma.reportCard.deleteMany();

  console.log(`${result.count} report card(s) deleted successfully.`);
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}