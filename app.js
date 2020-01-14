require('dotenv').config();
const express = require('express')
const app = express();
const PORT = process.env.PORT;
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const Twit = require('twit');
const config = require('./twitter-config');
const googleApiKey = process.env.maps_api
const Twitter = new Twit(config);

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (request, response)=>{
    Twitter.get('statuses/user_timeline',{ screen_name: 'phivolcs_dost',  tweet_mode: 'extended', count: 200,  exclude_replies: true, include_rts: false},(error ,data, res)=>{
        filteredData = data.filter((tweet)=>{
            if (tweet.full_text.includes("EarthquakePH")){
                tweet.earthquake_details = {}
                tweet.earthquake_details.location =  tweet.full_text.match(/\d{2,}.\d{2,}N, \d{2,}.\d{2,}E/g)[0]
                tweet.earthquake_details.datetime = tweet.full_text.match(/\d{2} \w{3} \d{4} - \d{2}:\d{2} \w{2}/g)[0]
                tweet.earthquake_details.strength = tweet.full_text.match(/Magnitude = \d{1,}.\d{1,}/g)[0].match(/\d{1,}.\d{1,}/g)[0]
                tweet.earthquake_details.depth = tweet.full_text.match(/\d{3,} kilometers/g)[0]
                return tweet.full_text.includes("EarthquakePH");
            }
        });
        response.render('index', {data: filteredData});
    });
});


app.listen(PORT, ()=>{
    console.log(`Listening to port ${PORT}`)
})