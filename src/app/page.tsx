'use client';

import { useRef, useState, useCallback } from "react";
import GameCanvas, { GameCanvasRef } from "../components/GameCanvas";
import ChatFeed from "../components/ChatFeed";
import UpgradeBar from "../components/UpgradeBar";
import { useGameSocket } from "../services/useGameSocket";
import { UserData } from "../engine/Enemy";

export default function Home() {
  const gameCanvasRef = useRef<GameCanvasRef>(null);
  const [lives, setLives] = useState(10);
  const [score, setScore] = useState(0);
  const [ballsActive, setBallsActive] = useState(0);

  // Callbacks para el hook useGameSocket
  const handleEnemySpawn = useCallback((userData: UserData) => {
    console.log("🎯 Creando enemigo:", userData);

    // Si es una suscripción con múltiples enemigos, mostrar información adicional
    if (
      userData.eventType === "subscription" &&
      userData.spawnDelay !== undefined
    ) {
      const enemyNumber = userData.spawnDelay / 200 + 1;
      console.log(
        `   └─ Enemigo ${enemyNumber} de ${userData.name} (${userData.name.length} caracteres)`
      );
    }

    gameCanvasRef.current?.addEnemy(userData);
  }, []);

  const handleUpgradeActivated = useCallback((upgradeType: string) => {
    console.log("⚡ Upgrade activado:", upgradeType);
    if (upgradeType === "extra_bounce") {
      gameCanvasRef.current?.addBounceUpgrade();
    }
    // Aquí puedes agregar más tipos de upgrades en el futuro
  }, []);

  const {
    isConnected,
    chatMessages,
    upgrades,
    gameStats,
    reportEnemyDestroyed,
    reportLifeLost,
  } = useGameSocket({
    onEnemySpawn: handleEnemySpawn,
    onUpgradeActivated: handleUpgradeActivated,
  });

  const handleLifeLost = useCallback(() => {
    setLives((prev) => Math.max(0, prev - 1));
    reportLifeLost();
  }, [reportLifeLost]);

  const handleEnemyDestroyed = useCallback(
    (enemyData: UserData) => {
      setScore((prev) => prev + enemyData.level * 10);
      reportEnemyDestroyed(enemyData);
    },
    [reportEnemyDestroyed]
  );

  const handleGameOver = useCallback(() => {
    setLives(0);
    setBallsActive(0);
  }, []);

  const handleResetGame = () => {
    gameCanvasRef.current?.resetGame();
    setLives(10);
    setScore(0);
    setBallsActive(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-400">
            Stream Breakout
          </h1>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              <span className="text-sm">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <button
              onClick={handleResetGame}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
            >
              Reiniciar Juego
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Community Upgrades - Moved to top with full width */}
        <div className="mb-6">
          <UpgradeBar upgrades={upgrades} className="w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Canvas - Takes most space */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Área de Juego</h2>
                <div className="flex gap-6 text-sm text-gray-300">
                  <span>Vidas: {lives}</span>
                  <span>Enemigos Destruidos: {gameStats.enemiesDestroyed}</span>
                  <span>Puntuación: {score}</span>
                </div>
              </div>
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <GameCanvas
                  ref={gameCanvasRef}
                  onLifeLost={handleLifeLost}
                  onEnemyDestroyed={handleEnemyDestroyed}
                  onGameOver={handleGameOver}
                  lives={lives}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chat Feed */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-green-400">
                Actividad del Stream
              </h3>
              <ChatFeed messages={chatMessages} />
            </div>

            {/* Game Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">
                Estadísticas
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Likes:</span>
                  <span className="text-pink-400">{gameStats.totalLikes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comentarios:</span>
                  <span className="text-blue-400">
                    {gameStats.totalComments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Suscripciones:</span>
                  <span className="text-green-400">
                    {gameStats.totalSubscriptions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Combo:</span>
                  <span className="text-yellow-400">
                    {gameStats.currentCombo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-8 p-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>Stream Breakout - Juego interactivo para streamers</p>
          <p className="mt-1">
            Los viewers pueden influir en el juego a través de follows, subs y
            donations
          </p>
        </div>
      </footer>
    </div>
  );
}
