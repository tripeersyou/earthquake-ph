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
                response.render('index', {data: docs, route: '/', page_limit: page_limit, page: page});    
            })
        } else {
            let page_size = parseInt(process.env.page_count)
            db.earthquakes.find().sort({tweeted_at : -1}).limit(page_size , function(err, docs){
                response.render('index', {data: docs, route: '/', page_limit: page_limit, page: 1});
            })
        }
    });
});

app.get('/quake-map', (request, response) =>{
    db.earthquakes.distinct("province",{},function(err, docs){
        if (Object.entries(request.query).length > 0){
            let filter = [];
            let query = {}
            if(request.query.daterange && request.query.daterange != ''){
                filter.push({"happened_at": {
                    $gte: new Date(request.query.daterange.split('-')[0]),
                    $lte: new Date(request.query.daterange.split('-')[1])
                }});
            }
            if(request.query.earthquake_details != undefined && request.query.earthquake_details.strength != ''){
                filter.push({ "earthquake_details.strength": { $gte: parseFloat(request.query.earthquake_details.strength)}})
            }

            if(request.query.earthquake_details != undefined && request.query.earthquake_details.depth != ''){
                filter.push({ "earthquake_details.depth": { $gte: parseInt(request.query.earthquake_details.depth)}})
            }

            if(request.query.provinces && request.query.provinces != ''){
                filter.push({ "province" : { $in: request.query.provinces } })
            }

            if (filter.length == 1){
                query = filter[0];
            } else if (filter.length > 1) {
                query = {$and: []}
                for(let i = 0; i < filter.length; i++ ){
                    query.$and.push(filter[i]);
                }
            }
            if(Object.entries(request.query).length === 1 && request.query.fbclid){
                db.earthquakes.find().sort({tweeted_at :-1}).limit(10 , function(error, quakes){
                    response.render('quake-map', {provinces: docs, route:'/quake-map', data: quakes, filtered: false});
                });
            } else {
                db.earthquakes.find(query, function(error, quakes){
                    response.render('quake-map', {provinces: docs, route:'/quake-map', data: quakes, filtered: true});
                });
            }
        } else {
            db.earthquakes.find().sort({tweeted_at :-1}).limit(10 , function(error, quakes){
                response.render('quake-map', {provinces: docs, route:'/quake-map', data: quakes, filtered: false});
            });
        }
    });
});

app.get('/covid-19', (request, response)=>{
    let date = new Date();
    let yesterday = `${date.getMonth()}-${parseInt(date.getDay())-1}-${date.getFullYear()}`
    response.render('covid-19', {route: '/covid-19', filtered: false, datate: yesterday})
})
app.get('/about', (request, response) =>{
    response.render('about', {route: '/about'});
});

app.get('/quake/:id', (request, response)=>{
    db.earthquakes.findOne({id_str: request.params.id}, function(err,doc){
        if(doc){
            Twitter.get('statuses/oembed', {url: `https://twitter.com/phivolcs_dost/status/${doc.id_str}`, align: 'center', width: 550},(err, res, next)=>{
                response.render('show',{earthquake: doc, maps_api: googleApiKey, tweet_embed: res.html, route: '/quake/'});
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
