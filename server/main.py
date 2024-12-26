from datetime import datetime
import os
import threading
import time
import kaggle
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import schedule

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, confusion_matrix, ConfusionMatrixDisplay
import joblib

app = Flask(__name__)
cors = CORS(app, origins='*')

kaggle.api.authenticate()
kaggle.api.dataset_download_files('octopusteam/full-imdb-dataset', path=".", unzip=True)
file_path = 'data.csv'


def run_schedule():
    print("Запуск планировщика задач...")
    while True:
        schedule.run_pending()
        time.sleep(10)


def job():
    global file_path
    kaggle.api.authenticate()
    kaggle.api.dataset_download_files('octopusteam/full-imdb-dataset', path=".", unzip=True)
    file_path = 'data.csv'


schedule.every().minute.at(":01").do(job)


model_file = 'movie_rating_model.pkl'


def train_model():
    data = pd.read_csv('data.csv')

    X = data[['releaseYear', 'genres', 'numVotes']]
    y = data['averageRating']

    print("Форма X:", X.shape)
    print("Форма y:", y.shape)

    preprocessor = ColumnTransformer(
        transformers=[
            ('genre', OneHotEncoder(), 'genres')
        ],
        remainder='passthrough'
    )
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor())
    ])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    joblib.dump(model, model_file)


def predict_movie_rating(year, genre, voteRange):
    min_votes, max_votes = map(int, voteRange.split('-'))
    data = pd.read_csv('data.csv')

    # Фильтрация данных по году
    filtered_data = data[data['releaseYear'] == int(year)]

    # Фильтрация данных по жанру
    filtered_data = filtered_data[filtered_data['genres'].str.contains(genre, case=False, na=False)]

    # Фильтрация данных по количеству оценок
    filtered_data = filtered_data[(filtered_data['numVotes'] >= min_votes) & (filtered_data['numVotes'] <= max_votes)]

    if not filtered_data.empty:
        # Рассчет средней оценки для отфильтрованных данных
        average_rating = filtered_data['averageRating'].mean()

        # Рассчет погрешности
        rating_std = filtered_data['averageRating'].std()  # Стандартное отклонение
        predictions = filtered_data['averageRating'].values  # Получаем реальные оценки
        mae = mean_absolute_error(predictions, [average_rating] * len(predictions))  # Абсолютная погрешность

        return {
            'averageRating': round(average_rating, 2),
            'errorMargin': round(rating_std, 2),
            'mae': round(mae, 2)
        }

    historical_data = data[data['releaseYear'] < int(year)]
    historical_data = historical_data[historical_data['genres'].str.contains(genre, case=False, na=False)]
    historical_data = historical_data[(historical_data['numVotes'] >= min_votes) & (historical_data['numVotes'] <= max_votes)]

    if not historical_data.empty:
        average_rating = historical_data['averageRating'].mean()
        rating_std = historical_data['averageRating'].std()  # Стандартное отклонение
        predictions = historical_data['averageRating'].values  # Получаем реальные оценки
        mae = mean_absolute_error(predictions, [average_rating] * len(predictions))  # Абсолютная погрешность

        return {
            'averageRating': round(average_rating, 2),
            'errorMargin': round(rating_std, 2),
            'mae': round(mae, 2)
        }
    return None



@app.route('/', methods=['GET'])
def index():
    return send_from_directory(os.getcwd(), 'index.html')


@app.route('/data', methods=['GET'])
def get_data():
    data = pd.read_csv(file_path)
    count = len(data)

    return jsonify({'countall': count})
    # return jsonify(data.head(5000).to_dict(orient='records'))


@app.route('/filtered_data', methods=['GET'])
def get_filtered_data():
    data = pd.read_csv(file_path)

    filtered_data = data.dropna(subset=['genres', 'averageRating', 'numVotes'])

    count = len(filtered_data)

    return jsonify({'count:': count})


@app.route('/top_rated_by_genre', methods=['GET'])
def get_top_rated_by_genre():
    data = pd.read_csv(file_path)

    filtered_data = data.dropna(subset=['genres', 'averageRating', 'numVotes'])

    filtered_data = filtered_data[filtered_data['numVotes'] > 500]

    genres_expanded = filtered_data.assign(genres=filtered_data['genres'].str.split(',')).explode('genres')

    genres_expanded['genres'] = genres_expanded['genres'].str.strip()

    sorted_data = genres_expanded.sort_values(by='averageRating', ascending=False)

    top_rated_by_genre = sorted_data.groupby('genres').head(9)

    result = {}
    for genre in top_rated_by_genre['genres'].unique():
        films = top_rated_by_genre[top_rated_by_genre['genres'] == genre]

        films_grouped = films.groupby('title').agg({
            'averageRating': 'first',
            'numVotes': 'first',
            'id': 'first',
            'genres': lambda x: list(set(x))
        }).reset_index()

        films_grouped = films_grouped.sort_values(by='averageRating', ascending=False)
        if genre not in result:
            result[genre] = []

        for _, row in films_grouped.iterrows():
            result[genre].append({
                'id': row['id'],
                'title': row['title'],
                'averageRating': row['averageRating'],
                'numVotes': row['numVotes'],
                'genres': list(genres_expanded[genres_expanded['title'] == row['title']]['genres'].unique())
            })

    return jsonify(result)


@app.route('/average_rating_per_year', methods=['GET'])
def average_rating_per_year():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['releaseYear', 'averageRating'])

    data['releaseYear'] = pd.to_numeric(data['releaseYear'], errors='coerce')

    current_year = datetime.now().year

    data = data[data['releaseYear'] <= current_year]

    result = data.groupby('releaseYear')['averageRating'].mean().reset_index()
    result['averageRating'] = result['averageRating'].round(2)

    return jsonify(result.to_dict(orient='records'))


@app.route('/genre_distribution', methods=['GET'])
def genre_distribution():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['genres'])

    genres_expanded = data.assign(genres=data['genres'].str.split(',')).explode('genres')
    genres_expanded['genres'] = genres_expanded['genres'].str.strip()

    genre_counts = genres_expanded['genres'].value_counts().reset_index()
    genre_counts.columns = ['genre', 'count']

    total_count = genre_counts['count'].sum()
    genre_counts['percentage'] = (genre_counts['count'] / total_count * 100).round(2)

    return jsonify(genre_counts.to_dict(orient='records'))


@app.route('/votes_per_year', methods=['GET'])
def get_votes_per_year():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['releaseYear', 'numVotes'])

    data['releaseYear'] = pd.to_numeric(data['releaseYear'], errors='coerce')

    result = data.groupby('releaseYear')['numVotes'].sum().reset_index()
    result.columns = ['year', 'totalVotes']

    return jsonify(result.to_dict(orient='records'))


@app.route('/rating_distribution', methods=['GET'])
def rating_distribution():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['averageRating'])

    bins = [0, 2, 4, 6, 8, 10]
    labels = ['0-2', '2-4', '4-6', '6-8', '8-10']

    data['rating_range'] = pd.cut(data['averageRating'], bins=bins, labels=labels, right=False)

    distribution = data['rating_range'].value_counts().sort_index()

    result = distribution.reset_index()
    result.columns = ['rating_range', 'count']

    return jsonify(result.to_dict(orient='records'))


@app.route('/votes_rating_correlation', methods=['GET'])
def votes_rating_correlation():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['averageRating', 'numVotes'])

    limited_data = data.sample(n=500, random_state=1)

    correlation_data = limited_data[['numVotes', 'averageRating']]

    correlation_coefficient = correlation_data['numVotes'].corr(correlation_data['averageRating'])

    result = {
        'correlation_coefficient': correlation_coefficient,
        'data': correlation_data.to_dict(orient='records')
    }

    return jsonify(result)


@app.route('/average_rating_by_genre', methods=['GET'])
def average_rating_by_genre():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['genres', 'averageRating'])

    genres_expanded = data.assign(genres=data['genres'].str.split(',')).explode('genres')
    genres_expanded['genres'] = genres_expanded['genres'].str.strip()

    average_ratings = genres_expanded.groupby('genres')['averageRating'].mean().reset_index()
    average_ratings['averageRating'] = average_ratings['averageRating'].round(2)

    return jsonify(average_ratings.to_dict(orient='records'))


@app.route('/movies_per_year', methods=['GET'])
def movies_per_year():
    data = pd.read_csv(file_path)

    data = data.dropna(subset=['releaseYear'])

    data['releaseYear'] = pd.to_numeric(data['releaseYear'], errors='coerce')

    result = data.groupby('releaseYear').size().reset_index(name='count')

    return jsonify(result.to_dict(orient='records'))


@app.route('/top_20_movies', methods=['GET'])
def get_top_20_movies():
    data = pd.read_csv(file_path)

    filtered_data = data.dropna(subset=['title', 'averageRating', 'numVotes'])

    filtered_data = filtered_data[filtered_data['numVotes'] >= 500]

    top_20_movies = filtered_data.sort_values(by='averageRating', ascending=False).head(20)

    result = top_20_movies[['title', 'averageRating', 'genres']].to_dict(orient='records')

    return jsonify(result)


@app.route('/data_missing', methods=['GET'])
def data_missing():
    data = pd.read_csv(file_path)

    total_count = len(data)

    missing_data_count = data.isnull().any(axis=1).sum()
    complete_count = total_count - missing_data_count

    missing_percentage = (missing_data_count / total_count) * 100 if total_count > 0 else 0
    complete_percentage = (complete_count / total_count) * 100 if total_count > 0 else 0

    result = {
        'total_count': int(total_count),
        'data': [
            {
                'status': 'Complete Data',
                'count': int(complete_count),
                'percentage': round(complete_percentage, 2)
            },
            {
                'status': 'Missing Data',
                'count': int(missing_data_count),
                'percentage': round(missing_percentage, 2)
            }
        ]
    }

    return jsonify(result)


@app.route('/predict_rating', methods=['POST'])
def predict_rating():
    data = request.get_json()
    year = data['year']
    genre = data['genre']
    voteRange = data['voteRange']

    result = predict_movie_rating(year, genre, voteRange)

    if result is None:
        return jsonify({'error': 'Нет данных для прогнозирования'}), 404

    return jsonify(result)


@app.route('/get_movies_by_local_genres', methods=['POST'])
def get_movies_by_local_genres():
    data = pd.read_csv(file_path)
    genres = request.json.get('genres', [])

    if not genres:
        return jsonify({'error': 'No genres provided'}), 400

    filtered_data = data.dropna(subset=['genres', 'averageRating', 'numVotes'])
    filtered_data = filtered_data[filtered_data['numVotes'] > 500]

    genres_expanded = filtered_data.assign(genres=filtered_data['genres'].str.split(',')).explode('genres')
    genres_expanded['genres'] = genres_expanded['genres'].str.strip()

    filtered_by_genres = genres_expanded[genres_expanded['genres'].isin(genres)]

    if filtered_by_genres.empty:
        return jsonify({'error': 'No movies found for the given genres'}), 404

    random_movies = filtered_by_genres.sample(n=20, random_state=1)

    movies = random_movies[['id', 'title', 'averageRating', 'numVotes', 'genres']].to_dict(orient='records')

    for movie in movies:
        movie['genres'] = movie['genres'].split(', ')

    return jsonify(movies)


if __name__ == '__main__':
    threading.Thread(target=run_schedule).start()
    app.run(debug=True)
