// pages/api/match-face.js

import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData } from 'canvas';
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Monkey patch face-api for Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load models only once
let modelsLoaded = false;
async function loadModels() {
  if (!modelsLoaded) {
    const MODEL_PATH = path.join(process.cwd(), 'public', 'models');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
    ]);
    modelsLoaded = true;
    console.log("✅ Face-api models loaded from:", MODEL_PATH);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    await loadModels();

    const { descriptor } = req.body;

    if (
      !descriptor ||
      !Array.isArray(descriptor) ||
      descriptor.length !== 128
    ) {
      return res.status(400).json({
        success: false,
        message: 'Descriptor must be a valid 128-length array',
      });
    }

    const inputDescriptor = new Float32Array(descriptor);
    const users = await User.find({});

    let bestMatch = null;
    let minDistance = 0.5;

    for (const user of users) {
      if (
        user.faceDescriptor &&
        user.faceDescriptor.length === 128
      ) {
        const dbDescriptor = new Float32Array(user.faceDescriptor);
        const distance = faceapi.euclideanDistance(inputDescriptor, dbDescriptor);

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = user;
        }
      }
    }

    if (bestMatch) {
      return res.status(200).json({
        success: true,
        name: bestMatch.name,
        role: bestMatch.role,
        userId: bestMatch.userId,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No matching face found',
      });
    }

  } catch (error) {
    console.error('❌ Error in match-face API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
}
