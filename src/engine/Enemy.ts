import * as PIXI from 'pixi.js';

export interface UserData {
  name: string;
  level: number;
  eventType: 'subscription' | 'comment' | 'like';
  id?: string; // ID único para cada enemigo
  spawnDelay?: number; // Delay en milisegundos para spawn escalonado
  characterIndex?: number; // Índice del carácter a mostrar para suscripciones
}

export class Enemy {
  public sprite: PIXI.Container;
  public health: number;
  public maxHealth: number;
  public userData: UserData;
  public isActive: boolean;
  private speed: number;
  private text: PIXI.Text;

  constructor(x: number, y: number, userData: UserData) {
    this.userData = userData;
    this.isActive = true;
    this.speed = 1 + (userData.level * 0.1); // Velocidad basada en nivel

    // Salud basada en el nivel del usuario
    this.maxHealth = Math.max(1, Math.floor(userData.level / 2));
    this.health = this.maxHealth;

    // Crear contenedor principal
    this.sprite = new PIXI.Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Crear texto con estilo inicial
    const displayText = this.getDisplayText();
    this.text = new PIXI.Text(displayText, this.getTextStyle());

    this.createVisual();
  }

  private createVisual(): void {
    // Todos los tipos de enemigos ahora tienen efecto glowing
    this.createGlowingLetter();

    // Configurar posición del texto
    this.text.anchor.set(0.5);
    this.sprite.addChild(this.text);

    // Hacer todos los enemigos el triple de grandes
    this.sprite.scale.set(3, 3);
  }

  private getColorByEventType(): number {
    switch (this.userData.eventType) {
      case 'subscription': return 0xFF6B6B; // Rojo para suscripciones
      case 'comment': return 0x4ECDC4;      // Azul para comentarios
      case 'like': return 0xFFE66D;         // Amarillo para likes
      default: return 0x95E1D3;
    }
  }

  private createGlowingLetter(): void {
    // Crear múltiples capas de texto para efecto glow según el tipo de evento
    let glowLayers: Array<{ size: number; color: number; alpha: number; stroke: number; strokeWidth: number }>;
    
    if (this.userData.eventType === 'subscription') {
      // Efecto rojo para suscripciones
      glowLayers = [
        { size: 60, color: 0x000000, alpha: 0.8, stroke: 0x000000, strokeWidth: 6 }, // Sombra
        { size: 54, color: 0xFF6B6B, alpha: 0.6, stroke: 0xFF6B6B, strokeWidth: 3 }, // Glow exterior rojo
        { size: 48, color: 0xFF9999, alpha: 0.8, stroke: 0xFF9999, strokeWidth: 2 }, // Glow medio
        { size: 42, color: 0xFFCCCC, alpha: 1.0, stroke: 0xFFCCCC, strokeWidth: 0 }  // Glow interior
      ];
    } else if (this.userData.eventType === 'like') {
      // Efecto dorado para likes
      glowLayers = [
        { size: 60, color: 0x000000, alpha: 0.8, stroke: 0x000000, strokeWidth: 6 }, // Sombra
        { size: 54, color: 0xFFD700, alpha: 0.6, stroke: 0xFFD700, strokeWidth: 3 }, // Glow exterior dorado
        { size: 48, color: 0xFFE55C, alpha: 0.8, stroke: 0xFFE55C, strokeWidth: 2 }, // Glow medio
        { size: 42, color: 0xFFF8DC, alpha: 1.0, stroke: 0xFFF8DC, strokeWidth: 0 }  // Glow interior
      ];
    } else {
      // Efecto azul para comentarios
      glowLayers = [
        { size: 60, color: 0x000000, alpha: 0.8, stroke: 0x000000, strokeWidth: 6 }, // Sombra
        { size: 54, color: 0x4ECDC4, alpha: 0.6, stroke: 0x4ECDC4, strokeWidth: 3 }, // Glow exterior azul
        { size: 48, color: 0x7FDBDA, alpha: 0.8, stroke: 0x7FDBDA, strokeWidth: 2 }, // Glow medio
        { size: 42, color: 0xB3E5E4, alpha: 1.0, stroke: 0xB3E5E4, strokeWidth: 0 }  // Glow interior
      ];
    }

    const displayText = this.getDisplayText();

    glowLayers.forEach((layer) => {
      const style: Partial<PIXI.TextStyle> = {
        fontSize: layer.size,
        fill: layer.color,
        fontWeight: 'bold',
        fontFamily: 'Arial Black'
      };

      // Agregar stroke solo si strokeWidth > 0
      if (layer.strokeWidth > 0) {
        style.stroke = { color: layer.stroke, width: layer.strokeWidth };
      }

      const glowText = new PIXI.Text(displayText, style);
      glowText.anchor.set(0.5);
      glowText.alpha = layer.alpha;
      this.sprite.addChild(glowText);
    });

    // Animación de pulsación para el efecto glow
    this.startGlowAnimation();
  }

  private startGlowAnimation(): void {
    let time = 0;
    const animate = () => {
      if (!this.isActive) return;
      
      time += 0.1;
      
      // Diferentes efectos de pulsación según el tipo
      let pulse: number;
      if (this.userData.eventType === 'subscription') {
        pulse = 0.8 + Math.sin(time) * 0.2; // Pulsación suave para suscripciones
      } else if (this.userData.eventType === 'like') {
        pulse = 0.9 + Math.sin(time * 2) * 0.1; // Pulsación más rápida y sutil para likes
      } else if (this.userData.eventType === 'comment') {
        pulse = 0.85 + Math.sin(time * 1.5) * 0.15; // Pulsación media para comentarios
      } else {
        pulse = 1.0; // Sin pulsación para otros tipos
      }
      
      // Aplicar pulsación a todos los children (capas de glow)
      this.sprite.children.forEach(child => {
        child.scale.set(pulse);
      });
      
      requestAnimationFrame(animate);
    };
    animate();
  }

  private getTextStyle(): PIXI.TextStyle {
    // Estilo especial para todos los tipos (será sobrescrito por createGlowingLetter)
    return new PIXI.TextStyle({
      fontSize: 42, // Más grande
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      fontFamily: 'Arial Black'
    });
  }

  private getDisplayText(): string {
    switch (this.userData.eventType) {
      case 'subscription':
        // Para suscripciones, mostrar el carácter específico del nombre
        if (this.userData.characterIndex !== undefined) {
          const char = this.userData.name.charAt(this.userData.characterIndex);
          return char.toUpperCase();
        }
        return this.userData.name.charAt(0).toUpperCase();
      case 'comment':
        // Para comentarios, mostrar inicial del usuario
        return this.userData.name.charAt(0).toUpperCase();
      case 'like':
        // Para likes, mostrar emoji
        return '👍';
      default:
        return '?';
    }
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    // Mover hacia abajo
    this.sprite.y += this.speed * deltaTime;
  }

  takeDamage(): boolean {
    if (!this.isActive) return false;

    this.health--;

    if (this.health <= 0) {
      this.playDeathAnimation();
      return true; // Enemigo destruido
    }

    return false; // Enemigo aún vivo
  }

  private playDeathAnimation(): void {
    // Animación de muerte basada en el nivel del usuario
    const animationType = this.getAnimationType();
    
    switch (animationType) {
      case 'simple':
        this.simpleExplosion();
        break;
      case 'medium':
        this.sparkExplosion();
        break;
      case 'advanced':
        this.lightningExplosion();
        break;
    }
  }

  private getAnimationType(): 'simple' | 'medium' | 'advanced' {
    if (this.userData.level < 5) return 'simple';
    if (this.userData.level < 15) return 'medium';
    return 'advanced';
  }

  private simpleExplosion(): void {
    // Explosión simple - escala y desvanecimiento
    const animate = () => {
      this.sprite.scale.x += 0.05;
      this.sprite.scale.y += 0.05;
      this.sprite.alpha -= 0.08;

      if (this.sprite.alpha <= 0) {
        this.destroy();
      } else {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private sparkExplosion(): void {
    // Explosión con chispas - rotación y escala
    let rotation = 0;
    const animate = () => {
      rotation += 0.2;
      this.sprite.rotation = rotation;
      this.sprite.scale.x += 0.03;
      this.sprite.scale.y += 0.03;
      this.sprite.alpha -= 0.06;

      if (this.sprite.alpha <= 0) {
        this.destroy();
      } else {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private lightningExplosion(): void {
    // Explosión avanzada - efecto de rayo
    let flash = 0;
    const animate = () => {
      flash += 0.3;
      this.sprite.alpha = Math.abs(Math.sin(flash));
      this.sprite.scale.x += 0.04;
      this.sprite.scale.y += 0.04;

      if (flash > Math.PI * 3) {
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

  // Verificar si el enemigo llegó al fondo
  hasReachedBottom(screenHeight: number): boolean {
    return this.sprite.y > screenHeight - 50;
  }
}