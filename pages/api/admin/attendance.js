import connectDB from "../../../lib/mongodb";
import Attendance from "../../../models/Attendance";
import Student from "../../../models/User"; // student model

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Admin token auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    await connectDB();

    // All registered students
    const allStudents = await Student.find().lean();
    // All attendance records
    const allAttendance = await Attendance.find().lean();

    // Date helpers
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const filterByDate = (records, start, end) =>
      records.filter((r) => {
        const recDate = new Date(r.date);
        recDate.setHours(0, 0, 0, 0);
        return recDate >= start && recDate <= end;
      });

    // ✅ Get present = students who have a punchIn for that period
    const getPresentStudents = (records) => {
      const presentIds = new Set(
        records
          .filter(r => r.punchIn) // must have punched in
          .map(r => r.userId) // stored as string in Attendance
      );
      return allStudents.filter(s => presentIds.has(s.userId)); // match by userId string
    };

    // ✅ Get absent = all students - present students
    const getAbsentStudents = (records) => {
      const presentIds = new Set(
        records
          .filter(r => r.punchIn)
          .map(r => r.userId)
      );
      return allStudents.filter(s => !presentIds.has(s.userId));
    };

    // Filter attendance
    const todayRecords = filterByDate(allAttendance, today, today);
    const weekRecords = filterByDate(allAttendance, startOfWeek, today);
    const monthRecords = filterByDate(allAttendance, startOfMonth, today);

    res.status(200).json({
      allStudents,
      daily: todayRecords.filter(r => r.punchIn), // actual records for table
      weekly: weekRecords.filter(r => r.punchIn),
      monthly: monthRecords.filter(r => r.punchIn),
      absentDaily: getAbsentStudents(todayRecords),
      absentWeekly: getAbsentStudents(weekRecords),
      absentMonthly: getAbsentStudents(monthRecords),
    });

  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
