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

app.get('/location', (request, response) => {

    // try{    
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
app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

dbClient.connect()
  .then(() => {
    app.listen(PORT,() => console.log(`Listening on port ${PORT}`));
    
}).catch(err => {
   console.log('Sorry not connected', err);
   response.status(500).send(err);
})

