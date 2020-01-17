require('dotenv').config();
const Twit = require('twit');
const config = require('./twitter-config');
const Twitter = new Twit(config);
const mongojs = require('mongojs')
const db = mongojs(process.env.mongo_uri,['earthquakes']);
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({
    provider: 'locationiq',
    apiKey: process.env.location_iq_key
})


Twitter.get('statuses/user_timeline',{ screen_name: 'phivolcs_dost',  tweet_mode: 'extended', count: 100,  exclude_replies: true, include_rts: false},async function (error ,tweets, res){
    for(let index = 0; index < tweets.length; index++){
        if (tweets[index].full_text.includes("EarthquakePH")){
            await sleep(1500);
            let earthquakeDetails = {};
            earthquakeDetails.id_str =  tweets[index].id_str
            earthquakeDetails.full_text = tweets[index].full_text;
            earthquakeDetails.earthquake_details = {};
            earthquakeDetails.earthquake_details.location =  tweets[index].full_text.match(/\d{2,}.\d{2,}N, \d{2,}.\d{2,}E/g)[0];
            earthquakeDetails.earthquake_details.lat = parseFloat(earthquakeDetails.earthquake_details.location.split(',')[0].split('N')[0]);
            earthquakeDetails.earthquake_details.lon = parseFloat(earthquakeDetails.earthquake_details.location.split(',')[1].split('E')[0]);
            earthquakeDetails.earthquake_details.datetime = tweets[index].full_text.match(/\d{2} \w{3} \d{4} - \d{2}:\d{2} \w{2}/g)[0];
            earthquakeDetails.earthquake_details.strength = parseFloat(tweets[index].full_text.match(/Magnitude = \d{1,}.\d{1,}/g)[0].match(/\d{1,}.\d{1,}/g)[0]);
            earthquakeDetails.earthquake_details.depth = parseInt(tweets[index].full_text.match(/\d{3} kilometer/g)[0].split(' ')[0]);
            earthquakeDetails.tweeted_at = tweets[index].created_at
            earthquakeDetails.happened_at = new Date(earthquakeDetails.earthquake_details.datetime.split('-')[0])
            db.earthquakes.find({id_str: earthquakeDetails.id_str}, async function(err, docs){
                    if (docs == 0){
                        geocoder.reverse({lat: earthquakeDetails.earthquake_details.lat, lon: earthquakeDetails.earthquake_details.lon}, async function(err, res){
                            if (res){
                                earthquakeDetails.province = res[0].state;    
                            }
                            console.log(index);
                            console.dir(earthquakeDetails);
                            db.earthquakes.insert(earthquakeDetails);
                        }) 
                    }
            })
        }
    }
});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

setTimeout(() => {
    process.exit()
}, 160000);
