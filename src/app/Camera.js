'use client';

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const Camera = ({ setImageURL, setQrVisible, photos, setPhotos, shutterColor, showShutterIcon }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: 'user'
  };

  const capture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    console.log('Captured image:', imageSrc);

    try {
      // Create an image element to flip the captured photo
      const img = new Image();
      img.src = imageSrc;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create a canvas to flip the image horizontally
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Flip the image horizontally
      ctx.scale(-1, 1);
      ctx.drawImage(img, -canvas.width, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob with maximum quality
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 1.0);
      });

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      console.log('Created file:', file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data.url;
      const fileName = response.data.fileName;
      console.log('Uploaded file URL:', url);
      console.log('Uploaded file name:', fileName);
      setImageURL(url);
      setQrVisible(true);

      const updatedPhotos = [...photos, { url, fileName }];
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error('Fel vid uppladdning av bild:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        screenshotQuality={1}
        videoConstraints={videoConstraints}
        className="w-full max-w-[900px] mx-auto"
        style={{ transform: 'scaleX(-1)' }}
      />
      <button
        onClick={capture}
        disabled={isCapturing}
        className="mt-5 text-white rounded-full w-20 h-20 border-none text-lg cursor-pointer self-center flex items-center justify-center transition-opacity"
        style={{ backgroundColor: shutterColor, opacity: isCapturing ? 0.7 : 1 }}
      >
        {isCapturing ? (
          <svg className="animate-spin w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (showShutterIcon ? '📸' : '')}
      </button>
    </div>
  );
};

export default Camera;
