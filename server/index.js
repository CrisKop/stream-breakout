const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS para Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Estado del juego
let gameState = {
  totalLikes: 0,
  totalComments: 0,
  totalSubscriptions: 0,
  currentCombo: 0,
  enemiesDestroyed: 0,
  connectedClients: 0
};

// Upgrades disponibles
const upgrades = {
  bounce_upgrade: { required: 100, type: 'likes' },
  multi_ball: { required: 200, type: 'comments' },
  explosive_bounce: { required: 5, type: 'subscriptions' },
  lightning_bounce: { required: 10, type: 'combo' }
};

// Eventos de prueba para simular actividad del stream
const testUsers = [
  { name: 'StreamerFan123', level: 5 },
  { name: 'GamerPro', level: 3 },
  { name: 'ChatMaster', level: 7 },
  { name: 'FollowerOne', level: 2 },
  { name: 'SubGod', level: 10 }
];

// Función para generar eventos aleatorios de prueba
function generateRandomEvent() {
  const eventTypes = ['like', 'comment', 'subscription'];
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  return {
    type: randomType,
    userData: {
      name: randomUser.name,
      level: randomUser.level,
      eventType: randomType
    },
    timestamp: Date.now()
  };
}

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);
  gameState.connectedClients++;
  
  // Enviar estado inicial al cliente
  socket.emit('stats_update', gameState);
  
  // Manejar eventos del juego
  socket.on('game_event', (data) => {
    console.log('🎮 Evento del juego recibido:', data);
    
    switch (data.type) {
      case 'enemy_destroyed':
        console.log('💥 Enemigo destruido recibido en servidor:', data.data);
        gameState.enemiesDestroyed++;
        console.log('📊 Contador actual:', gameState.enemiesDestroyed);
        io.emit('stats_update', gameState);
        break;
        
      case 'life_lost':
        // Resetear combo cuando se pierde una vida
        gameState.currentCombo = 0;
        io.emit('stats_update', gameState);
        break;
        
      case 'upgrade_unlocked':
        console.log('🚀 Upgrade desbloqueado:', data.data.upgradeId);
        break;
    }
  });
  
  // Simular eventos del stream (para pruebas)
  socket.on('simulate_event', (event) => {
    console.log('🧪 Simulando evento:', event);
    handleStreamEvent(event);
  });
  
  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log(`❌ Cliente desconectado: ${socket.id} - ${reason}`);
    gameState.connectedClients--;
  });
});

// Función para manejar eventos del stream
function handleStreamEvent(event) {
  // Actualizar estadísticas
  switch (event.type) {
    case 'like':
      gameState.totalLikes++;
      break;
    case 'comment':
      gameState.totalComments++;
      gameState.currentCombo++;
      break;
    case 'subscription':
      gameState.totalSubscriptions++;
      gameState.currentCombo++;
      break;
  }
  
  // Verificar upgrades desbloqueados
  checkUpgrades();
  
  // Broadcast del evento a todos los clientes
  io.emit('stream_event', event);
  io.emit('stats_update', gameState);
}

// Verificar si algún upgrade se desbloqueó
function checkUpgrades() {
  Object.entries(upgrades).forEach(([upgradeId, upgrade]) => {
    let currentProgress = 0;
    
    switch (upgrade.type) {
      case 'likes':
        currentProgress = gameState.totalLikes;
        break;
      case 'comments':
        currentProgress = gameState.totalComments;
        break;
      case 'subscriptions':
        currentProgress = gameState.totalSubscriptions;
        break;
      case 'combo':
        currentProgress = gameState.currentCombo;
        break;
    }
    
    if (currentProgress >= upgrade.required && !upgrade.unlocked) {
      upgrade.unlocked = true;
      
      const upgradeEvent = {
        type: upgradeId,
        description: getUpgradeDescription(upgradeId),
        timestamp: Date.now()
      };
      
      console.log('🚀 Upgrade desbloqueado:', upgradeEvent);
      io.emit('upgrade_unlocked', upgradeEvent);
    }
  });
}

// Obtener descripción del upgrade
function getUpgradeDescription(upgradeId) {
  const descriptions = {
    bounce_upgrade: '+1 Rebote desbloqueado',
    multi_ball: 'Multi-Pelotas desbloqueado',
    explosive_bounce: 'Rebote Explosivo desbloqueado',
    lightning_bounce: 'Rebote Rayo desbloqueado'
  };
  return descriptions[upgradeId] || 'Upgrade desbloqueado';
}

// Rutas API para testing
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    gameState,
    connectedClients: gameState.connectedClients,
    uptime: process.uptime()
  });
});

app.post('/api/simulate/:eventType', (req, res) => {
  const { eventType } = req.params;
  const { userName = 'TestUser', level = 1 } = req.body;
  
  if (!['like', 'comment', 'subscription'].includes(eventType)) {
    return res.status(400).json({ error: 'Tipo de evento inválido' });
  }
  
  const event = {
    type: eventType,
    userData: {
      name: userName,
      level: level,
      eventType: eventType
    },
    timestamp: Date.now()
  };
  
  handleStreamEvent(event);
  res.json({ success: true, event });
});

app.post('/api/reset', (req, res) => {
  gameState = {
    totalLikes: 0,
    totalComments: 0,
    totalSubscriptions: 0,
    currentCombo: 0,
    enemiesDestroyed: 0,
    connectedClients: gameState.connectedClients
  };
  
  // Resetear upgrades
  Object.values(upgrades).forEach(upgrade => {
    upgrade.unlocked = false;
  });
  
  io.emit('stats_update', gameState);
  res.json({ success: true, gameState });
});

// Generar eventos aleatorios cada 5-15 segundos para pruebas
setInterval(() => {
  if (gameState.connectedClients > 0) {
    const event = generateRandomEvent();
    console.log('🎲 Evento aleatorio generado:', event);
    handleStreamEvent(event);
  }
}, Math.random() * 10000 + 5000); // Entre 5 y 15 segundos

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket ejecutándose en puerto ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/status`);
  console.log(`🎮 Listo para recibir conexiones del juego`);
});