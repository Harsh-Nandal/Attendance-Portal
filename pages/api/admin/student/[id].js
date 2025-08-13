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

    // Connect to DB
    await connectDB();

    const { id } = req.query;
    const studentId = Array.isArray(id) ? id[0] : id;

    // Fetch attendance records
    const records = await Attendance.find({ userId: studentId }).lean();

    // Return empty attendance if no records
    const studentData = {
      userId: studentId,
      name: records[0]?.name || "Unknown",
      role: records[0]?.role || "Unknown",
      attendance: records.map(r => ({
        date: r.date || null,
        punchIn: r.punchIn || null,
        punchOut: r.punchOut || null,
      })),
    };

    return res.status(200).json(studentData);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
}
