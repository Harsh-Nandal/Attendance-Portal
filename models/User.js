import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  userId: String,
  role: String,
  imageUrl: String,
  faceDescriptor: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
