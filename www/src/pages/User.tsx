import React, { useState } from 'react';
import '../App.css';
import PlayerBetView from './PlayerBetView';
import AddPlayerView from './AddPlayerView';

const User = () => {
  console.log("re-render user");
  const [view, setView] = useState({
    name: "AddPlayerView",
    uniqKey: 1,
  });

  const [playerId, setPlayerId] = useState(null);

  const connectPlayer = (playerId: number) => {
    setPlayerId(playerId);

    const eventSource = new EventSource(`/api/connect/player/${playerId}`);
    eventSource.addEventListener("SetView", (event) => {
      console.log("Event: SetView");
      const data = JSON.parse(event.data);

      setView({
        name: data.name,
        uniqKey: Date.now(),
      });
    });
  }

  const getViewComponent = (view: string, uniqKey: number) => {
    if (view == "BetView") {
      return <PlayerBetView key={uniqKey} playerId={playerId} />
    }
    return <AddPlayerView key={uniqKey} onPlayerAdd={connectPlayer} />
  };

  console.log(view);

  return (
    <div className="App">
      {getViewComponent(view.name, view.uniqKey)}
    </div>
  );
}

export default User;
