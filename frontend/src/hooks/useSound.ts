'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundState {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      isMuted: false,
      volume: 0.5,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: 'sound-settings',
    }
  )
);

type SoundName =
  | 'click'
  | 'hover'
  | 'win'
  | 'lose'
  | 'tick'
  | 'spin'
  | 'cashout'
  | 'crash'
  | 'reveal'
  | 'explode'
  | 'bounce'
  | 'notification'
  | 'message';

const SOUNDS: Record<SoundName, string> = {
  click: '/sounds/click.mp3',
  hover: '/sounds/hover.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  tick: '/sounds/tick.mp3',
  spin: '/sounds/spin.mp3',
  cashout: '/sounds/cashout.mp3',
  crash: '/sounds/crash.mp3',
  reveal: '/sounds/reveal.mp3',
  explode: '/sounds/explode.mp3',
  bounce: '/sounds/bounce.mp3',
  notification: '/sounds/notification.mp3',
  message: '/sounds/message.mp3',
};

export function useSound() {
  const { isMuted, volume } = useSoundStore();
  const soundsRef = useRef<Map<SoundName, Howl>>(new Map());

  // Preload sounds
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([name, src]) => {
      if (!soundsRef.current.has(name as SoundName)) {
        const sound = new Howl({
          src: [src],
          volume: volume,
          preload: true,
        });
        soundsRef.current.set(name as SoundName, sound);
      }
    });

    return () => {
      soundsRef.current.forEach((sound) => sound.unload());
      soundsRef.current.clear();
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    soundsRef.current.forEach((sound) => {
      sound.volume(isMuted ? 0 : volume);
    });
  }, [isMuted, volume]);

  const playSound = useCallback(
    (name: SoundName, options?: { rate?: number; loop?: boolean }) => {
      if (isMuted) return;

      const sound = soundsRef.current.get(name);
      if (sound) {
        if (options?.rate) sound.rate(options.rate);
        if (options?.loop !== undefined) sound.loop(options.loop);
        sound.play();
      }
    },
    [isMuted]
  );

  const stopSound = useCallback((name: SoundName) => {
    const sound = soundsRef.current.get(name);
    if (sound) {
      sound.stop();
    }
  }, []);

  const stopAll = useCallback(() => {
    soundsRef.current.forEach((sound) => sound.stop());
  }, []);

  return {
    playSound,
    stopSound,
    stopAll,
    isMuted,
    volume,
  };
}

