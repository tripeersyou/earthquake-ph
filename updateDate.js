require('dotenv').config();
const mongojs = require('mongojs')
const db = mongojs(process.env.mongo_uri,['earthquakes']);


db.earthquakes.find(function(err, docs){
    console.log(docs.length)
    for(let i = 0;  i < docs.length; i++){
        if (docs[i].happened_at === undefined) {
            docs[i].happened_at = new Date(docs[i].earthquake_details.datetime.split('-')[0])
            console.log(docs[i], i)
        }
        db.earthquakes.replaceOne({id_str: docs[i].id_str}, docs[i],(err,result)=>{
            if (err){
                console.log(err);
            }
        });
    }
})