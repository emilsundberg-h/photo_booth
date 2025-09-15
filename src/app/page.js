'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Camera from './Camera';
import axios from 'axios';
import Head from 'next/head';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

const getContrastColor = (hexColor) => {
  hexColor = hexColor.replace(/^#/, '');

  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? 'black' : 'white';
};

export default function Home() {
  const [imageURL, setImageURL] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  const [countdown, setCountdown] = useState(20);
  const [downloadTimeout, setDownloadTimeout] = useState(null);
  const [greetingText, setGreetingText] = useState('Super Pro Photo Booth 🎭🎉✨🥂');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [shutterColor, setShutterColor] = useState('#0000ff');
  const [deleteButtonColor, setDeleteButtonColor] = useState('#ff0000');
  const [greetingTextColor, setGreetingTextColor] = useState('#000000');
  const [deleteButtonTextColor, setDeleteButtonTextColor] = useState('#ffffff');
  const [showShutterIcon, setShowShutterIcon] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get('/api/photos');
        setPhotos(response.data);
        console.log('Fetched photos:', response.data);
      } catch (error) {
        console.error('Fel vid hämtning av bilder:', error);
      }
    };

    fetchPhotos();
  }, []);

  useEffect(() => {
    if (imageURL) {
      setIsCameraVisible(false);
      let timeLeft = 20;
      setCountdown(timeLeft);

      const interval = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft === 0) {
          setImageURL(null);
          setIsCameraVisible(true);
          clearInterval(interval);
        }
      }, 1000);

      const timeout = setTimeout(() => {
        setDownloadTimeout(null);
      }, 20000);
      setDownloadTimeout(timeout);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [imageURL]);

  useEffect(() => {
    if (imageURL && qrVisible) {
      QRCode.toDataURL(imageURL, { width: 100, margin: 2 })
        .then(url => setQrCodeDataURL(url))
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [imageURL, qrVisible]);

  const deleteLastImage = async () => {
    if (photos.length === 0) return;

    if (downloadTimeout) {
      clearTimeout(downloadTimeout);
      setDownloadTimeout(null);
    }

    const lastPhoto = photos[photos.length - 1];
    console.log(`Deleting file: ${lastPhoto.fileName}`);

    try {
      const encodedFileName = encodeURIComponent(lastPhoto.fileName);
      await axios.delete(`/api/delete/${encodedFileName}`);
      console.log('Deleted file:', lastPhoto.fileName);
    } catch (error) {
      console.error('Fel vid radering av bild:', error);
    }

    const updatedPhotos = photos.slice(0, -1);
    setPhotos(updatedPhotos);
    setImageURL(null);
    setQrVisible(false);
    setIsCameraVisible(true);
  };

  const saveImageToServer = async () => {
    try {
      const lastPhoto = photos[photos.length - 1];
      if (lastPhoto && lastPhoto.file) {
        const formData = new FormData();
        formData.append('file', lastPhoto.file);

        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const updatedPhotos = photos.map(photo => 
          photo === lastPhoto ? { ...photo, url: response.data.url, fileName: response.data.fileName } : photo
        );
        setPhotos(updatedPhotos);
        console.log('Saved photos to server:', updatedPhotos);
      }
    } catch (error) {
      console.error('Fel vid uppladdning av bild:', error);
    }
  };

  const contrastColor = getContrastColor(backgroundColor);
  const contrastColorDeletebutton = getContrastColor(deleteButtonColor);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <h1 className="text-5xl mb-7 text-gray-700">🎭 Photo Booth 🎉</h1>
          <p className="text-lg mb-7 text-gray-600">Please sign in to access the photo booth</p>
          <SignInButton>
            <button className="px-8 py-4 text-lg bg-blue-600 text-white border-none rounded-lg cursor-pointer font-bold hover:bg-blue-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: backgroundColor }}>
          {/* Header */}
          <div className="flex justify-between items-center p-4 md:p-6">
            <div className="flex-1"></div>
            <input
              type="text"
              value={greetingText}
              onChange={(e) => setGreetingText(e.target.value)}
              className="text-lg md:text-2xl text-center bg-transparent border-none outline-none max-w-xs md:max-w-md"
              style={{ color: greetingTextColor }}
            />
            <div className="flex-1 flex justify-end">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-4">
              {isCameraVisible ? (
                <Camera setImageURL={setImageURL} setQrVisible={setQrVisible} photos={photos} setPhotos={setPhotos} shutterColor={shutterColor} showShutterIcon={showShutterIcon} />
              ) : (
                <div className="text-center max-w-md mx-auto">
                  <img src={imageURL} alt="Tagen bild" className="w-full rounded-lg shadow-lg mb-4" />
                  {qrVisible && qrCodeDataURL && (
                    <div className="mb-4">
                      <img src={qrCodeDataURL} alt="QR Code" className="mx-auto mb-2" />
                      <p className="font-semibold text-sm md:text-base" style={{ color: contrastColor }}>
                        Scana QR-koden för att få bilden till din mobil
                      </p>
                    </div>
                  )}
                  <button
                    onClick={deleteLastImage}
                    className="mb-4 h-10 px-4 border-none rounded font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: deleteButtonColor,
                      color: contrastColorDeletebutton
                    }}
                  >
                    Radera bilden
                  </button>
                  <div className="text-sm md:text-base" style={{ color: contrastColor }}>
                    Återgår till kameran om {countdown} sekunder
                  </div>
                </div>
              )}
            </div>

          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: backgroundColor,
                color: contrastColor,
                border: `1px solid ${contrastColor}`
              }}
            >
              Settings
            </button>
          </div>
          {showSettings && (
            <div className="absolute bottom-16 right-4 bg-white p-4 rounded-lg shadow-xl border min-w-64 md:min-w-72">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color:
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shutter Button:
                  </label>
                  <input
                    type="color"
                    value={shutterColor}
                    onChange={(e) => setShutterColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delete Button:
                  </label>
                  <input
                    type="color"
                    value={deleteButtonColor}
                    onChange={(e) => setDeleteButtonColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color:
                  </label>
                  <input
                    type="color"
                    value={greetingTextColor}
                    onChange={(e) => setGreetingTextColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showIcon"
                    checked={showShutterIcon}
                    onChange={(e) => setShowShutterIcon(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="showIcon" className="text-sm font-medium text-gray-700">
                    Show 📸 icon on button
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </SignedIn>
    </>
  );
}
