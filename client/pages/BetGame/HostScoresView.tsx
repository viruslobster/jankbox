import { useState, useEffect } from 'react';

interface HostScoresViewProps {
  eventSource: EventSource,
}

const HostScoresView = ({ eventSource }: HostScoresViewProps) => {
  const [scores, setScores] = useState({});

  useEffect(() => {
    const getScores = async () => {
      const response = await fetch("/api/player/scores");
      const scores = await response.json();
      setScores(scores);
    };
    getScores();
  }, []);

  const scoresList = Object
    .entries(scores)
    .map(([player, score], i) => <li key={i}>{`${player}: ${score}`}</li>);

  return (
    <div>
      HostScoresView
      {scoresList}
    </div>
  );
}

export default HostScoresView;
