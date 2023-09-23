import React from 'react';
import { Routes, Route } from 'react-router-dom';
import User from './pages/User';
// import Host from './pages/User';
import './App.css';

const App = () => {
  return (
     <>
        <Routes>
           <Route path="/" element={<User />} />
           {/* <Route path="/host" element={<Host />} /> */}
        </Routes>
     </>
  );
 };

export default App;
