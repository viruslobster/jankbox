import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import User from './pages/User';
import './App.css';
import Host from './pages/Host';
import PlayerBetView from './pages/PlayerBetView';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<User />} />
        <Route path="/host" element={<Host />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
