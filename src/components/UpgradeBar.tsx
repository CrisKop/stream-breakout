'use client';

import React from 'react';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentProgress: number;
  requiredProgress: number;
  isUnlocked: boolean;
  type: 'likes' | 'comments' | 'subscriptions' | 'combo';
}

interface UpgradeBarProps {
  upgrades: Upgrade[];
  className?: string;
}

export const UpgradeBar: React.FC<UpgradeBarProps> = ({ upgrades, className = '' }) => {
  const getProgressPercentage = (upgrade: Upgrade): number => {
    return Math.min((upgrade.currentProgress / upgrade.requiredProgress) * 100, 100);
  };

  const getProgressColor = (upgrade: Upgrade): string => {
    if (upgrade.isUnlocked) return 'bg-green-500';
    
    const percentage = getProgressPercentage(upgrade);
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getBackgroundColor = (upgrade: Upgrade): string => {
    if (upgrade.isUnlocked) return 'bg-green-900/30 border-green-500/50';
    return 'bg-gray-800/50 border-gray-600/50';
  };

  const getStatTypeLabel = (type: string): string => {
    switch (type) {
      case 'likes': return 'likes';
      case 'comments': return 'comentarios';
      case 'subscriptions': return 'subs';
      case 'combo': return 'combo';
      default: return type;
    }
  };

  const getStatTypeColor = (type: string): string => {
    switch (type) {
      case 'likes': return 'text-pink-400';
      case 'comments': return 'text-blue-400';
      case 'subscriptions': return 'text-green-400';
      case 'combo': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 p-4 ${className}`}>
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-purple-400">🚀</span>
        Upgrades Comunitarios
      </h3>
      
      {/* Layout horizontal para pantallas grandes, vertical para móviles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {upgrades.map((upgrade) => (
          <div 
            key={upgrade.id}
            className={`relative p-3 rounded-lg border transition-all duration-300 ${getBackgroundColor(upgrade)}`}
          >
            {/* Efecto de brillo cuando está completo */}
            {upgrade.isUnlocked && (
              <div className="absolute inset-0 bg-green-400/10 rounded-lg animate-pulse pointer-events-none" />
            )}
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{upgrade.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm truncate ${upgrade.isUnlocked ? 'text-green-400' : 'text-white'}`}>
                    {upgrade.name}
                    {upgrade.isUnlocked && (
                      <span className="ml-1 text-xs bg-green-500 text-white px-1 py-0.5 rounded">
                        ✓
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">{upgrade.description}</p>
                </div>
              </div>
              
              {/* Progreso con tipo de estadística */}
              <div className="mb-2">
                <div className={`text-xs font-medium text-center ${upgrade.isUnlocked ? 'text-green-400' : 'text-white'}`}>
                  {upgrade.currentProgress} / {upgrade.requiredProgress} {getStatTypeLabel(upgrade.type)}
                </div>
                <div className={`text-xs text-center ${getStatTypeColor(upgrade.type)}`}>
                  {Math.round(getProgressPercentage(upgrade))}% completado
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${getProgressColor(upgrade)}`}
                  style={{ width: `${getProgressPercentage(upgrade)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Estadísticas generales */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Upgrades activos: {upgrades.filter(u => u.isUnlocked).length}</span>
          <span>Total: {upgrades.length}</span>
        </div>
      </div>
    </div>
  );
};

export default UpgradeBar;