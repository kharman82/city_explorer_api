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

    try{    
        let city = request.query.city;
        let key = process.env.GEOCODE_API_KEY;
        const url = (`https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`);
        //notes
        let superagent = url
        // building new city base on data from url then respnd with new city based on url

        response.status(200).send();
    }
});

// weather location 
app.get('/weather', (request, response) => {
    let weatherData = require('./data/darksky.json');

    let weatherResult = weatherData.data.map(day => {
        return new WeatherData(day);
    }); 
    response.status(200).send(weatherResult);
});



// constructor function 
function City(city, locationData) {
this.search_query = city;
this.formatted_query = locationData[0].display_name;
this.latitude = locationData[0].lat;
this.longitude = locationData[0].lon;
}

function WeatherData(day) {
    this.forecast = day.weather.description;   
    this.time = day.datetime;
}


app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));
