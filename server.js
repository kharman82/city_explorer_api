'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 3001;


app.listen(PORT,() => console.log(`Listening on port ${PORT}`));

// Getting a location 

app.get('/location', (request, response) => {

    // try{    
        let city = request.query.city;
        let key = process.env.GEOCODE_API_KEY;
        const url = (`https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`);
        //notes
        superagent.get(url)
            .then(locationResponse => {
                const data = locationResponse.body;
                for (var i in data) {
                    if (data[i].display_name.search(city)) {
                        const display = new City(city,data[i]);
                        response.send(display);
                    }
                }
            })

        // building new city base on data from url then respnd with new city based on url
        .catch(error =>{
            handleError(error, request, respnse);
        });
        // response.status(200).send();
    // }
});

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
            });
            response.send(result);
        }).catch(error => handleError(error, request, response));
    
});

app.get('/trails', (request, response) => {
    const { latitude, longitude } = request.query;
    const key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}`;
  
        superagent.get(url)
            .then(weatherResponse => {
                const data = weatherResponse.body.data;
                const result = [];
                data.forEach(item => {
                  result.push(new WeatherData(item.datetime, item.weather.description));
            });
            response.send(result);
        }).catch(error => handleError(error, request, response));
    
});




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


app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));
