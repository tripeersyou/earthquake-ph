require('dotenv').config();
const express = require('express')
const app = express();
const PORT = process.env.PORT;
const bodyParser = require('body-parser');
const path = require('path');

const Twit = require('twit');
const config = require('./twitter-config');
const Twitter = new Twit(config);

const googleApiKey = process.env.maps_api
const mongojs = require('mongojs')
const db = mongojs(process.env.mongo_uri,['earthquakes']);

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (request, response)=>{
    let page = request.query.page
    db.earthquakes.count(function(error,result){
        let page_limit = Math.ceil(result/parseInt(process.env.page_count));
        if (page){
            let page_size = parseInt(process.env.page_count)
            let offset = (parseInt(page) - 1) * page_size;
            db.earthquakes.find().sort({tweeted_at: -1}).limit(page_size).skip(offset, function(err, docs){
                response.render('index', {data: docs, route: request.originalUrl, page_limit: page_limit, page: page});    
            })
        } else {
            let page_size = parseInt(process.env.page_count)
            db.earthquakes.find().sort({tweeted_at: -1}).limit(page_size , function(err, docs){
                response.render('index', {data: docs, route: request.originalUrl, page_limit: page_limit, page: 1});
            })
        }
    });
});

app.get('/quake-map', (request, response) =>{
    db.earthquakes.find().sort({tweeted_at: -1}).limit(50 , function(err, docs){
        response.render('quake-map', {data: docs, route: request.originalUrl});
    })
});

app.get('/about', (request, response) =>{
    response.render('about', {route: request.originalUrl});
});

app.get('/quake/:id', (request, response)=>{
    db.earthquakes.findOne({id_str: request.params.id}, function(err,doc){
        if(doc){
            Twitter.get('statuses/oembed', {url: `https://twitter.com/phivolcs_dost/status/${doc.id_str}`, align: 'center', width: 550},(err, res, next)=>{
                response.render('show',{earthquake: doc, maps_api: googleApiKey, tweet_embed: res.html, route: request.originalUrl});
            });
        } else {
            response.redirect('/');
        }
    })
});

app.get('*', (request, response)=>{
    response.render("404",{route: request.originalUrl});
})


app.listen(PORT, ()=>{
    console.log(`Listening to port ${PORT}`)
})