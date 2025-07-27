import * as PIXI from 'pixi.js';

export class Ball {
  public sprite: PIXI.Graphics;
  public velocity: { x: number; y: number };
  public maxBounces: number;
  public currentBounces: number;
  public maxWallBounces: number;
  public currentWallBounces: number;
  public isActive: boolean;
  private onBounceSound?: () => void;

  constructor(x: number, y: number, onBounceSound?: () => void) {
    // Crear sprite de la pelota con nueva API de PixiJS v8
    this.sprite = new PIXI.Graphics();
    this.sprite.circle(0, 0, 8).fill(0xFFFFFF);
    this.sprite.x = x;
    this.sprite.y = y;

    // Configurar velocidad inicial (ángulo aleatorio entre 65° y 115°)
    const angle = (Math.random() * 50 + 65) * (Math.PI / 180); // 65-115 grados en radianes
    const speed = 5;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: -Math.sin(angle) * speed // Negativo para ir hacia arriba
    };

    this.maxBounces = 2; // Puede destruir 2 enemigos antes de autodestruirse
    this.currentBounces = 0;
    this.maxWallBounces = 5; // Máximo 5 rebotes en bordes
    this.currentWallBounces = 0;
    this.isActive = true;
    this.onBounceSound = onBounceSound;
  }

  update(deltaTime: number, screenWidth: number, screenHeight: number): void {
    if (!this.isActive) return;

    // Actualizar posición
    this.sprite.x += this.velocity.x * deltaTime;
    this.sprite.y += this.velocity.y * deltaTime;

    // Rebote en paredes laterales (cuenta como rebote en borde)
    if (this.sprite.x <= 8 || this.sprite.x >= screenWidth - 8) {
      this.bounceOffWall();
      this.velocity.x *= -1;
      this.sprite.x = Math.max(8, Math.min(screenWidth - 8, this.sprite.x));
    }

    // Rebote en techo (cuenta como rebote en borde)
    if (this.sprite.y <= 8) {
      this.bounceOffWall();
      this.velocity.y *= -1;
      this.sprite.y = 8;
    }

    // Rebote en el fondo (cuenta como rebote en borde)
    if (this.sprite.y >= screenHeight - 8) {
      this.bounceOffWall();
      this.velocity.y *= -1;
      this.sprite.y = screenHeight - 8;
    }
  }

  private bounceOffWall(): void {
    this.currentWallBounces++;
    
    // Reproducir sonido de rebote
    if (this.onBounceSound) {
      this.onBounceSound();
    }
    
    console.log(`Pelota rebotó en borde. Rebotes en bordes: ${this.currentWallBounces}/${this.maxWallBounces}`);
    
    // Si agotó los rebotes en bordes, se autodestruye
    if (this.currentWallBounces >= this.maxWallBounces) {
      console.log('Pelota agotó sus rebotes en bordes, autodestruyéndose...');
      this.playDestroyAnimation();
    }
  }

  bounceOffEnemy(): void {
    if (!this.isActive) return;

    // Incrementar contador de rebotes contra enemigos
    this.currentBounces++;
    
    // Rebote hacia arriba
    this.velocity.y = -Math.abs(this.velocity.y); // Asegurar que vaya hacia arriba
    
    // Reproducir sonido de rebote
    if (this.onBounceSound) {
      this.onBounceSound();
    }
    
    console.log(`Pelota rebotó contra enemigo. Rebotes contra enemigos: ${this.currentBounces}/${this.maxBounces}`);

    // Solo se autodestruye si ha alcanzado el máximo de rebotes contra enemigos
    if (this.currentBounces >= this.maxBounces) {
      console.log('Pelota agotó sus rebotes contra enemigos, autodestruyéndose...');
      this.playDestroyAnimation();
    }
  }

  private playDestroyAnimation(): void {
    // Animación simple de destrucción
    const tween = {
      alpha: this.sprite.alpha,
      scale: this.sprite.scale.x
    };

    // Simular tween (en una implementación real usarías una librería de tweening)
    const animate = () => {
      tween.alpha -= 0.05;
      tween.scale += 0.02;
      
      this.sprite.alpha = tween.alpha;
      this.sprite.scale.set(tween.scale);

      if (tween.alpha <= 0) {
        this.destroy();
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  destroy(): void {
    this.isActive = false;
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  // Método para aumentar rebotes contra enemigos (upgrade comunitario)
  addBounce(): void {
    this.maxBounces++;
    console.log(`Upgrade aplicado! Nuevos rebotes máximos contra enemigos: ${this.maxBounces}`);
  }
}
