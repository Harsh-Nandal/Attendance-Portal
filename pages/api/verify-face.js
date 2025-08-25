// pages/api/verify-face.js
import connectDB from "../../lib/mongodb";
import User from "../../models/User";

// --- Tunables ---
const MATCH_THRESHOLD = 0.45; // tighten to reduce wrong matches (0.40–0.50 typical)

// L2-normalize a vector (in-place copy)
function l2Normalize(arr) {
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) sumSq += arr[i] * arr[i];
  const norm = Math.sqrt(sumSq) || 1;
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] / norm;
  return out;
}

// Euclidean distance between two same-length arrays
function euclideanDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

// Compute best distance for a user that may have 1..N descriptors
function bestDistanceToUser(queryDesc, user) {
  // You may store either a single descriptor (array of 128)
  // or an array of descriptors (array of arrays).
  const pool = Array.isArray(user.faceDescriptors) && user.faceDescriptors.length
    ? user.faceDescriptors
    : user.faceDescriptor
    ? [user.faceDescriptor]
    : [];

  let best = Infinity;
  for (const d of pool) {
    if (!Array.isArray(d) || d.length !== queryDesc.length) continue;
    const dist = euclideanDistance(queryDesc, l2Normalize(d));
    if (dist < best) best = dist;
  }
  return best;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ message: "Invalid descriptor" });
    }

    // Face-api.js descriptors are 128-d; bail early if something is off
    if (descriptor.length < 64) {
      return res.status(400).json({ message: "Descriptor too short" });
    }

    // Normalize the incoming embedding
    const query = l2Normalize(descriptor);

    await connectDB();

    // Only fetch what we need
    const users = await User.find(
      {},
      "name role userId imageUrl faceDescriptor faceDescriptors"
    ).lean();

    let globalBest = {
      user: null,
      distance: Infinity,
    };

    for (const user of users) {
      const dist = bestDistanceToUser(query, user);
      if (Number.isFinite(dist) && dist < globalBest.distance) {
        globalBest = { user, distance: dist };
      }
    }

    if (globalBest.user && globalBest.distance < MATCH_THRESHOLD) {
      // crude confidence: map [0..threshold] -> [1..0]
      const confidence = Math.max(
        0,
        Math.min(1, 1 - globalBest.distance / MATCH_THRESHOLD)
      );

      return res.status(200).json({
        success: true,
        distance: Number(globalBest.distance.toFixed(4)),
        confidence: Number(confidence.toFixed(3)),
        user: {
          name: globalBest.user.name,
          role: globalBest.user.role,
          userId: String(globalBest.user.userId ?? globalBest.user._id),
          imageUrl: globalBest.user.imageUrl || null,
        },
      });
    }

    return res.status(200).json({
      success: false,
      distance: Number.isFinite(globalBest.distance)
        ? Number(globalBest.distance.toFixed(4))
        : null,
    });
  } catch (error) {
    console.error("Face verification error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}
