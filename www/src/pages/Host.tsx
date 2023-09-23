import React, { useState, useEffect, useCallback } from 'react';

interface IPlayer {
  name: string;
  score: bigint;
}

interface IState {
  players: Array<string>;
}

const Host = () => {
  const [state, setState] = useState<IState>({players: []});

  const updateState = useCallback(async () => {
    const response = await fetch('/api/getgame');
    const data = await response.json();
    const playerData: Array<IPlayer> = data?.players || [];
    const players = playerData.map(p => p.name);

    setState({players});
  }, []);

  useEffect(() => {
    setInterval(updateState, 1000);
  }, [updateState]);

  const playerList = state.players.map((player, i) => <li key={i}>{player}</li>);

  return (
    <div className="App">
    {playerList}
    </div>
  );
}

export default Host;
