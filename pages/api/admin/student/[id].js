// pages/api/admin/student/[id].js
import connectDB from "../../../../lib/mongodb";
import Attendance from "../../../../models/Attendance";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    await connectDB();

    const { id } = req.query;
    const studentId = Array.isArray(id) ? id[0] : id;

    // Fetch all records for this student (date stored as "YYYY-MM-DD" in your schema)
    const allRecords = await Attendance.find({ userId: studentId }).lean();

    // Helpers
    const toYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const daysBetweenInclusive = (startYMD, endYMD) => {
      const [ys, ms, ds] = startYMD.split("-").map(Number);
      const [ye, me, de] = endYMD.split("-").map(Number);
      const start = new Date(ys, ms - 1, ds);
      const end = new Date(ye, me - 1, de);
      const diff = Math.floor((end - start) / 86400000) + 1;
      return diff < 0 ? 0 : diff;
    };

    const filterByYMDRange = (records, startYMD, endYMD) =>
      records.filter((r) => {
        if (!r?.date) return false; // guard
        // r.date is a "YYYY-MM-DD" string per your schema
        return r.date >= startYMD && r.date <= endYMD;
      });

    // Build today / week start / month start
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayYMD = toYMD(today);

    // Week starts on Sunday (getDay(): 0 = Sun, 6 = Sat)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekYMD = toYMD(startOfWeek);

    // Month start
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthYMD = toYMD(startOfMonth);

    // Filtered records (only up to TODAY, not full week/month lengths)
    const weeklyRecords = filterByYMDRange(allRecords, startOfWeekYMD, todayYMD);
    const monthlyRecords = filterByYMDRange(allRecords, startOfMonthYMD, todayYMD);

    // Count unique days WITH punchIn as "present"
    const countPresentDays = (records) => {
      const presentDays = new Set();
      for (const r of records) {
        if (r?.punchIn && r?.date) {
          presentDays.add(r.date); // date is already Y-M-D string
        }
      }
      return presentDays.size;
    };

    // Summaries with totals based on start->today (inclusive)
    const summarize = (records, startYMD, endYMD) => {
      const total = daysBetweenInclusive(startYMD, endYMD);
      const present = countPresentDays(records);
      const absent = Math.max(0, total - present);
      return { present, absent, total, start: startYMD, end: endYMD };
    };

    const weekly = summarize(weeklyRecords, startOfWeekYMD, todayYMD);
    const monthly = summarize(monthlyRecords, startOfMonthYMD, todayYMD);

    const studentData = {
      userId: studentId,
      name: allRecords[0]?.name || "Unknown",
      role: allRecords[0]?.role || "Unknown",
      weekly,
      monthly,
    };

    return res.status(200).json(studentData);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
}
