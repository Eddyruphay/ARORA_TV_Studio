'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState('/videos/placeholder.mp4'); // Placeholder video
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextVideoTitle, setUpNextVideoTitle] = useState('Próximo Vídeo');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch('/api/schedule');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const scheduleData = await response.json();
        
        // Check if the schedule array exists and has videos
        if (scheduleData && scheduleData.length > 0) {
          const firstVideo = scheduleData[0];
          console.log("Now Playing:", firstVideo.url);
          setCurrentVideo(firstVideo.url);
          
          // Set the "Up Next" video if there is one
          if (scheduleData.length > 1) {
            // Using a more descriptive title if available, e.g., from a caption field
            setUpNextVideoTitle(scheduleData[1].title || `Vídeo ID: ${scheduleData[1].original_message_id}`);
          } else {
            setUpNextVideoTitle('Fim da Programação');
          }

        } else {
          console.log("Schedule is empty, playing placeholder.");
          // Keep the placeholder if the schedule is empty
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
        // Keep the placeholder in case of an error
      }
    };

    fetchSchedule();

    // Periodically re-fetch the schedule to get new content without a page refresh
    const interval = setInterval(fetchSchedule, 300000); // Re-fetch every 5 minutes

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const handleVideoEnd = () => {
    // Logic to play next video from schedule
    console.log('Video ended, playing next...');
    // setCurrentVideo('/videos/another-placeholder.mp4'); // Example: switch video
    // setShowUpNext(false); // Hide "Up Next" for the new video
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between bg-black text-white">
      {/* Full-screen Video Player */}
      <video
        src={currentVideo}
        autoPlay
        controls={false} // Hide default controls for a TV-like experience
        onEnded={handleVideoEnd}
        className="absolute inset-0 w-full h-full object-cover"
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {/* ARORA TV Logo (Placeholder) */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold">ARORA TV</h1>
        {/* <Image src="/arora-logo.png" alt="ARORA TV Logo" width={100} height={50} /> */}
      </div>

      {/* Up Next Pop-up */}
      {showUpNext && (
        <div className="absolute bottom-4 right-4 z-10 bg-gray-800 bg-opacity-75 p-3 rounded-lg shadow-lg animate-fade-in">
          <p className="text-sm text-gray-300">A Seguir:</p>
          <p className="text-lg font-semibold">{upNextVideoTitle}</p>
        </div>
      )}

      {/* Basic Controls Overlay (Optional, for debugging/testing) */}
      {/* <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-10">
        <button onClick={() => console.log('Play/Pause')} className="p-2 bg-blue-500 rounded">Play/Pause</button>
      </div> */}

      {/* Global Styles (Tailwind will handle most of this) */}
      <style jsx global>{`
        body {
          overflow: hidden; /* Prevent scrolling */
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
