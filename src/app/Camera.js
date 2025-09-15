'use client';

import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const Camera = ({ setImageURL, setQrVisible, photos, setPhotos, shutterColor, showShutterIcon }) => {
  const webcamRef = useRef(null);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    console.log('Captured image:', imageSrc);

    try {
      const blob = await (await fetch(imageSrc)).blob();
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
      console.log('Updated photos:', updatedPhotos);
    } catch (error) {
      console.error('Fel vid uppladdning av bild:', error);
    }
  };

  return (
    <div className="flex flex-col">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full max-w-[600px] mx-auto"
        style={{ transform: 'scaleX(-1)' }}
      />
      <button
        onClick={capture}
        className="mt-5 text-white rounded-full w-20 h-20 border-none text-lg cursor-pointer self-center"
        style={{ backgroundColor: shutterColor }}
      >
        {showShutterIcon ? '📸' : ''}
      </button>
    </div>
  );
};

export default Camera;
