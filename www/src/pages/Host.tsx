import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import HostBetView from './BetGame/HostBetView';
import HostJoinView from './BetGame//HostJoinView';
import HostScoresView from './BetGame/HostScoresView';

interface IState {
  players: Array<string>;
}
interface CurrentGameProps {
  gmaeName: string,
}
const Host = ({ gameName }: CurrentGameProps) => {
  const navigate = useNavigate();
  const [eventSource, setEventSource] = useState(null);
  const [view, setView] = useState({
    name: "HostJoinView",
    uniqKey: 1,
  });

  useEffect(() => {
    console.log("use effect");
    const es = new EventSource("/api/connect/host");
    es.onerror = (err) => {
      console.log("onerror", err);
    };

    es.onopen = (...args) => {
      console.log("onopen", args);
    };

    es.addEventListener("SetView", (event) => {
      console.log("Event: SetView");

      const data = JSON.parse(event.data);
      console.log(data);
      setView({
        name: data.name,
        uniqKey: Date.now(),
      });
    });

    setEventSource(es);

    return () => { es.close() };
  }, []);


  const getViewComponent = (view: string, uniqKey: number) => {
    if (view == "HostBetView") {
        return <HostBetView key={uniqKey} eventSource={eventSource} />
    } else if (view == "HostScoresView") {
        return <HostScoresView key={uniqKey} eventSource={eventSource} />
    } else if (view == "CreateEpisodeView") {
        // return <HostCreateEpisodeView key={uniqKey} eventSource={eventSource} />
    }
    return <HostJoinView key={uniqKey} eventSource={eventSource} />
  };

  return (
    <div className="App">
      {getViewComponent(view.name, view.uniqKey)}
    </div>
  );
}

export default Host;
