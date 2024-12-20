import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css'
import axios from 'axios'
import Statistic from './Statistic'
import GenresTop from './GenreTop';
import MainPage from './MainPage';

function App() {
  const [count, setCount] = useState(0)
  const [array, setArray] = useState([]);


  return (
    <Router>
      <nav className="navbar">
        <ul className="nav-links">
          <li>
            <Link to="/">Главная</Link>
          </li>
          <li>
            <Link to="/topfilms">Топовые фильмы</Link>
          </li>
          <li>
            <Link to="/stat">Статистика</Link>
          </li>
        </ul>
      </nav>

      <Routes>
      <Route path="/" element={<MainPage />} />
        <Route path="/topfilms" exact element={<GenresTop/>} />
        <Route path="/stat" element={<Statistic />} />
      </Routes>
    </Router>
  )
}

export default App
