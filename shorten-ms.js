var express = require("express")
var mongo = require("mongodb").MongoClient

var app = express()
var urls;
mongo.connect(process.env.MONGO_URI, (err, db) => {
    urls = db.collection("urls")
})

function giveMeShorts() {
    // hope this works  -- todo: test this with mocha and chai.js
    var unique = false;
    var generatedURL;
    while (unique == false) {
        var whitelistedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("")
        generatedURL = []
        for (let i = 0; i < 6; i++) {
            var char = whitelistedChars[Math.floor(Math.random() * whitelistedChars.length)]
            generatedURL.push(char)
        }
        urls.find({short_url: generatedURL.join("")})
            .toArray((err, url) => {
                if (url[0] == undefined) {
                    unique = true
                }
            })
    }
    return generatedURL.join("")
}

app.get("/api/shorturl/:short", (req, res) => {
    console.log("/" + req.param.short + " requested.")
    /* search db and redirect else 404 */
    urls.find({short: req.params.short})
        .toArray((err, url) => {
            if (url[0] != undefined) {
                res.redirect(url[0].original_url)
            } else {
                res.status(404).send("This url does not exist.")
            }
        })

})

app.post("/api/shorturl/new", (req, res) => {
    console.log("/new/" + req.param.url + "requested.")
    /* search db for duplicates then add or not and return the json */
    urls.find({original: req.params.url})
        .toArray((err, url) =>  {
            if (url[0] == undefined) {
                var urlModel = {short_url: giveMeShorts(), original_url: req.params.url}
                urls.insertOne(urlModel, (err, data) => {
                    if (err) raise: err
                })
            }
        })
})

app.listen(5000, () => console.log("Microservice running on port 5000"))