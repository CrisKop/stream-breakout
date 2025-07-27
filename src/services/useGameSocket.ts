'use client';

import { useEffect, useState, useCallback } from 'react';
import socketService, { StreamEvent, UpgradeEvent, GameStats } from './socket';
import { UserData } from '@/engine/Enemy';
import { ChatMessage } from '@/components/ChatFeed';
import { Upgrade } from '@/components/UpgradeBar';

interface UseGameSocketOptions {
  onEnemySpawn?: (userData: UserData) => void;
  onUpgradeActivated?: (upgradeId: string) => void;
}

// Contador para generar IDs únicos
let messageIdCounter = 0;

export const useGameSocket = (options?: UseGameSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalLikes: 0,
    totalComments: 0,
    totalSubscriptions: 0,
    currentCombo: 0,
    enemiesDestroyed: 0
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: 'bounce_upgrade',
      name: '+1 Rebote',
      description: 'Las pelotas duran más tiempo',
      icon: '⚡',
      currentProgress: 0,
      requiredProgress: 100,
      isUnlocked: false,
      type: 'likes'
    },
    {
      id: 'multi_ball',
      name: 'Multi-Pelotas',
      description: 'Se lanzan varias pelotas a la vez',
      icon: '🎾',
      currentProgress: 0,
      requiredProgress: 200,
      isUnlocked: false,
      type: 'comments'
    },
    {
      id: 'explosive_bounce',
      name: 'Rebote Explosivo',
      description: 'Golpea enemigos cercanos',
      icon: '💥',
      currentProgress: 0,
      requiredProgress: 5,
      isUnlocked: false,
      type: 'subscriptions'
    },
    {
      id: 'lightning_bounce',
      name: 'Rebote Rayo',
      description: 'Destruye fila o columna completa',
      icon: '⚡',
      currentProgress: 0,
      requiredProgress: 10,
      isUnlocked: false,
      type: 'combo'
    }
  ]);

  // Función para generar IDs únicos
  const generateUniqueId = useCallback((prefix: string) => {
    messageIdCounter++;
    return `${prefix}-${Date.now()}-${messageIdCounter}`;
  }, []);

  const getEventMessage = useCallback((streamEvent: StreamEvent, enemyCount: number = 1): string => {
    switch (streamEvent.type) {
      case 'subscription':
        return enemyCount > 1 
          ? `¡${streamEvent.userData.name} se suscribió! ${enemyCount} enemigos generados (${streamEvent.userData.name.length} caracteres).`
          : `¡${streamEvent.userData.name} se suscribió! Enemigo generado.`;
      case 'comment':
        return `${streamEvent.userData.name} comentó. Enemigo rápido generado.`;
      case 'like':
        return `¡Nuevo like! Enemigo anónimo generado.`;
      default:
        return 'Evento desconocido';
    }
  }, []);

  const handleStreamEvent = useCallback((streamEvent: StreamEvent) => {
    // Actualizar estadísticas
    setGameStats(prev => {
      const newStats = { ...prev };
      switch (streamEvent.type) {
        case 'like':
          newStats.totalLikes++;
          break;
        case 'comment':
          newStats.totalComments++;
          newStats.currentCombo++;
          break;
        case 'subscription':
          newStats.totalSubscriptions++;
          break;
      }
      return newStats;
    });

    // Calcular cantidad de enemigos para suscripciones
    let enemyCount = 1;
    if (streamEvent.type === 'subscription') {
      // Limitar a máximo 5 enemigos basado en la longitud del nombre
      enemyCount = Math.min(streamEvent.userData.name.length, 5);
      console.log(`📺 Suscripción de ${streamEvent.userData.name}: ${enemyCount} enemigos (${streamEvent.userData.name.length} caracteres)`);
    }

    // Agregar mensaje al chat con información de enemigos múltiples
    const chatMessage: ChatMessage = {
      id: generateUniqueId(streamEvent.type),
      type: streamEvent.type,
      message: getEventMessage(streamEvent, enemyCount),
      timestamp: streamEvent.timestamp,
      userName: streamEvent.userData.name,
      level: streamEvent.userData.level
    };

    setChatMessages(prev => [...prev, chatMessage]);

    // Notificar spawn de enemigos (múltiples para suscripciones)
    if (options?.onEnemySpawn) {
      for (let i = 0; i < enemyCount; i++) {
        // Crear una copia del userData con un ID único para cada enemigo
        const enemyData: UserData = {
          ...streamEvent.userData,
          id: `${streamEvent.userData.id || streamEvent.userData.name}-${i}`,
          // Para suscripciones, pasar el índice del carácter que debe mostrar
          characterIndex: streamEvent.type === 'subscription' ? i : undefined,
          // Variar ligeramente el delay para que no aparezcan todos en el mismo lugar
          spawnDelay: i * 200 // 200ms de delay entre cada enemigo
        };
        
        // Spawn inmediato para el primero, con delay para los demás
        if (i === 0) {
          options.onEnemySpawn(enemyData);
        } else {
          setTimeout(() => {
            if (options?.onEnemySpawn) {
              options.onEnemySpawn(enemyData);
            }
          }, enemyData.spawnDelay);
        }
      }
    }
  }, [options, getEventMessage, generateUniqueId]);

  const handleUpgradeUnlocked = useCallback((upgrade: UpgradeEvent) => {
    // Marcar upgrade como desbloqueado
    setUpgrades(prev => prev.map(u => 
      u.id === upgrade.type ? { ...u, isUnlocked: true } : u
    ));

    // Agregar mensaje al chat
    const chatMessage: ChatMessage = {
      id: generateUniqueId('upgrade'),
      type: 'upgrade',
      message: `¡${upgrade.description} desbloqueado!`,
      timestamp: upgrade.timestamp
    };

    setChatMessages(prev => [...prev, chatMessage]);

    // Notificar activación de upgrade
    if (options?.onUpgradeActivated) {
      options.onUpgradeActivated(upgrade.type);
    }
  }, [options, generateUniqueId]);

  const updateUpgradeProgress = useCallback((stats: GameStats) => {
    setUpgrades(prev => prev.map(upgrade => {
      let newProgress = upgrade.currentProgress;
      
      switch (upgrade.type) {
        case 'likes':
          newProgress = stats.totalLikes;
          break;
        case 'comments':
          newProgress = stats.totalComments;
          break;
        case 'subscriptions':
          newProgress = stats.totalSubscriptions;
          break;
        case 'combo':
          newProgress = stats.currentCombo;
          break;
      }

      // Verificar si se desbloqueó
      const wasUnlocked = upgrade.isUnlocked;
      const shouldUnlock = newProgress >= upgrade.requiredProgress && !wasUnlocked;

      if (shouldUnlock) {
        // Enviar evento de upgrade desbloqueado
        socketService.sendGameEvent('upgrade_unlocked', { upgradeId: upgrade.id });
      }

      return {
        ...upgrade,
        currentProgress: newProgress,
        isUnlocked: upgrade.isUnlocked || shouldUnlock
      };
    }));
  }, []);

  useEffect(() => {
    // Configurar listeners del socket
    socketService.onConnectionChange(setIsConnected);
    
    socketService.onStreamEvent((streamEvent: StreamEvent) => {
      handleStreamEvent(streamEvent);
    });

    socketService.onUpgradeUnlocked((upgrade: UpgradeEvent) => {
      handleUpgradeUnlocked(upgrade);
    });

    socketService.onStatsUpdate((stats: GameStats) => {
      setGameStats(stats);
      updateUpgradeProgress(stats);
    });

    return () => {
      // Cleanup si es necesario
    };
  }, [handleStreamEvent, handleUpgradeUnlocked, updateUpgradeProgress]);

  // Métodos para reportar eventos del juego
  const reportEnemyDestroyed = useCallback((enemyData: UserData) => {
    console.log('🎯 Reportando enemigo destruido:', enemyData);
    console.log('🎯 ID del enemigo:', enemyData.id);
    console.log('🎯 Nombre del enemigo:', enemyData.name);
    socketService.sendEnemyDestroyed(enemyData);
    
    const chatMessage: ChatMessage = {
      id: generateUniqueId('destroyed'),
      type: 'enemy_destroyed',
      message: `¡Enemigo ${enemyData.name} destruido!`,
      timestamp: Date.now(),
      userName: enemyData.name,
      level: enemyData.level
    };

    setChatMessages(prev => [...prev, chatMessage]);
  }, [generateUniqueId]);

  const reportLifeLost = useCallback(() => {
    socketService.sendLifeLost();
    
    const chatMessage: ChatMessage = {
      id: generateUniqueId('life-lost'),
      type: 'life_lost',
      message: '💔 ¡Vida perdida!',
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, chatMessage]);
  }, [generateUniqueId]);

  return {
    isConnected,
    gameStats,
    chatMessages,
    upgrades,
    reportEnemyDestroyed,
    reportLifeLost
  };
};