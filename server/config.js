module.exports = {
  // Configuración del servidor
  PORT: process.env.PORT || 3001,
  
  // Configuración de CORS
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
  ],
  
  // Configuración del juego
  GAME_CONFIG: {
    // Intervalos para eventos automáticos (en ms)
    AUTO_EVENT_MIN_INTERVAL: 5000,  // 5 segundos
    AUTO_EVENT_MAX_INTERVAL: 15000, // 15 segundos
    
    // Límites de progreso para upgrades
    UPGRADES: {
      bounce_upgrade: { required: 10, type: 'likes' },      // Reducido para pruebas
      multi_ball: { required: 20, type: 'comments' },       // Reducido para pruebas
      explosive_bounce: { required: 3, type: 'subscriptions' }, // Reducido para pruebas
      lightning_bounce: { required: 5, type: 'combo' }      // Reducido para pruebas
    }
  }
};