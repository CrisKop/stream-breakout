import { Ball } from "./Ball";
import { Enemy, UserData } from "./Enemy";

export class CollisionSystem {
  // Set para rastrear instancias de enemigos ya destruidos en este frame
  private static destroyedEnemiesThisFrame = new WeakSet<Enemy>();

  static checkBallEnemyCollision(ball: Ball, enemy: Enemy): boolean {
    if (!ball.isActive || !enemy.isActive) return false;

    const ballBounds = ball.sprite.getBounds();
    const enemyBounds = enemy.sprite.getBounds();

    return this.rectanglesIntersect(ballBounds, enemyBounds);
  }

  static checkBallEnemyCollisions(
    balls: Ball[], 
    enemies: Enemy[], 
    onEnemyDestroyed?: (userData: UserData) => void
  ): void {
    // NO recrear el WeakSet aquí - mantenerlo entre llamadas del mismo frame

    balls.forEach(ball => {
      if (!ball.isActive) return;

      enemies.forEach(enemy => {
        if (!enemy.isActive) return;
        
        // Verificar si esta instancia específica de enemigo ya fue destruida
        if (this.destroyedEnemiesThisFrame.has(enemy)) return;

        if (this.checkBallEnemyCollision(ball, enemy)) {
          console.log(`🏀 Colisión detectada entre pelota y ${enemy.userData.name}`);
          
          // La pelota rebota
          ball.bounceOffEnemy();
          console.log(`🏀 Pelota rebotó. Nueva velocidad Y: ${ball.velocity.y}`);
          
          // El enemigo recibe daño
          const enemyDestroyed = enemy.takeDamage();
          
          // Si el enemigo fue destruido, reproducir sonido y notificar
          if (enemyDestroyed) {
            const enemyId = enemy.userData.id || `${enemy.userData.name}-${enemy.userData.characterIndex || 0}`;
            console.log(`💥 Enemigo destruido en CollisionSystem: ${enemy.userData.name}, ID: ${enemyId}`);
            
            // Marcar esta instancia específica como destruida
            this.destroyedEnemiesThisFrame.add(enemy);
            
            if (onEnemyDestroyed) {
              onEnemyDestroyed(enemy.userData);
            }
          }
        }
      });
    });
  }

  private static rectanglesIntersect(rect1: any, rect2: any): boolean {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
  }
}
