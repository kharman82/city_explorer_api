'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 3001;


app.listen(PORT,() => console.log(`Listening on port ${PORT}`));

// Getting a location 

app.get('/location', (request, response) => {

    let locationData = require('./data/geo.json');
    let city = request.query.city;
    //constructor logic
    let formattedObj = new City(city, locationData);
    
    response.status(200).send(formattedObj);
});

// weather location 
app.get('/weather', (request, response) => {
    let weatherData = require.query.city;
    let city = request.query.city;
    let formattedObj = new weatherData(city, weatherData);
})

// constructor function 
function City(city, locationData) {
this.search_query = city;
this.formatted_query = locationData[0].display_name;
this.latitude = locationData[0].lat;
this.longitude = locationData[0].lon;
}






app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));
