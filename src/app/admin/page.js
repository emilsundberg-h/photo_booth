'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import Head from 'next/head';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Admin() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        console.log('Startar hämtning av bilder från servern...');
        const response = await axios.get('/api/photos');
        setPhotos(response.data);
      } catch (error) {
        console.error('Fel vid hämtning av bilder:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  const deleteImage = async (fileName) => {
    try {
      const encodedFileName = encodeURIComponent(fileName);
      await axios.delete(`/api/delete/${encodedFileName}`);
      console.log('Deleted file:', fileName);
      setPhotos(photos.filter(photo => photo.fileName !== fileName));
    } catch (error) {
      console.error('Fel vid radering av bild:', error);
    }
  };

  const handleSelectPhoto = (fileName) => {
    setSelectedPhotos(prevSelected =>
      prevSelected.includes(fileName)
        ? prevSelected.filter(name => name !== fileName)
        : [...prevSelected, fileName]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(photo => photo.fileName));
    }
  };

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
        <div className="min-h-screen bg-gray-50 py-4">
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📸 Photo Booth Admin</h1>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-lg text-gray-600">Loading photos...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.length === photos.length && photos.length > 0}
                      onChange={handleSelectAll}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select all ({photos.length} photos)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <div key={index} className="text-center">
                  {photo.url && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div
                        onClick={() => handleSelectPhoto(photo.fileName)}
                        className="relative cursor-pointer aspect-square overflow-hidden border-2 hover:border-blue-400 transition-all"
                        style={{
                          borderColor: selectedPhotos.includes(photo.fileName) ? '#3b82f6' : '#e5e7eb',
                        }}
                      >
                        <img 
                          src={photo.url} 
                          alt="Tagen bild" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform" 
                        />
                        {selectedPhotos.includes(photo.fileName) && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                            <span className="text-white text-2xl">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <a 
                          href={photo.url} 
                          download={`photo-${index}.jpg`} 
                          className="text-xs text-blue-600 hover:text-blue-800 block underline"
                        >
                          Download
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(photo.fileName);
                          }}
                          className="text-xs bg-red-500 text-white border-none rounded px-2 py-1 cursor-pointer hover:bg-red-600 transition-colors w-full"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-gray-500">No pictures found.</p>
                    <p className="text-sm text-gray-400 mt-2">Take some photos to see them here!</p>
                  </div>
                )}
                </div>
                {selectedPhotos.length > 0 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={deleteSelectedPhotos}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      Delete selected ({selectedPhotos.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}
