import os
import kaggle 
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
cors = CORS(app,origins='*')

kaggle.api.authenticate()
kaggle.api.dataset_download_files('octopusteam/full-imdb-dataset', path=".",unzip=True)
file_path = 'data.csv'

@app.route('/', methods=['GET'])
def index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/data', methods=['GET'])
def get_data():
    data = pd.read_csv(file_path)
    count = len(data)
    
    return jsonify({'countall': count})
    #return jsonify(data.head(5000).to_dict(orient='records'))

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
            'id':'first',
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

@app.route('/top_20_movies', methods=['GET'])
def get_top_20_movies():
    data = pd.read_csv(file_path)
    
    filtered_data = data.dropna(subset=['title', 'averageRating', 'numVotes'])
    
    filtered_data = filtered_data[filtered_data['numVotes'] >= 500]
    
    top_20_movies = filtered_data.sort_values(by='averageRating', ascending=False).head(20)
    
    result = top_20_movies[['title', 'averageRating', 'genres']].to_dict(orient='records')
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)