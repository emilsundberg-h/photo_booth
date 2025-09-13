'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Camera from './Camera';
import axios from 'axios'; // Import axios
import Head from 'next/head';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

// Utility function to calculate contrast color
const getContrastColor = (hexColor) => {
  // Remove the hash at the start if it's there
  hexColor = hexColor.replace(/^#/, '');

  // Parse the r, g, b values
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  // Calculate the brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white depending on the brightness
  return brightness > 128 ? 'black' : 'white';
};

export default function Home() {
  const [imageURL, setImageURL] = useState(null); // URL för senaste bild
  const [qrVisible, setQrVisible] = useState(false);
  const [photos, setPhotos] = useState([]); // Alla sparade bilder
  const [isCameraVisible, setIsCameraVisible] = useState(true); // Hantera kamera vs bild
  const [countdown, setCountdown] = useState(20); // Nedräkning i sekunder
  const [downloadTimeout, setDownloadTimeout] = useState(null); // Timeout för nedladdning
  const [greetingText, setGreetingText] = useState('Super Pro Photo Booth 🎭🎉✨🥂'); // Lägg till state för texten
  const [backgroundColor, setBackgroundColor] = useState('#ffffff'); // State för bakgrundsfärg
  const [shutterColor, setShutterColor] = useState('#0000ff'); // State för avtryckarfärg
  const [deleteButtonColor, setDeleteButtonColor] = useState('#ff0000'); // State för raderaknappsfärg
  const [greetingTextColor, setGreetingTextColor] = useState('#000000'); // State för textfärg
  const [deleteButtonTextColor, setDeleteButtonTextColor] = useState('#ffffff'); // State för raderaknappens textfärg
  const [showShutterIcon, setShowShutterIcon] = useState(true); // State för att visa eller dölja 📸-ikonen
  const [showSettings, setShowSettings] = useState(false); // State för att visa eller dölja inställningar
  const [qrCodeDataURL, setQrCodeDataURL] = useState(''); // State för QR-kod data URL

  // Hämta alla bilder från servern och visa dem
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

  // Visa bilden i 10 sekunder efter att den har tagits
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

      // Sätt timeout för nedladdning
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

  // Generate QR code when imageURL changes
  useEffect(() => {
    if (imageURL && qrVisible) {
      QRCode.toDataURL(imageURL, { width: 100, margin: 2 })
        .then(url => setQrCodeDataURL(url))
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [imageURL, qrVisible]);

  // Funktion för att radera den senaste bilden
  const deleteLastImage = async () => {
    if (photos.length === 0) return; // Kontrollera att en bild finns

    // Avbryt nedladdning
    if (downloadTimeout) {
      clearTimeout(downloadTimeout);
      setDownloadTimeout(null);
    }

    // Hämta den senaste bilden
    const lastPhoto = photos[photos.length - 1];
    console.log(`Deleting file: ${lastPhoto.fileName}`); // Add logging

    // Ta bort bilden från servern
    try {
      await axios.delete(`/api/delete/${lastPhoto.fileName}`);
      console.log('Deleted file:', lastPhoto.fileName);
    } catch (error) {
      console.error('Fel vid radering av bild:', error);
    }

    // Uppdatera lokalt
    const updatedPhotos = photos.slice(0, -1); // Ta bort sista bilden från listan
    setPhotos(updatedPhotos);
    setImageURL(null); // Återställ senaste bildens URL
    setQrVisible(false);
    setIsCameraVisible(true); // Återgå till kameran direkt efter raderingen
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

        // Update the photo URL with the server URL
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
        <div className="text-center relative min-h-screen" style={{ backgroundColor: backgroundColor }}>
          {/* User Button for Sign Out */}
          <div className="absolute top-2.5 right-2.5">
            <UserButton afterSignOutUrl="/" />
          </div>
      <input
        type="text"
        value={greetingText}
        onChange={(e) => setGreetingText(e.target.value)}
        className="my-2.5 text-2xl text-center w-full border-none bg-transparent outline-none"
        style={{ color: greetingTextColor }}
      />
      {isCameraVisible ? (
        <Camera setImageURL={setImageURL} setQrVisible={setQrVisible} photos={photos} setPhotos={setPhotos} shutterColor={shutterColor} showShutterIcon={showShutterIcon} />
      ) : (
        <div className="relative inline-block">
          <img src={imageURL} alt="Tagen bild" className="w-full max-w-[600px]" />
          {qrVisible && qrCodeDataURL && (
            <div className="mt-5">
              <img src={qrCodeDataURL} alt="QR Code" className="mx-auto" />
              <p className="font-semibold mt-2.5" style={{ color: contrastColor }}>Scana QR-koden för att få bilden till din mobil</p>
            </div>
          )}
          <div className="mb-2.5">
            <button
              onClick={deleteLastImage}
              className="mt-5 h-9 w-[108px] border-none rounded font-semibold"
              style={{
                backgroundColor: deleteButtonColor,
                color: contrastColorDeletebutton
              }}
            >
              Radera bilden
            </button>
          </div>
          <div className="mt-2.5 text-lg mb-7" style={{ color: contrastColor }}>
            Återgår till kameran om {countdown} sekunder
          </div>
        </div>
      )}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute bottom-2.5 right-2.5 rounded px-5 py-2.5 cursor-pointer"
        style={{
          backgroundColor: backgroundColor,
          color: contrastColor,
          border: `1px solid ${contrastColor}`
        }}
      >
        Settings
      </button>
      {showSettings && (
        <div className="absolute bottom-15 right-2.5 bg-white p-2.5 rounded shadow-lg flex flex-col items-end">
          <div className="my-2.5">
            <label>
              Background:
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="ml-2.5"
              />
            </label>
          </div>
          <div className="my-2.5">
            <label>
              Shutter:
              <input
                type="color"
                value={shutterColor}
                onChange={(e) => setShutterColor(e.target.value)}
                className="ml-2.5"
              />
            </label>
          </div>
          <div className="my-2.5">
            <label>
              Delete button:
              <input
                type="color"
                value={deleteButtonColor}
                onChange={(e) => setDeleteButtonColor(e.target.value)}
                className="ml-2.5"
              />
            </label>
          </div>
          <div className="my-2.5">
            <label>
              Heading:
              <input
                type="color"
                value={greetingTextColor}
                onChange={(e) => setGreetingTextColor(e.target.value)}
                className="ml-2.5"
              />
            </label>
          </div>
          <div className="my-2.5">
            <label>
              Show 📸-icon:
              <input
                type="checkbox"
                checked={showShutterIcon}
                onChange={(e) => setShowShutterIcon(e.target.checked)}
                className="ml-2.5"
              />
            </label>
          </div>
        </div>
      )}
        </div>
      </SignedIn>
    </>
  );
}
