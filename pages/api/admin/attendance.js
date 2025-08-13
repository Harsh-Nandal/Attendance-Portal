// pages/api/admin/attendance.js
import connectDB from "../../../lib/mongodb";
import Attendance from "../../../models/Attendance";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Use the same token you send from /api/admin/login
    // In production, replace with JWT verification
    if (token !== "some-admin-token") {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Connect to DB
    await connectDB();

    // Fetch attendance data
    const daily = (await Attendance.find({ period: "daily" }).lean()) || [];
    const weekly = (await Attendance.find({ period: "weekly" }).lean()) || [];
    const monthly = (await Attendance.find({ period: "monthly" }).lean()) || [];

    return res.status(200).json({ daily, weekly, monthly });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
}
