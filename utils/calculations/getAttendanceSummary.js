const getAttendanceSummary = (attendanceRecords) => {
  // Group attendance records by date
  const attendanceByDate = new Map();

  for (const record of attendanceRecords) {
    const date = new Date(record.date).toISOString().split("T")[0];

    if (!attendanceByDate.has(date)) {
      attendanceByDate.set(date, []);
    }

    attendanceByDate.get(date).push(record.status);
  }

  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let excusedDays = 0;

  // Calculate one attendance result per school day
  for (const statuses of attendanceByDate.values()) {
    if (statuses.includes("LATE")) {
      lateDays++;
    }

    if (statuses.every((status) => status === "ABSENT")) {
      absentDays++;
    } else if (statuses.every((status) => status === "EXCUSED")) {
      excusedDays++;
    } else {
      presentDays++;
    }
  }

  const totalDays = attendanceByDate.size;

  const percentage =
    totalDays === 0 ? 0 : Number(((presentDays / totalDays) * 100).toFixed(2));

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    percentage,
  };
};

export default getAttendanceSummary;
