'use client';

import { useCallback, useRef } from 'react';

export const useSounds = () => {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const isAudioEnabledRef = useRef(false);

  // Función para crear y precargar un sonido
  const createAudio = useCallback((src: string): HTMLAudioElement => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0.4;
    
    // Manejar errores de carga
    audio.addEventListener('error', (e) => {
      console.error(`Error cargando sonido ${src}:`, e);
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log(`Sonido ${src} cargado correctamente`);
    });
    
    return audio;
  }, []);

  // Inicializar sonidos del juego
  const initializeGameSounds = useCallback(() => {
    console.log('🎵 Inicializando sonidos...');
    
    try {
      audioRefs.current = {
        bounce: createAudio('/sounds/bouncing.mp3'),
        pop: createAudio('/sounds/pop.mp3'),
        boom: createAudio('/sounds/boom.mp3'),
        liveLost: createAudio('/sounds/live-lost.mp3')
      };
      console.log('✅ Sonidos inicializados correctamente');
    } catch (error) {
      console.error('❌ Error inicializando sonidos:', error);
    }
  }, [createAudio]);

  // Habilitar audio con interacción del usuario
  const enableAudio = useCallback(async () => {
    if (isAudioEnabledRef.current) return true;

    try {
      // Intentar reproducir cada sonido brevemente para habilitar el contexto
      const promises = Object.values(audioRefs.current).map(async (audio) => {
        try {
          const originalVolume = audio.volume;
          audio.volume = 0;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.volume = originalVolume;
        } catch (e) {
          console.warn('Error habilitando audio:', e);
        }
      });

      await Promise.all(promises);
      isAudioEnabledRef.current = true;
      console.log('🔊 Audio habilitado correctamente');
      return true;
    } catch (error) {
      console.warn('⚠️ No se pudo habilitar el audio:', error);
      return false;
    }
  }, []);

  // Reproducir sonido
  const playSound = useCallback((soundName: string) => {
    if (!isAudioEnabledRef.current) {
      console.log(`🔇 Audio no habilitado, no se reproduce ${soundName}`);
      return;
    }

    const audio = audioRefs.current[soundName];
    if (!audio) {
      console.warn(`⚠️ Sonido ${soundName} no encontrado`);
      return;
    }

    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🎵 Reproduciendo ${soundName}`);
          })
          .catch((error) => {
            console.warn(`⚠️ Error reproduciendo ${soundName}:`, error);
          });
      }
    } catch (error) {
      console.warn(`⚠️ Error al reproducir ${soundName}:`, error);
    }
  }, []);

  // Función para verificar si el audio está habilitado
  const getIsAudioEnabled = useCallback(() => {
    return isAudioEnabledRef.current;
  }, []);

  return {
    initializeGameSounds,
    enableAudio,
    playSound,
    getIsAudioEnabled,
    playBounce: () => playSound('bounce'),
    playPop: () => playSound('pop'),
    playBoom: () => playSound('boom'),
    playLiveLost: () => playSound('liveLost'),
  };
};