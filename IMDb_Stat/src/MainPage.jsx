import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'

const MainPage = () => {
  const [date, setDate] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [voteRange, setVoteRange] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [errorMargin, setErrorMargin] = useState(null); 
  const [mae, setMae] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const genres = ['Action','Adventure','Animation','Biography', 'Comedy','Crime','Documentary', 'Drama','Family','Fantasy','Film-Noir','Game-Show','History', 'Horror','Music','Musical', 'Romance','Mystery','News','Reality-TV', 'Sci-Fi','Romance','Short','Sport','Talk-Show', 'Thriller','War','Western', 'Adult'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 106 }, (v, i) => currentYear - 100 + i).reverse();
  
  useEffect(() => {
    const fetchRecommendedMovies = async () => {
      const userGenres = JSON.parse(localStorage.getItem('userGenres')) || [];

      if (userGenres.length > 0) {
        try {
        
          const response = await axios.post("http://127.0.0.1:5000/get_movies_by_local_genres", {
            genres: userGenres
          });
          setRecommendedMovies(response.data); 
        } catch (error) {
          console.error("Ошибка при загрузке рекомендованных фильмов:", error);
        }
      }
      setLoading(false);
    };

    fetchRecommendedMovies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://127.0.0.1:5000/predict_rating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ year, genre, voteRange }),
    });
    const data = await response.json();
    setPrediction(data.averageRating);
    setErrorMargin(data.errorMargin);
    setMae(data.mae);
  };

  const openIMDb = (movieId, genres) => {
    const existingGenres = JSON.parse(localStorage.getItem('userGenres')) || [];
  
    const updatedGenres = Array.from(new Set([...existingGenres, ...genres]));
  
    if (updatedGenres.length > 5) {
      updatedGenres.shift(); 
    }
    localStorage.setItem('userGenres', JSON.stringify(updatedGenres));

    const url = `https://www.imdb.com/title/${movieId}/`; 
    window.open(url, "_blank"); 
  };

  return (
    <div>
      <h1>Главная страница</h1>
      <form onSubmit={handleSubmit} 
      style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        borderRadius: '5px', 
        display: 'flex', 
        flexDirection: 'column', 
        width: '300px', 
        margin: '0 auto'
      }}>
        <select value={year} onChange={(e) => setYear(e.target.value)} required>
          <option value="">Выберите год</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={genre} onChange={(e) => setGenre(e.target.value)} required>
          <option value="">Выберите жанр</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={voteRange} onChange={(e) => setVoteRange(e.target.value)} required>
          <option value="">Выберите интервал оценок</option>
          <option value="0-100">0 - 100</option>
          <option value="101-500">101 - 500</option>
          <option value="501-1000">501 - 1000</option>
          <option value="1001-5000">1001 - 5000</option>
          <option value="5001-10000">5001 - 10000</option>
        </select>
        <button type="submit">Прогнозировать</button>
      </form>
      {prediction && (
        <div>
          <h2>Результаты прогнозирования</h2>
          <p>Средняя оценка: {prediction}</p>
          <p>Погрешность: {errorMargin}</p>
          <p>Абсолютная погрешность: {mae}</p>
        </div>
        
      )}
      <h1>Рекомендованные фильмы</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="row">
  {recommendedMovies.slice(0, 20).map((movie) => (
    <div className="col-md-4" key={movie.id}>
      <div className="cards">
        <div className="card-block">
          <h4 className="card-title">{movie.title}</h4>
          <p className="card-text">{movie.numVotes} votes</p>
        </div>
        <div className="card-footer">
          <p className="cart-price">{movie.averageRating}</p>
          <button className="btn btn-primary add-to-cart" onClick={() => openIMDb(movie.id, movie.genres)}>
            <span className="fa fa-eye"></span>
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
      )}
    </div>
  );
};

export default MainPage;

