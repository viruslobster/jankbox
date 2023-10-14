import React, { useState } from 'react';
import '../App.css';
import PlayerBetView from './BetGame/PlayerBetView';
import AddPlayerView from './AddPlayerView';
import PlayerCreateEpisodeView from './Quiplash/PlayerCreateEpisodeView'

const User = () => {
  console.log("re-render user");
  const [view, setView] = useState({
    name: "AddPlayerView",
    uniqKey: 1,
  });

  const [playerId, setPlayerId] = useState(null);

  const connectPlayer = (playerId: number) => {
    setPlayerId(playerId);
    setView({
      name: "PlayerCreateEpisodeView",
      uniqKey: Date.now(),
    });

    // const eventSource = new EventSource(`/api/connect/player/${playerId}`);
    // eventSource.addEventListener("SetView", (event) => {
    //   console.log("Event: SetView");
    //   const data = JSON.parse(event.data);

    //   setView({
    //     name: data.name,
    //     uniqKey: Date.now(),
    //   });
    // });
  }

  const getViewComponent = (view: string, uniqKey: number) => {
    if (view == "BetView") {
      return <PlayerBetView key={uniqKey} playerId={playerId} />
    }
    if (view == "PlayerCreateEpisodeView")  {
      console.log("here")
      return <PlayerCreateEpisodeView key={uniqKey} playerId={playerId} />
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
