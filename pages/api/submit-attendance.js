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

    // Find today's attendance record
    let record = await Attendance.findOne({ userId: String(userId), date: today });

    if (!record) {
      record = new Attendance({
        userId: String(userId),
        date: today,
        punchIn: dayjs().format('HH:mm:ss'),
      });
      await record.save();

      return res.status(200).json({
        message: 'Punched In Successfully',
        status: 'Punched In',
        punchIn: record.punchIn,
      });
    }

    if (record && record.punchIn && !record.punchOut) {
      record.punchOut = dayjs().format('HH:mm:ss');
      await record.save();

      return res.status(200).json({
        message: 'Punched Out Successfully',
        status: 'Punched Out',
        punchIn: record.punchIn,
        punchOut: record.punchOut,
      });
    }

    return res.status(200).json({
      message: 'Already Punched Out',
      status: 'Punched Out',
      punchIn: record.punchIn,
      punchOut: record.punchOut,
    });
  } catch (err) {
    console.error('[Submit Attendance API Error]', err);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
}
