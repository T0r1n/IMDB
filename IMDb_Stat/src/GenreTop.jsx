import React, { useState, useEffect } from 'react';
import axios from 'axios'

const GenresTopPage = () => {
  const [count, setCount] = useState(0)
  const [array, setArray] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const excludedGenres = ['Adult'];

  const top_rated_by_genre = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/top_rated_by_genre");
      console.log(response.data);
      setArray(response.data); 
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    top_rated_by_genre();
  },[]);

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
      <h1>IMDb Statistic</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        Object.keys(array).map((genre) => {
          if (excludedGenres.includes(genre)) {
            return null; 
          }
          return (
            <div className="container" key={genre}>
              <h2>Top {genre} Films</h2>
              <div className="row">
                {array[genre].map((item, index) => (
                  <div className="col-md-4" key={index}>
                    <div className="cards">
                      <div className="card-block">
                        <h4 className="card-title">{item.title}</h4>
                        <p className="card-text">{item.numVotes} votes</p>
                      </div>
                      <div className="card-footer">
                        <p className="cart-price">{item.averageRating}</p>
                        <button className="btn btn-primary add-to-cart" onClick={() => openIMDb(item.id, item.genres)}>
                          <span className="fa fa-eye"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default GenresTopPage;