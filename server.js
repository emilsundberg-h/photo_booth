const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors'); // Import cors
const fs = require('fs'); // Import fs

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('file'), (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, fileName: req.file.filename });
});

app.get('/photos', (req, res) => {
  fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
    if (err) {
      console.error('Fel vid hämtning av bilder:', err);
      return res.status(500).send('Fel vid hämtning av bilder');
    }
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const photos = files.map(file => ({
      url: `${baseUrl}/uploads/${file}`,
      fileName: file,
    }));
    res.json(photos);
  });
});

app.delete('/delete/:fileName', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.fileName);
  console.log(`Attempting to delete file: ${filePath}`); // Add logging
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Fel vid radering av bild:', err);
      return res.status(500).send('Fel vid radering av bild');
    }
    res.send('Bild raderad');
  });
});

// Auto-cleanup function to delete photos older than 30 days
const cleanupOldPhotos = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        }
        
        // Delete if file is older than 30 days
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting old file:', err);
            } else {
              console.log(`Deleted old photo: ${file}`);
            }
          });
        }
      });
    });
  });
};

// Run cleanup every 24 hours
setInterval(cleanupOldPhotos, 24 * 60 * 60 * 1000);

// Run cleanup on startup
cleanupOldPhotos();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Auto-cleanup enabled: Photos older than 30 days will be automatically deleted');
});
