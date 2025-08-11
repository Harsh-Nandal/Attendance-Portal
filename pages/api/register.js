import connectDB from "../../lib/mongodb";
import User from "../../models/User";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  let body = req.body;

  // ✅ Handle raw string JSON
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error("❌ Invalid JSON body");
      return res.status(400).json({ message: "Invalid request body format." });
    }
  }

  const { name, userId, role, imageData, faceDescriptor } = body;

  // 🔍 Log inputs for debugging
  console.log("🔎 Received:", {
    name,
    userId,
    role,
    imageLength: imageData?.length,
    descriptorLength: faceDescriptor?.length,
    descriptorIsArray: Array.isArray(faceDescriptor),
  });

  // ✅ Robust validation
  if (
    typeof name !== "string" ||
    typeof userId !== "string" ||
    typeof role !== "string" ||
    typeof imageData !== "string" ||
    !Array.isArray(faceDescriptor) ||
    faceDescriptor.length < 50 // must be a valid 128-d array
  ) {
    console.warn("❌ Validation failed. Skipping DB/Cloudinary.");
    return res.status(400).json({
      message: " Backend :: Missing or invalid data. Please register again.",
    });
  }

  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({ message: "User ID already exists." });
    }

    // ✅ Upload image first only if all validation passed
    const uploadResponse = await cloudinary.uploader.upload(imageData, {
      folder: "mdci-faces",
    });

    // ✅ Save to MongoDB
    const newUser = await User.create({
      name,
      userId,
      role,
      imageUrl: uploadResponse.secure_url,
      faceDescriptor,
    });

    console.log("✅ User created:", newUser._id);

    return res.status(200).json({
      message: "Success",
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

// ✅ Allow large payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
