import { useState, useEffect} from 'react';

interface HostBetViewProps {
  eventSource: EventSource,
}

const HostBetView = ({eventSource}: HostBetViewProps) => {
  return (
    <div>
      HostBetView
      Players are placing bets
    </div>
  );
}

export default HostBetView;
