'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

const MUSIC_SOURCE = '/R&V- ILLEN All Taht Really Matter.mp3';

export function MusicPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.35);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(audio.muted);
      setVolume(audio.volume);
    };
    const handleError = () => {
      setIsPlaying(false);
    };

    audio.muted = false;

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('error', handleError);

    const startPlaybackOnFirstGesture = async () => {
      if (!audio.paused) {
        return;
      }

      try {
        await audio.play();
      } catch {}
    };

    const interactionEvents = ['pointerdown', 'touchstart', 'keydown'];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, startPlaybackOnFirstGesture, { once: true });
    });

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startPlaybackOnFirstGesture);
      });
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {}
      return;
    }

    audio.pause();
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handleVolumeInput = (event) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const nextVolume = Number(event.target.value);
    audio.volume = nextVolume;
    audio.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(audio.muted);
  };

  return (
    <>
      <audio ref={audioRef} loop preload="none" src={MUSIC_SOURCE} />

      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-white/78 px-3 py-2 shadow-xl backdrop-blur-md sm:bottom-6 sm:left-6">
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex items-center justify-center rounded-full bg-burgundy-800 p-2 text-white transition-all hover:bg-burgundy-700"
          aria-label={isPlaying ? 'Pausar musica' : 'Tocar musica'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="inline-flex items-center justify-center rounded-full p-2 text-burgundy-700 transition-all hover:bg-white/70"
          aria-label={isMuted ? 'Ativar som' : 'Mutar som'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeInput}
          className="h-1.5 w-20 accent-burgundy-700 sm:w-24"
          aria-label="Volume da musica"
        />
        <span className="font-lato text-xs font-medium text-burgundy-700">
          {isPlaying ? 'Musica ativa' : 'Musica pausada'}
        </span>
      </div>
    </>
  );
}
