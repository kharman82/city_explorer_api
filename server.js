'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const dbClient = new pg.Client(process.env.DATABASE_URL);
const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 3001;



// Getting a location 
app.get('/movies', handleMovies);
app.get('/yelp', handleYelp);

app.get('/location', (request, response) => {   
        let city = request.query.city;
        let key = process.env.GEOCODE_API_KEY;
        const url = (`https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`);
        console.log('city', city)
        let sql = 'SELECT * FROM locations WHERE search_query =$1;';
        let safeValues = [city];

        dbClient.query(sql, safeValues)
            .then(locationResponse => {
                if (locationResponse.rows[0]) {
                    response.send(locationResponse.rows[0]);
                } else {
                    superagent.get(url)
                        .then(locationResponse => {
                            const data = locationResponse.body[0];
                            let location = new City(city, data);
                            response.status(200).send(location);

                            const insertSQL = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
                            const searchValues = [city, location.formatted_query, location.latitude, location.longitude];
                            dbClient.query(insertSQL, searchValues);

                        }).catch(error => {
                            handleError(error, request, response);  
                        })
                    }
            })

        // building new city base on data from url then respnd with new city based on url
})

// weather location 
app.get('/weather', (request, response) => {
    const { latitude, longitude } = request.query;
    const key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}`;
  
        superagent.get(url)
            .then(weatherResponse => {
                const data = weatherResponse.body.data;
                const result = [];
                data.forEach(item => {
                  result.push(new WeatherData(item.datetime, item.weather.description));
            })
            response.send(result);
        }).catch(error => {
            handleError(error, request, response);
        })
    
})

app.get('/trails', (request, response) => {
    const {latitude, longitude} = request.query;
    const key = process.env.TRAIL_API_KEY;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${key}`;
  
        superagent.get(url)
            .then(trailResponse => {
                const data = trailResponse.body.trails;
                response.send(data.map(element => new Trails(element)))
               
                }).catch(error => {
                    handleError(error, request, response);
                })
})

function handleMovies (request, response){
    const city = request.query.search_query;
    const key = process.env.MOVIE_API_KEY;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;

    superagent.get(url)
    .then(movieResponse => {
      const data = movieResponse.body.results;
      response.send(data.map(element => {
        return new Movie(element);
        }));
    }).catch(error => handleError(error, request, response));
}

function handleYelp (request, response) {
    const city = request.query.city;
    const url = `http://api.yelp.com/v3/businesses/search?location=${city}&term=restaurants`;
  
    superagent.get(url)
      .set({
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      })
      .then(businessResponse => {
        const data = businessResponse.body.businesses;
        response.send(data.map(element => {
          return new Business(element);
        }));
      }).catch(error => handleError(error, request, response));
  }
  
           

// constructor function 

function City(city, locationData) {
this.search_query = city;
this.formatted_query = locationData.display_name;
this.latitude = locationData.lat;
this.longitude = locationData.lon;
}

function WeatherData(day, forecast) {
    this.forecast = forecast;   
    this.time = new Date(day).toDateString();
}

function handleError(error, request, response, next){
    response.status(500).send({status:500,responseText: 'sorry something went wrong'});
}

function Trails(trail) {
    this.name = trail.name;
    this.location = trail.location;
    this.length = trail.length;
    this.stars = trail.stars;
    this.star_votes = trail.starVotes;
    this.summary = trail.summary;
    this.trail_url = trail.url;
    this.conditions = trail.conditions;
    this.condition_date = trail.conditionDate;
    this.condition_time = trail.conditionTime;
  }
    //constructor function for Movie
function Movie (movie) {
    this.title = movie.title;
    this.overview = movie.overview;
    this.average_votes = movie.average_votes;
    this.total_votes = movie.total_votes;
    this.image_url = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    this.popularity = movie.popularity;
    this.released_on = movie.released_on;
  }
  
  //constructor function for YELP
function Business (data) {
    this.name = data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
  }
   
app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

dbClient.connect()
  .then(() => {
    app.listen(PORT,() => console.log(`Listening on port ${PORT}`));
    
}).catch(err => {
   console.log('Sorry not connected', err);
   response.status(500).send(err);
})

