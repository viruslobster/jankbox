import '../App.css';

interface AddPlayerViewProps {
  onPlayerAdd: (id: number) => void;
}

const AddPlayerView = ({ onPlayerAdd }: AddPlayerViewProps) => {
  const handleSubmit = async (e) => {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target;
    const formData = new FormData(form);

    const formJson = Object.fromEntries(formData.entries());
    console.log(formJson);
    let response = await fetch("/api/addplayer", {
      method: form.method,
      body: new URLSearchParams(formData as any),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const playerId = await response.json();
    console.log(`Player added as id ${playerId}`);
    onPlayerAdd(Number(playerId));
  };

  return (
    <header className="App-header">
      <form method="POST" onSubmit={handleSubmit}>
        <label>
          User: <input name="userName" />
        </label>
        <button type="submit">Enter</button>
      </form>
    </header>
  );
};

export default AddPlayerView;
