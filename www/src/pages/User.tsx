import React from 'react';
import '../App.css';

const User = () => {
  function handleSubmit(e) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target;
    const formData = new FormData(form);
    
    // You can pass formData as a fetch body directly:
    const formJson = Object.fromEntries(formData.entries());
    console.log(formJson);
    fetch("/api/addplayer", {
      method: form.method,
      body: new URLSearchParams(formData as any),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    }).then((data) => {
      // Handle the response from the server
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
    // Or you can work with it as a plain object:

  }
  return (
    <div className="App">
      <header className="App-header">
      <form method="POST" onSubmit={handleSubmit}>
      <label>
        User: <input name="userName" />
      </label>
      <button type="submit">Enter</button>
      </form>
      </header>
    </div>
  );
}

export default User;
