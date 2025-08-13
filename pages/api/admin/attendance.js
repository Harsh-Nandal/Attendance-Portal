import connectDB from "../../../lib/mongodb";
import Attendance from "../../../models/Attendance";
import Student from "../../../models/User"; // Your student model

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Auth check using ADMIN_TOKEN from .env
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Connect to DB
    await connectDB();

    const allStudents = await Student.find().lean();
    const allAttendance = await Attendance.find().lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Helper: filter attendance by date range
    const filterByDate = (records, start, end) =>
      records.filter((r) => {
        const recDate = new Date(r.date);
        recDate.setHours(0, 0, 0, 0);
        return recDate >= start && recDate <= end;
      });

    const todayRecords = filterByDate(allAttendance, today, today);
    const weekRecords = filterByDate(allAttendance, startOfWeek, today);
    const monthRecords = filterByDate(allAttendance, startOfMonth, today);

    const getAbsentStudents = (records) => {
      // Make a set of student userIds who actually punched in or out
      const presentIds = new Set(
        records
          .filter(r => r.punchIn || r.punchOut)
          .map(r => r.userId.toString())
      );

      // Only mark as absent those students who exist in Student collection
      return allStudents
        .filter(s => !presentIds.has(s._id.toString()))
        .map(s => ({
          userId: s._id.toString(),
          name: s.name,
          role: s.role,
        }));
    };

    return res.status(200).json({
      daily: todayRecords.filter(r => r.punchIn || r.punchOut),
      weekly: weekRecords.filter(r => r.punchIn || r.punchOut),
      monthly: monthRecords.filter(r => r.punchIn || r.punchOut),
      absentDaily: getAbsentStudents(todayRecords),
      absentWeekly: getAbsentStudents(weekRecords),
      absentMonthly: getAbsentStudents(monthRecords),
    });

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
}
