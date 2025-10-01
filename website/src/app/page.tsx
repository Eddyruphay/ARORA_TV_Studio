'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface Video {
  url: string;
  title?: string;
  original_message_id?: string;
}

export default function Home() {
  const [schedule, setSchedule] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('/videos/placeholder.mp4');
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextVideoTitle, setUpNextVideoTitle] = useState('Próximo Vídeo');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const scheduleUrl = process.env.NEXT_PUBLIC_SCHEDULE_URL;
        if (!scheduleUrl) {
          console.log("Schedule URL is not configured. Playing placeholder.");
          setSchedule([]);
          return;
        }

        const response = await fetch(scheduleUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const scheduleData: Video[] = await response.json();
        
        if (scheduleData && scheduleData.length > 0) {
          setSchedule(scheduleData);
          const firstVideo = scheduleData[0];
          console.log("Now Playing:", firstVideo.url);
          setCurrentVideoUrl(firstVideo.url);
          setCurrentVideoIndex(0);
          
          if (scheduleData.length > 1) {
            const nextVideo = scheduleData[1];
            setUpNextVideoTitle(nextVideo.title || `Vídeo ID: ${nextVideo.original_message_id}`);
          } else {
            setUpNextVideoTitle('Fim da Programação');
          }
        } else {
          console.log("Schedule is empty, playing placeholder.");
          setSchedule([]); // Ensure schedule is empty
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
        setSchedule([]); // Ensure schedule is empty on error
      }
    };

    fetchSchedule();
    const interval = setInterval(fetchSchedule, 300000); // Re-fetch every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const playNextVideo = () => {
    setShowUpNext(false);
    const nextIndex = (currentVideoIndex + 1) % schedule.length;
    
    if (nextIndex === 0 && schedule.length > 0) {
      // Reached the end of the schedule, could re-fetch or loop
      console.log("End of schedule loop. Restarting.");
    } else if (schedule.length === 0) {
      console.log("Playback stopped. Schedule is empty.");
      setCurrentVideoUrl('/videos/placeholder.mp4'); // Go back to placeholder
      return;
    }

    const nextVideo = schedule[nextIndex];
    console.log("Playing next:", nextVideo.url);
    setCurrentVideoUrl(nextVideo.url);
    setCurrentVideoIndex(nextIndex);

    // Update "Up Next" for the video after the *new* current one
    const upNextIndex = (nextIndex + 1) % schedule.length;
    if (upNextIndex !== 0 || schedule.length === 1) {
        const upNextVideo = schedule[upNextIndex];
        setUpNextVideoTitle(upNextVideo.title || `Vídeo ID: ${upNextVideo.original_message_id}`);
    } else {
        setUpNextVideoTitle('Fim da Programação');
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      const timeLeft = video.duration - video.currentTime;
      // Show "Up Next" 15 seconds before the end
      if (timeLeft < 15 && timeLeft > 10 && schedule.length > 1) {
        setShowUpNext(true);
      }
    }
  };
  
  const handleVideoError = () => {
    console.error(`Failed to load video: ${currentVideoUrl}. Playing next.`);
    playNextVideo();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between bg-black text-white">
      <video
        ref={videoRef}
        src={currentVideoUrl}
        autoPlay
        controls={false}
        onEnded={playNextVideo}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        className="absolute inset-0 w-full h-full object-cover"
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>

      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold">ARORA TV</h1>
      </div>

      {showUpNext && (
        <div className="absolute bottom-4 right-4 z-10 bg-gray-800 bg-opacity-75 p-3 rounded-lg shadow-lg animate-fade-in">
          <p className="text-sm text-gray-300">A Seguir:</p>
          <p className="text-lg font-semibold">{upNextVideoTitle}</p>
        </div>
      )}

      <style jsx global>{`
        body {
          overflow: hidden;
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
