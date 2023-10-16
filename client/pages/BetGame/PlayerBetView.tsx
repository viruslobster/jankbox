import { useNavigate } from 'react-router-dom';
import '../../App.css';
import { useRef, useState } from 'react';

interface PlayerBetViewProps {
  playerId: number,
}

const PlayerBetView = ({ playerId }: PlayerBetViewProps) => {
  const navigate = useNavigate();

  const betAmountRef = useRef(null);
  const [placedBet, setPlacedBet] = useState(null);

  const handleClick = async () => {
    const bet = parseInt(betAmountRef.current.value, 10);

    await fetch("/api/player/bet", {
      method: "POST",
      body: JSON.stringify({ playerId, bet }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
    });
    setPlacedBet(bet);
  };

  console.log(`placed bet: ${placedBet}`);
  if (placedBet == null) {
    return (
      <div className="App">
        <header className="App-header">
          <label>
            Place Bet: <input ref={betAmountRef} />
          </label>
          <button onClick={handleClick}>Enter</button>
        </header>
      </div>
    );
  }
  return (
    <div className="App">
      <header className="App-header">
        Bet: {placedBet}
      </header>
    </div>
  );
};

export default PlayerBetView;
