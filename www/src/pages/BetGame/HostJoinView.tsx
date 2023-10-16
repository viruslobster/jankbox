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
    <div>
      HostJoinView yo
      {playerList}
    </div>
  );
}

export default HostJoinView;
