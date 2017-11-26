var express = require("express")
var mongo = require("mongodb").MongoClient

var app = express()
var urls;
mongo.connect("mongodb://localhost:27017/short-ms", (err, db) => {
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
        urls.findOnce({short_url: generatedURL.join("")})
            .toArray((err, url) => {
                if (url[0] == undefined) {
                    unique = true
                }
            })
    }
    return generatedURL.join("")
}

app.get("/:short", (req, res) => {
    /* search db and redirect else 404 */
    urls.findOnce({short: req.params.short})
        .toArray((err, url) => {
            if (url[0] != undefined) {
                res.redirect(url[0].original_url)
            } else {
                res.status(404).send("This url does not exist.")
            }
        })

})

app.get("/new/:url", (req, res) => {
    /* search db for duplicates then add or not and return the json */
    urls.findOnce({original: req.params.url})
        .toArray((err, url) =>  {
            if (url[0] == undefined) {
                urls.insertOnce({short_url: giveMeShorts(), original_url: req.params.url}) // left off here
            }
        })

})