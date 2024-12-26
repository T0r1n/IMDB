import React, { useEffect, useState } from 'react';
import CustomChart from './Widgets/CustomChart';
import axios from 'axios';

const Statistic = () => {
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [voteData, setVoteData] = useState([]);
  const [ratingDistributionData, setRatingDistributionData] = useState([]);
  const [RatingData, setRatingData] = useState([]);
  const [movieYearData, setmovieYearData] = useState([]);
  const [missingData, setmissingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [correlationData, setCorrelationData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true); 
      const lineResponse = await axios.get("http://127.0.0.1:5000/average_rating_per_year"); // Получаем данные о среднем рейтинге фильмов
      setLineData(lineResponse.data);

      const barResponse = await axios.get("http://127.0.0.1:5000/genre_distribution"); // Получаем данные о количестве фильмов
      setBarData(barResponse.data);

      const voteResponse = await axios.get("http://127.0.0.1:5000/votes_per_year"); // Получаем данные о голосах
      setVoteData(voteResponse.data);

      const ratingResponse = await axios.get("http://127.0.0.1:5000/rating_distribution"); // Получаем данные о распределении рейтингов
      setRatingDistributionData(ratingResponse.data);

      const RatingResponse = await axios.get("http://127.0.0.1:5000/average_rating_by_genre"); // Получаем данные о ср.рейтинге по жанрам 
      setRatingData(RatingResponse.data);

      const MoveYearResponse = await axios.get("http://127.0.0.1:5000/movies_per_year"); // Получаем данные о количестве выпусков в году
      setmovieYearData(MoveYearResponse.data);

      const MissingResponse = await axios.get("http://127.0.0.1:5000/data_missing"); // Получаем данные о пропусках
      setmissingData(MissingResponse.data.data);

      const correlationResponse = await axios.get("http://127.0.0.1:5000/votes_rating_correlation"); // Получаем данные о корреляции
    setCorrelationData(correlationResponse.data.data);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <p>Загрузка данных...</p>; 
  }


  return (
    <div>
      <h1>Статистика</h1>
      <CustomChart 
        data={lineData} 
        dataKey="averageRating" 
        xAxisKey="releaseYear" 
        title="Средний рейтинг фильмов по годам" 
        chartType="line" 
      />
      {barData && barData.length > 0 ? (
        <CustomChart 
          data={barData} 
          dataKey="count"
          xAxisKey="genre"
          title="Количество фильмов по жанрам" 
          chartType="bar" 
          fontSize={1}
        />
      ) : (
        <p>No data available for the bar chart</p>
      )}
      {voteData && voteData.length > 0 ? (
        <CustomChart 
          data={voteData} 
          dataKey="totalVotes"
          xAxisKey="year" 
          title="Количество голосов по годам" 
          chartType="line" 
        />
      ) : (
        <p>No data available for the votes line chart</p>
      )}
      {ratingDistributionData && ratingDistributionData.length > 0 ? (
        <CustomChart 
          data={ratingDistributionData} 
          dataKey="count"
          xAxisKey="rating_range"
          title="Распределение фильмов по рейтингам" 
          chartType="bar"
          customFrontSize = {15}
        />
      ) : (
        <p>No data available for the rating distribution chart</p>
      )}
      {RatingData && RatingData.length > 0 ? (
        <CustomChart 
          data={RatingData} 
          dataKey="averageRating"
          xAxisKey="genres"
          title="Средний рейтинг фильмов по жанрам" 
          chartType="bar"
        />
      ) : (
        <p>No data available for the bar chart</p>
      )}
      {movieYearData && movieYearData.length > 0 ? (
        <CustomChart 
          data={movieYearData} 
          dataKey="count"
          xAxisKey="releaseYear"
          title="Количество фильмов, выпущенных в каждом году" 
          chartType="bar"
          customInterval = {4}
        />
      ) : (
        <p>No data available for the bar chart</p>
      )}
      {missingData && missingData.length > 0 ? (
        <CustomChart 
          data={missingData} 
          dataKey="percentage"
          xAxisKey="status"
          title="Процент фильмов с отсутствующими данными" 
          chartType="pie"
        />
      ) : (
        <p>No data available for the pie chart</p>
      )}
        {correlationData && correlationData.length > 0 ? (
    <CustomChart 
      data={correlationData} 
      dataKey="averageRating"
      xAxisKey="numVotes"
      title="Корреляция между количеством голосов и средним рейтингом" 
      chartType="scatter" 
    />
  ) : (
    <p>No data available for the correlation scatter chart</p>
  )}
    </div>
  );
};

export default Statistic;