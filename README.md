# 📘 Documento de Diseño
# 🎮 Stream Breakout: Rebellion en el Chat

Juego interactivo automatizado para streaming en vivo

## 🧠 1. Descripción General del Proyecto

**Stream Breakout: Rebellion en el Chat** es un juego automático en pantalla que se ejecuta durante transmisiones en vivo (por ejemplo, en YouTube), diseñado para interactuar con el público en tiempo real.

Cada suscripción, comentario o like genera enemigos personalizados que caen desde la parte superior de la pantalla, y el juego se encarga de destruirlos automáticamente usando pelotas rebotantes. A medida que la audiencia participa, se activan mejoras comunitarias y se registran estadísticas de los usuarios más activos.

El objetivo es ver cuánto tiempo puede resistir el stream (el jugador) sin perder sus 10 vidas, mientras el público intenta "invadir" el juego con sus acciones.

## 🧩 2. Mecánicas Principales del Juego

### ⚙️ Pelotas
- Se lanzan automáticamente desde la parte inferior.
- Ángulo aleatorio entre 75° y 105° para mantener trayectoria vertical.
- Cada pelota inicia con 2 rebotes máximos (solo contra enemigos).
- Rebotes en paredes o techo no cuentan.
- Si la pelota agota sus rebotes, se autodestruye con animación.

### ❤️ Sistema de Vidas
- El stream/jugador inicia con 10 vidas.
- Si un enemigo llega al fondo sin ser destruido → pierde una vida.
- Al perder las 10 vidas:
  - Se reinicia el juego desde cero.
  - Se resetea el progreso de upgrades comunitarios.
  - No se reinician los niveles de los usuarios (solo el intento actual).

## 👾 3. Generación de Enemigos

| Evento del público | Enemigo generado |
|--------------------|------------------|
| ⭐ Suscripción nueva | Letras del nombre del canal como enemigos individuales. |
| 💬 Comentario        | Inicial del canal como enemigo rápido. |
| 👍 Like              | Enemigo anónimo tipo emoji o figura simbólica. |

Cada enemigo:
- Tiene vida según el nivel del usuario.
- Se mueve hacia abajo lentamente (estilo Space Invaders).
- Requiere 1 o más rebotes para ser destruido.

## 🎨 4. Animaciones de Destrucción

- Cada enemigo tiene una animación de muerte personalizada según el nivel del usuario:
  - Nivel bajo → Explosión simple.
  - Nivel medio → Chispa + onda.
  - Nivel alto → Distorsión, brillo o efecto rayo.

## 📈 5. Sistema de Niveles de Usuario

Los usuarios tienen niveles personalizados según su participación histórica.

### 🔼 Factores de nivel:
- Cantidad de comentarios.
- Frecuencia de participación.
- Si se ha suscrito y reaparecido varias veces.

### 💥 Impacto del nivel:
- Más vida del enemigo.
- Apariencia distinta.
- Mejor animación de destrucción.

⚠️ Los niveles se guardan en base de datos (MongoDB) y persisten entre partidas.

## 🚀 6. Upgrades Comunitarios

Los espectadores pueden desbloquear mejoras si colectivamente alcanzan ciertas metas.

| Upgrade            | Requisito Global                  | Efecto                                          |
|--------------------|------------------------------------|--------------------------------------------------|
| +1 rebote          | 100 likes acumulados              | Pelotas duran más.                              |
| Multi-pelotas      | 200 comentarios                   | Se lanzan varias pelotas a la vez.              |
| Rebote explosivo   | 5 nuevos suscriptores             | Golpea enemigos cercanos.                       |
| Rebote rayo        | 10 comentarios seguidos (combo)   | Rebota en línea destruyendo fila o columna.     |

- Los upgrades se reinician al perder las 10 vidas.
- Se puede mostrar una barra de progreso por upgrade en pantalla.

## 💬 7. Chat Visual en Pantalla

### 📋 Funciones:
- Muestra acciones del juego en tiempo real:
  - Suscriptores.
  - Enemigos generados.
  - Pelotas destruidas.
  - Upgrades desbloqueados.
- Ubicación: Lateral o inferior del juego.
- Scroll automático y estilo temático.
- Colores y emojis para eventos distintos.

## 🧱 8. Estructura Técnica del Proyecto

### 🖥️ Frontend
- **Framework:** React con Next.js
  - Para facilitar el ruteo si se expanden funcionalidades (admin panel, leaderboard, etc.)
- **Renderizado del juego:** PixiJS
  - Para gráficos animados en 2D, sprites, colisiones, partículas, etc.
- **UI reactiva (chat, upgrades):** React puro.

### 🔌 Backend
- **Plataforma:** Node.js
- **Comunicación:** WebSocket (emisión en tiempo real hacia frontend)
- **Base de datos:** MongoDB
  - Guarda estadísticas de usuarios, niveles, histórico de interacciones.
  - No guarda progreso temporal (vidas, upgrades actuales).

### 📦 Estructura del Proyecto

```
/frontend (Next.js)
 ├── /components
 │    ├── GameCanvas.tsx     ← Contenedor de PixiJS dentro de React
 │    ├── ChatFeed.tsx       ← Chat de acciones en pantalla
 │    ├── UpgradeBar.tsx     ← Progreso de mejoras
 ├── /engine
 │    ├── Ball.ts
 │    ├── Enemy.ts
 │    ├── CollisionSystem.ts
 ├── /services
 │    └── socket.ts          ← WebSocket cliente
 ├── /pages
 │    └── index.tsx
 └── styles

/backend (Node.js)
 ├── server.js               ← Servidor WebSocket + lógica de eventos
 ├── youtubeHandler.js       ← Conexión con YouTube Data API
 ├── upgradeSystem.js        ← Control de mejoras comunitarias
 ├── db/
 │    └── userModel.js       ← Esquema de niveles de usuario
 └── .env                    ← Claves API (YouTube, MongoDB, etc.)
```

## 🧪 9. Flujo del Juego

1. Inicia el stream → se carga el juego.
2. WebSocket escucha eventos en tiempo real del backend.
3. Llega un evento (like, comentario, sub).
4. Se genera el enemigo correspondiente y aparece en pantalla.
5. Pelotas automáticas destruyen enemigos con rebotes limitados.
6. El chat muestra las acciones en tiempo real.
7. Enemigos que llegan al fondo → pierdes una vida.
8. Cuando se pierden 10 vidas, se reinicia el progreso del juego.
9. Estadísticas de usuarios se siguen acumulando en MongoDB.