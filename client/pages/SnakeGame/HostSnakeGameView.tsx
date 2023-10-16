import { useEffect, useRef, useState } from 'react';

class Player {
  x: number;
  y: number;
  theta: number;
  speed: number;
  angularSpeed: number;
  movementDirection: string;

  constructor(x: number, y: number, theta: number) {
    this.x = x;
    this.y = y;
    this.theta = theta;
    this.speed = 0.05;
    this.angularSpeed = 0.005;
    this.movementDirection = "straight";
  }

  update(delta: number) {
    const dist = this.speed * delta;
    if (this.movementDirection === "left") {
      this.theta -= this.angularSpeed * delta;
    } else if (this.movementDirection === "right") {
      this.theta += this.angularSpeed * delta;
    }
    this.x += dist * Math.cos(this.theta);
    this.y += dist * Math.sin(this.theta);
  }

  left() {
    this.movementDirection = "left";
  }

  right() {
    this.movementDirection = "right";
  }

  straight() {
    this.movementDirection = "straight";
  }
}

class CurveGame {
  root: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastUpdate: number;
  player: Player;
  running: boolean;

  constructor(root: HTMLCanvasElement, document: Document) {
    this.root = root;
    this.ctx = this.root.getContext("2d");
    this.lastUpdate = 0;
    this.player = new Player(100, 100, 0);
    this.running = true;

    document.onkeydown = (e) => {
      if (e.code === "ArrowLeft") {
        this.player.left();
      } else if (e.code === "ArrowRight") {
        this.player.right();
      }
    };
    document.onkeyup = (e) => {
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        this.player.straight();
      }
    };
  }

  stop() {
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  reset() {
    console.log("clear");
    this.ctx.clearRect(0, 0, 1000, 1000);
    this.player = new Player(100, 100, 0);
  }

  update(now: number) {
    const delta = now - this.lastUpdate;
    this.player.update(delta);

    let x = Math.floor(this.player.x + 0.5);
    let y = Math.floor(this.player.y + 0.5);

    if (this.player.x > this.root.width || this.player.x < 0 || this.player.y > this.root.height || this.player.y < 0) {
      this.reset();
    }

    this.lastUpdate = now;
  }

  draw(now: number) {
    this.ctx.fillRect(this.player.x, this.player.y, 10, 10);
  }
}

interface HostSnakeGameViewProps {
  eventSource: EventSource,
}

const HostSnakeGameView = ({ eventSource }: HostSnakeGameViewProps) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (eventSource == null) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const game = new CurveGame(canvas, document);

    const loop = (now: number) => {
      game.update(now);
      game.draw(now);
      if (game.isRunning()) {
        window.requestAnimationFrame(loop);
      }
    }
    window.requestAnimationFrame(loop);

    const onControlSnake = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.direction == "left") {
        game.player.left();
      } else if (data.direction == "right") {
        game.player.right();
      } else if (data.direction == "straight") {
        game.player.straight();
      } else {
        console.log(`unknown direction: ${data.direction}`);
      }
      console.log(data);
    };
    eventSource.addEventListener("ControlSnake", onControlSnake);

    return () => {
      game.stop();
      eventSource.removeEventListener("ControlSnake", onControlSnake);
    };
  }, [eventSource]);

  return (
    <div>
      <canvas ref={canvasRef} width="1000" height="700"></canvas>
    </div>
  );
};

export default HostSnakeGameView;
