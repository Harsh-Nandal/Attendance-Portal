// pages/api/submit-attendance.js

import connectDB from '../../lib/mongodb';
import Attendance from '../../models/Attendance';
import User from '../../models/User';
import dayjs from 'dayjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectDB();

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    // Check if user exists
    const user = await User.findOne({ userId: String(userId) }).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = dayjs().format('YYYY-MM-DD');

    // Get today's attendance record
    const record = await Attendance.findOne({
      userId: String(userId),
      date: today
    }).lean();

    let status;

    if (!record) {
      status = 'Not Punched In';
    } else if (record.punchIn && !record.punchOut) {
      status = 'Punched In';
    } else if (record.punchIn && record.punchOut) {
      status = 'Punched Out';
    } else {
      status = 'Unknown';
    }

    return res.status(200).json({
      message: 'Status fetched successfully',
      status
    });

  } catch (err) {
    console.error('[Status API Error]', err);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
}
