'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import Head from 'next/head';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Admin() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true); // För att hantera laddningstillstånd
  const [selectedPhotos, setSelectedPhotos] = useState([]); // För att hantera valda bilder

  // Hämta alla bilder från servern
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true); // Starta laddning
        console.log('Startar hämtning av bilder från servern...');
        const response = await axios.get('/api/photos');
        setPhotos(response.data);
      } catch (error) {
        console.error('Fel vid hämtning av bilder:', error);
      } finally {
        setLoading(false); // Avsluta laddning
      }
    };

    fetchPhotos();
  }, []);

  // Funktion för att radera en bild
  const deleteImage = async (fileName) => {
    try {
      await axios.delete(`/api/delete/${fileName}`);
      console.log('Deleted file:', fileName);
      setPhotos(photos.filter(photo => photo.fileName !== fileName));
    } catch (error) {
      console.error('Fel vid radering av bild:', error);
    }
  };

  // Funktion för att hantera val av bilder
  const handleSelectPhoto = (fileName) => {
    setSelectedPhotos(prevSelected =>
      prevSelected.includes(fileName)
        ? prevSelected.filter(name => name !== fileName)
        : [...prevSelected, fileName]
    );
  };

  // Funktion för att hantera val av alla bilder
  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(photo => photo.fileName));
    }
  };

  // Funktion för att radera valda bilder
  const deleteSelectedPhotos = async () => {
    try {
      await Promise.all(selectedPhotos.map(fileName => axios.delete(`/api/delete/${fileName}`)));
      console.log('Deleted selected files:', selectedPhotos);
      setPhotos(photos.filter(photo => !selectedPhotos.includes(photo.fileName)));
      setSelectedPhotos([]);
    } catch (error) {
      console.error('Fel vid radering av valda bilder:', error);
    }
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <h1 className="text-5xl mb-7 text-gray-700">🔒 Admin Area</h1>
          <p className="text-lg mb-7 text-gray-600">Please sign in to access admin functions</p>
          <SignInButton>
            <button className="px-8 py-4 text-lg bg-red-600 text-white border-none rounded-lg cursor-pointer font-bold hover:bg-red-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="text-center relative">
          {/* User Button for Sign Out */}
          <div className="absolute top-2.5 right-2.5">
            <UserButton afterSignOutUrl="/" />
          </div>
          
          <h1>Admin - All amazing pics</h1>

      {loading ? (
        <p>Loading pics...</p> // Laddningsindikator
      ) : (
        <>
          <div className="mb-2.5">
            <input
              type="checkbox"
              checked={selectedPhotos.length === photos.length}
              onChange={handleSelectAll}
            />
            <label className="ml-1.5">Select all</label>
          </div>
          <div className="flex flex-wrap justify-center">
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <div key={index} className="m-2.5 text-center">
                  {/* Rendera endast bilder som har en riktig URL */}
                  {photo.url && (
                    <>
                      <div
                        onClick={() => handleSelectPhoto(photo.fileName)}
                        className="border-2 inline-block cursor-pointer w-[150px] h-[150px] box-border"
                        style={{
                          borderColor: selectedPhotos.includes(photo.fileName) ? 'blue' : 'white',
                        }}
                      >
                        <img src={photo.url} alt="Tagen bild" className="w-full h-full object-cover" />
                      </div>
                      <a href={photo.url} download={`photo-${index}.jpg`} className="block mt-2.5">
                        Download
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(photo.fileName);
                        }}
                        className="mt-2.5 bg-red-500 text-white border-none rounded px-2.5 py-1.5 cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No picures found.</p> // Om inga bilder finns
            )}
          </div>
          {selectedPhotos.length > 0 && (
            <button
              onClick={deleteSelectedPhotos}
              style={{
                marginTop: '20px',
                backgroundColor: '#ff0000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                padding: '10px 20px',
                cursor: 'pointer',
              }}
            >
              Delete selected pictures
            </button>
          )}
        </>
      )}
        </div>
      </SignedIn>
    </>
  );
}
