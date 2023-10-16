import { TouchEvent, CSSProperties, useState } from 'react';

interface PlayerSnakeControlViewProps {
  playerId: number,
}

interface Touch {
  ts: number,
  x: number,
}

const log = async (data: string) => {
  await fetch("/api/log", {
    method: "POST",
    body: JSON.stringify({ data }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    },
  });
};

const containerStyle: CSSProperties = {
  position: "fixed",
  width: "100%",
  height: "100%",
};

const buttonStyle: CSSProperties = {
  userSelect: "none",
  display: "inline-block",
  width: "50%",
  height: "100%",
};

class Controller {
  inputBuffer: Array<string>;
  flushing: boolean;
  width: number;
  touches: Map<number, Touch>;
  playerId: number;

  constructor(playerId: number, width: number) {
    this.inputBuffer = [];
    this.flushing = false;
    this.width = width;
    this.touches = new Map();
    this.playerId = playerId;
  }

  async sendInput(direction: string) {
    const time = new Date().getTime();

    await fetch("/api/player/snake/control", {
      method: "POST",
      body: JSON.stringify({ playerId: this.playerId, direction, time }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
    });
  };

  async flush() {
    if (this.flushing) {
      return;
    }
    this.flushing = true;
    while (this.inputBuffer.length > 0) {
      const direction = this.inputBuffer.shift();
      await this.sendInput(direction);
    }
    this.flushing = false;
  }

  latestTouch(): Touch {
    if (this.touches.size == 0) {
      return null;
    }
    let latest = null;

    for (const touch of this.touches.values()) {
      if (latest == null || touch.ts > latest.ts) {
        latest = touch;
      }
    }
    return latest;
  }

  enqueueInput() {
    const latest = this.latestTouch();
    if (latest == null) {
      this.inputBuffer.push("straight");
      this.flush();
      return;
    }
    const direction = latest.x < this.width / 2
      ? "left"
      : "right";

    this.inputBuffer.push(direction);
    this.flush();
  }

  touch(id: number, x: number) {
    const ts = new Date().getTime();
    this.touches.set(id, { ts, x });
    this.enqueueInput();
  }

  touchEnd(id: number) {
    this.touches.delete(id);
    this.enqueueInput();
  }
}

const PlayerSnakeControlView = ({ playerId }: PlayerSnakeControlViewProps) => {
  const [controller, _] = useState(new Controller(playerId, window.screen.width));

  const onTouch = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      controller.touch(touch.identifier, touch.screenX);
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      controller.touchEnd(touch.identifier);
    }
  }
  return (
    <div
      style={containerStyle}
      onTouchStart={onTouch}
      onTouchMove={onTouch}
      onTouchCancel={onTouchEnd}
      onTouchEnd={onTouchEnd}
    >
      <div style={buttonStyle}>Left</div>
      <div style={buttonStyle}>Right</div>
    </div>
  );
};

export default PlayerSnakeControlView;
