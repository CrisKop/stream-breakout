"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import * as PIXI from "pixi.js";
import { Ball } from "@/engine/Ball";
import { Enemy, UserData } from "@/engine/Enemy";
import { CollisionSystem } from "@/engine/CollisionSystem";
import { useSounds } from "@/services/useSounds";

interface GameCanvasProps {
  onLifeLost: () => void;
  onEnemyDestroyed: (enemy: UserData) => void;
  onGameOver: () => void;
  lives: number;
}

export interface GameCanvasRef {
  addEnemy: (userData: UserData) => void;
  addBounceUpgrade: () => void;
  resetGame: () => void;
}

export const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
  ({ onLifeLost, onEnemyDestroyed, onGameOver, lives }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const gameStateRef = useRef({
      balls: [] as Ball[],
      enemies: [] as Enemy[],
      lastBallTime: 0,
      ballInterval: 2000, // 2 segundos entre pelotas
      isGameRunning: true,
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hook de sonidos
    const {
      initializeGameSounds,
      enableAudio,
      playBounce,
      playPop,
      playBoom,
      playLiveLost,
      getIsAudioEnabled,
    } = useSounds();

    useEffect(() => {
      initializeGameSounds();
      initializePixi();
      return () => {
        if (appRef.current) {
          appRef.current.destroy(true);
        }
      };
    }, [initializeGameSounds]);

    useEffect(() => {
      if (lives <= 0 && gameStateRef.current.isGameRunning) {
        gameStateRef.current.isGameRunning = false;
        onGameOver();
        resetGame();
      }
    }, [lives, onGameOver]);

    // Manejar clics para habilitar audio
    const handleCanvasClick = useCallback(async () => {
      if (!getIsAudioEnabled()) {
        console.log("🖱️ Click detectado, habilitando audio...");
        await enableAudio();
      }
    }, [enableAudio, getIsAudioEnabled]);

    const createLifeLine = () => {
      if (!appRef.current) return;

      // Crear la línea roja de límite de vida
      const lifeLine = new PIXI.Graphics();

      // Configurar el estilo de línea y dibujar
      lifeLine
        .clear()
        .setStrokeStyle({
          width: 4,
          color: 0xff0000,
          alpha: 1.0,
        })
        .moveTo(0, 550)
        .lineTo(800, 550)
        .stroke();

      // Agregar efecto de parpadeo sutil
      let time = 0;
      const animate = () => {
        if (!appRef.current || !lifeLine.parent) return;

        time += 0.05;
        lifeLine.alpha = 0.7 + Math.sin(time) * 0.3; // Parpadeo entre 0.4 y 1.0

        requestAnimationFrame(animate);
      };
      animate();

      // Agregar al stage al final para que esté encima de otros elementos
      appRef.current.stage.addChild(lifeLine);

      console.log("🚨 Línea roja de límite creada en Y=550");
    };

    const initializePixi = async () => {
      if (!canvasRef.current) return;

      try {
        console.log("Inicializando PixiJS...");

        const app = new PIXI.Application();

        if (typeof (app as any).init === "function") {
          await (app as any).init({
            width: 800,
            height: 600,
            backgroundColor: 0x1a1a2e,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            powerPreference: "high-performance",
            hello: false,
          });
        } else {
          console.log("Usando PixiJS v7 compatibility mode");
        }

        console.log("PixiJS inicializado correctamente");
        appRef.current = app;

        let canvas: HTMLCanvasElement | null = null;

        if ((app as any).canvas) {
          canvas = (app as any).canvas;
        } else if ((app as any).view) {
          canvas = (app as any).view;
        }

        if (canvas && canvasRef.current) {
          canvasRef.current.innerHTML = "";
          canvasRef.current.appendChild(canvas);

          canvas.style.display = "block";
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.style.cursor = "pointer";

          // Agregar event listener para habilitar audio
          canvas.addEventListener("click", handleCanvasClick);
          canvas.addEventListener("touchstart", handleCanvasClick);
        } else {
          throw new Error("Canvas no disponible en la aplicación PixiJS");
        }

        // Crear la línea de límite de vida
        createLifeLine();

        app.ticker.add(gameLoop);
        setIsInitialized(true);
        setError(null);

        // Intentar habilitar audio automáticamente después de un pequeño delay
        setTimeout(async () => {
          if (!getIsAudioEnabled()) {
            console.log("🔊 Intentando habilitar audio automáticamente...");
            await enableAudio();
          }
        }, 1000);
      } catch (error) {
        console.error("Error inicializando PixiJS:", error);
        setError(
          `Error inicializando el juego: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    };

    const createHeartBreakAnimation = () => {
      if (!appRef.current) return;

      console.log("💔 Creando animación de corazón roto...");

      // Crear el corazón completo primero
      const heartContainer = new PIXI.Container();
      heartContainer.x = 400; // Centro horizontal
      heartContainer.y = 300; // Centro vertical

      // Crear el corazón usando texto emoji
      const heartText = new PIXI.Text("💖", {
        fontSize: 120,
        fill: 0xff69b4,
        fontFamily: "Arial",
      });
      heartText.anchor.set(0.5);
      heartContainer.addChild(heartText);

      // Agregar al stage
      appRef.current.stage.addChild(heartContainer);

      // Fase 1: Aparecer con escala creciente
      let phase = 1;
      let time = 0;
      const animate = () => {
        if (!appRef.current || !heartContainer.parent) return;

        time += 0.1;

        if (phase === 1) {
          // Aparecer creciendo
          const scale = Math.min(time * 2, 1);
          heartContainer.scale.set(scale);
          heartText.rotation = Math.sin(time * 8) * 0.1; // Pequeña vibración

          if (time >= 3) {
            phase = 2;
            time = 0;
            // Crear las dos mitades del corazón
            createBrokenHeartPieces(heartContainer);
          }
        } else if (phase === 2) {
          // Las piezas ya están animándose, solo esperar
          if (time >= 6) {
            // Limpiar después de 2 segundos
            if (heartContainer.parent) {
              heartContainer.parent.removeChild(heartContainer);
            }
            return;
          }
        }

        requestAnimationFrame(animate);
      };

      animate();
    };

    const createBrokenHeartPieces = (originalContainer: PIXI.Container) => {
      if (!appRef.current) return;

      // Remover el corazón original
      originalContainer.removeChildren();

      // Crear mitad izquierda del corazón
      const leftHeart = new PIXI.Text("💔", {
        fontSize: 80,
        fill: 0xff0000,
        fontFamily: "Arial",
      });
      leftHeart.anchor.set(0.5);
      leftHeart.x = -20;

      // Crear mitad derecha del corazón
      const rightHeart = new PIXI.Text("💔", {
        fontSize: 80,
        fill: 0xff0000,
        fontFamily: "Arial",
      });
      rightHeart.anchor.set(0.5);
      rightHeart.x = 20;
      rightHeart.scale.x = -1; // Voltear horizontalmente

      originalContainer.addChild(leftHeart);
      originalContainer.addChild(rightHeart);

      // Animar las piezas cayendo
      let time = 0;
      const animatePieces = () => {
        if (!appRef.current || !originalContainer.parent) return;

        time += 0.05;

        // Mitad izquierda: cae hacia la izquierda
        leftHeart.x -= 3;
        leftHeart.y += time * 8; // Gravedad
        leftHeart.rotation += 0.1; // Rotación
        leftHeart.alpha = Math.max(0, 1 - time * 0.5); // Desvanecimiento

        // Mitad derecha: cae hacia la derecha
        rightHeart.x += 3;
        rightHeart.y += time * 8; // Gravedad
        rightHeart.rotation -= 0.1; // Rotación opuesta
        rightHeart.alpha = Math.max(0, 1 - time * 0.5); // Desvanecimiento

        // Continuar hasta que las piezas desaparezcan
        if (time < 2) {
          requestAnimationFrame(animatePieces);
        }
      };

      animatePieces();
    };

    const gameLoop = (ticker: PIXI.Ticker) => {
      if (!appRef.current || !gameStateRef.current.isGameRunning) return;

      const deltaTime = ticker.deltaTime;
      const currentTime = Date.now();

      if (
        currentTime - gameStateRef.current.lastBallTime >
        gameStateRef.current.ballInterval
      ) {
        createBall();
        gameStateRef.current.lastBallTime = currentTime;
      }

      gameStateRef.current.balls = gameStateRef.current.balls.filter((ball) => {
        if (!ball.isActive) return false;
        ball.update(deltaTime, 800, 600);
        return ball.isActive;
      });

      gameStateRef.current.enemies = gameStateRef.current.enemies.filter(
        (enemy) => {
          if (!enemy.isActive) return false;

          enemy.update(deltaTime);

          if (enemy.hasReachedBottom(600)) {
            enemy.destroy();
            console.log(
              "💔 Vida perdida - reproduciendo sonido y animación..."
            );
            playLiveLost(); // Reproducir sonido cuando se pierde una vida
            createHeartBreakAnimation(); // Mostrar animación de corazón roto
            onLifeLost();
            return false;
          }

          return true;
        }
      );

      // Pasar la función onEnemyDestroyed al CollisionSystem
      CollisionSystem.checkBallEnemyCollisions(
        gameStateRef.current.balls,
        gameStateRef.current.enemies,
        (userData: UserData) => {
          console.log(`🎯 Enemigo destruido por pelota: ${userData.name}`);
          playBoom(); // Reproducir sonido de explosión
          onEnemyDestroyed(userData); // Notificar al componente padre
        }
      );

      // Limpiar enemigos inactivos (ya destruidos)
      gameStateRef.current.enemies = gameStateRef.current.enemies.filter(
        (enemy) => {
          return enemy.isActive;
        }
      );
    };

    const createBall = () => {
      if (!appRef.current) return;

      console.log("🏀 Creando nueva pelota...");
      const ball = new Ball(400, 550, playBounce);
      appRef.current.stage.addChild(ball.sprite);
      gameStateRef.current.balls.push(ball);

      console.log("🎈 Reproduciendo sonido pop...");
      playPop();
    };

    const addEnemy = (userData: UserData) => {
      if (!appRef.current || !gameStateRef.current.isGameRunning) return;

      const x = Math.random() * 750 + 25;
      const enemy = new Enemy(x, -30, userData);
      appRef.current.stage.addChild(enemy.sprite);
      gameStateRef.current.enemies.push(enemy);
    };

    const resetGame = () => {
      if (!appRef.current) return;

      gameStateRef.current.balls.forEach((ball) => ball.destroy());
      gameStateRef.current.enemies.forEach((enemy) => enemy.destroy());

      gameStateRef.current.balls = [];
      gameStateRef.current.enemies = [];
      gameStateRef.current.lastBallTime = 0;
      gameStateRef.current.isGameRunning = true;

      // Recrear la línea de vida después del reset
      createLifeLine();
    };

    const addBounceUpgrade = () => {
      gameStateRef.current.balls.forEach((ball) => ball.addBounce());
    };

    useImperativeHandle(ref, () => ({
      addEnemy,
      addBounceUpgrade,
      resetGame,
    }));

    if (error) {
      return (
        <div className="relative">
          <div
            className="border-2 border-red-600 rounded-lg overflow-hidden bg-red-900/20"
            style={{ width: "800px", height: "600px" }}
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-400">
                <div className="text-lg font-semibold mb-2">
                  ❌ Error del Juego
                </div>
                <div className="text-sm">{error}</div>
                <button
                  onClick={initializePixi}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div
          ref={canvasRef}
          className="border-2 border-gray-600 rounded-lg overflow-hidden bg-gray-900"
          style={{ width: "800px", height: "600px" }}
          onClick={handleCanvasClick}
        />
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-white text-lg">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Cargando juego...
            </div>
          </div>
        )}
      </div>
    );
  }
);

GameCanvas.displayName = "GameCanvas";

export default GameCanvas;
