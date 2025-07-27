'use client';

import { io, Socket } from 'socket.io-client';
import { UserData } from '@/engine/Enemy';

export interface StreamEvent {
  type: 'subscription' | 'comment' | 'like';
  userData: UserData;
  timestamp: number;
}

export interface UpgradeEvent {
  type: 'bounce_upgrade' | 'multi_ball' | 'explosive_bounce' | 'lightning_bounce';
  description: string;
  timestamp: number;
}

export interface GameStats {
  totalLikes: number;
  totalComments: number;
  totalSubscriptions: number;
  currentCombo: number;
  enemiesDestroyed: number;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Callbacks para eventos
  private onStreamEventCallback?: (event: StreamEvent) => void;
  private onUpgradeUnlockedCallback?: (upgrade: UpgradeEvent) => void;
  private onStatsUpdateCallback?: (stats: GameStats) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    try {
      // Conectar al servidor WebSocket (ajustar URL según tu configuración)
      this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Eventos de conexión
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionChangeCallback?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor WebSocket:', reason);
      this.isConnected = false;
      this.onConnectionChangeCallback?.(false);
      
      if (reason === 'io server disconnect') {
        // El servidor desconectó, reconectar manualmente
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error);
      this.handleReconnect();
    });

    // Eventos del juego
    this.socket.on('stream_event', (event: StreamEvent) => {
      console.log('📺 Evento del stream recibido:', event);
      this.onStreamEventCallback?.(event);
    });

    this.socket.on('upgrade_unlocked', (upgrade: UpgradeEvent) => {
      console.log('🚀 Upgrade desbloqueado:', upgrade);
      this.onUpgradeUnlockedCallback?.(upgrade);
    });

    this.socket.on('stats_update', (stats: GameStats) => {
      this.onStatsUpdateCallback?.(stats);
    });

    // Eventos de prueba para desarrollo
    this.socket.on('test_event', (data) => {
      console.log('🧪 Evento de prueba:', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Máximo número de intentos de reconexión alcanzado');
    }
  }

  // Métodos públicos para registrar callbacks
  onStreamEvent(callback: (event: StreamEvent) => void) {
    this.onStreamEventCallback = callback;
  }

  onUpgradeUnlocked(callback: (upgrade: UpgradeEvent) => void) {
    this.onUpgradeUnlockedCallback = callback;
  }

  onStatsUpdate(callback: (stats: GameStats) => void) {
    this.onStatsUpdateCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  // Métodos para enviar eventos al servidor
  sendGameEvent(eventType: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('game_event', { type: eventType, data, timestamp: Date.now() });
    }
  }

  sendEnemyDestroyed(enemyData: UserData) {
    this.sendGameEvent('enemy_destroyed', enemyData);
  }

  sendLifeLost() {
    this.sendGameEvent('life_lost', {});
  }

  sendGameOver(finalStats: any) {
    this.sendGameEvent('game_over', finalStats);
  }

  // Métodos de prueba para desarrollo
  simulateSubscription(userName: string = 'TestUser', level: number = 1) {
    if (!this.socket) return;
    
    const testEvent: StreamEvent = {
      type: 'subscription',
      userData: {
        name: userName,
        level: level,
        eventType: 'subscription'
      },
      timestamp: Date.now()
    };
    
    this.socket.emit('simulate_event', testEvent);
  }

  simulateComment(userName: string = 'TestUser', level: number = 1) {
    if (!this.socket) return;
    
    const testEvent: StreamEvent = {
      type: 'comment',
      userData: {
        name: userName,
        level: level,
        eventType: 'comment'
      },
      timestamp: Date.now()
    };
    
    this.socket.emit('simulate_event', testEvent);
  }

  simulateLike() {
    if (!this.socket) return;
    
    const testEvent: StreamEvent = {
      type: 'like',
      userData: {
        name: 'Anonymous',
        level: 1,
        eventType: 'like'
      },
      timestamp: Date.now()
    };
    
    this.socket.emit('simulate_event', testEvent);
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get connectionStatus(): string {
    if (this.isConnected) return 'Conectado';
    if (this.reconnectAttempts > 0) return `Reconectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
    return 'Desconectado';
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;