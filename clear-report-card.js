import prisma from "./config/prisma.js";

const clearReportCards = async () => {
  try {
    const result = await prisma.reportCard.deleteMany();

    console.log(`${result.count} report card(s) deleted successfully.`);
  } catch (error) {
    console.error("Failed to delete report cards:", error);
  } finally {
    await prisma.$disconnect();
  }
};

clearReportCards();
