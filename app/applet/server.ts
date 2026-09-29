import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Serve public static assets
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve Android APK outputs directly
app.use('/apk', express.static(path.join(process.cwd(), 'android/app/build/outputs/apk/debug')));

// Download route with friendly filename
app.get('/download', (req, res) => {
  const apkPath = path.join(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'ParticleCollider-debug.apk');
  } else {
    res.status(404).send('APK not found. Please build the Android project first.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dev server running on port ${PORT}`);
});
