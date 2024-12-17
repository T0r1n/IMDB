import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(0)
  const [array, setArray] = useState([]);
  const [loading, setLoading] = useState(true); // Состояние загрузки

  const top_rated_by_genre = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/top_rated_by_genre");
      console.log(response.data);
      setArray(response.data); // Устанавливаем состояние array
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false); // Устанавливаем состояние загрузки в false после завершения
    }
  };

  useEffect(() => {
    top_rated_by_genre();
    //setArray(response.data);
  },[]);

  const openIMDb = (movieId) => {
    const url = `https://www.imdb.com/title/${movieId}/`; 
    window.open(url, "_blank"); 
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

      <div className="container">
      <h1>Top Action Film's</h1>
      <div className="row">
        {
            array['Action'] && array['Action'].map((item, index) => (
                <div className="col-md-4" key={index}>
                    <div className="cards">
                        <div className="card-block">
                            <h4 className="card-title">{item.title}</h4>
                            <p className="card-text">{item.numVotes} votes</p>
                        </div>
                        <div className="card-footer">
                            <p className="cart-price">{item.averageRating}</p>
                            <button className="btn btn-primary add-to-cart" onClick={() => openIMDb(item.id)}>
                                <span className="fa fa-eye"></span>
                            </button>
                        </div>
                    </div>
                </div>
            ))
        }
    </div>
    </div>
            </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
