import { useState, useEffect} from 'react';

interface IState {
  players: Array<string>;
}

const Host = () => {
  const [state, setState] = useState<IState>({ players: [] });

  useEffect(() => {
    console.log("use effect");
    const es = new EventSource("/api/connect/host");
    es.onerror = (err) => {
      console.log("onerror", err);
    };

    es.onopen = (...args) => {
      console.log("onopen", args);
    };

    es.addEventListener("PlayersChanged", (event) => {
      console.log("Event: PlayersChanged");

      const players = JSON.parse(event.data);
      setState(players);
    });

    return () => { es.close() };
  }, []);

  const playerList = state.players.map((player, i) => <li key={i}>{player}</li>);

  return (
    <div className="App">
      {playerList}
    </div>
  );
}

export default Host;
