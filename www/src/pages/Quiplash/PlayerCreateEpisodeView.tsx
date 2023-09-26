import { useNavigate } from 'react-router-dom';
import '../../App.css';
import { useRef, useState } from 'react';
interface PlayerCreateEpisodeViewProps {
  playerId: number,
}

const PlayerCreateEpisodeView = ({ playerId }: PlayerCreateEpisodeViewProps) => {
  const handleSubmit = async (e) => {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target;
    const formData = new FormData(form);
    formData.append("playerId",' ' + playerId)

    const formJson = Object.fromEntries(formData.entries());
    console.log(formJson);
    let response = await fetch("/quiplash/player/episodeCreateAddPrompt", {
        method: "POST",
        body: JSON.stringify(formJson),
        headers: {
          "Content-Type": "application/json"
        },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  }
  return (
    <header className="App-header">
      <form method="POST" onSubmit={handleSubmit}>
        <label>
          Episode Idea: <input name="prompt" />
        </label>
        <button type="submit">Enter</button>
      </form>
    </header>
  );

}
export default PlayerCreateEpisodeView;
