// pages/api/verify-face.js
import connectDB from '../../lib/mongodb';
import User from '../../models/User';

// Pure JS Euclidean distance calculator
function euclideanDistance(arr1, arr2) {
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += (arr1[i] - arr2[i]) ** 2;
  }
  return Math.sqrt(sum);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor)) {
    return res.status(400).json({ message: 'Invalid descriptor' });
  }

  try {
    await connectDB();
    const users = await User.find({});

    let bestMatch = null;
    let minDistance = 0.6; // You can adjust this threshold

    users.forEach((user) => {
      if (user.faceDescriptor && user.faceDescriptor.length === descriptor.length) {
        const distance = euclideanDistance(descriptor, user.faceDescriptor);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = user;
        }
      }
    });

    if (bestMatch) {
      return res.status(200).json({
        success: true,
        user: {
          name: bestMatch.name,
          role: bestMatch.role,
          userId: bestMatch.userId.toString(), // ✅ Fix: Include userId
          imageUrl: bestMatch.imageUrl,
        },
      });
    } else {
      return res.status(200).json({ success: false });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
