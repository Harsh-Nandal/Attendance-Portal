// models/Attendance.js
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  date: { type: String, required: true },
  punchIn: { type: String },
  punchOut: { type: String },
});

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
