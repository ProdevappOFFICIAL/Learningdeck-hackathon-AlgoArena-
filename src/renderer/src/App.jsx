import React from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Splash from './pages/splash'
import Home from './pages/home'
import Dash from './pages/dash'
import Login from './pages/login'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dash" element={<Dash />} />
      </Routes>
    </HashRouter>
  )
}

export default App
