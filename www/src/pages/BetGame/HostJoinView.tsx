import { useState, useEffect } from 'react';

interface HostJoinViewProps {
  eventSource: EventSource | null,
}

const HostJoinView = ({ eventSource }: HostJoinViewProps) => {
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    if (eventSource == null) {
      return;
    }
    const onPlayersChanged = (event) => {
      console.log("Event: PlayersChanged");

      const data = JSON.parse(event.data);
      setPlayers(data.players);
    };
    eventSource.addEventListener("PlayersChanged", onPlayersChanged);

    return () => {
      eventSource.removeEventListener("PlayersChanged", onPlayersChanged);
    };
  }, [eventSource]);

  const playerList = players.map((player, i) => <li key={i}>{player}</li>);
  return (
    <header className='App-header'>
    <div>
      HostJoinView
      {playerList}
    </div>
    <div>
      <form method="POST" onSubmit={handleSubmit}>
        <label>
          Episode Idea: <input name="prompt" />
        </label>
        <button type="submit">Enter</button>
      </form>
    </div>
    </header>
  );
}

export default HostJoinView;
