require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on('error', (e) => console.error('MongoDB error: %s', e));
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});

const URLMapSchema = new Schema({
  website: {
    type: String,
    required: true,
  },
  shorturl: {
      type: String,
      required: true,
      unique: true
  }
});

let URLMap = mongoose.model('URLMap', URLMapSchema);

function getUniqueSlug() {
    const whitelist = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    let slug = [];
    [...Array(6)].forEach((x) => {
      slug.push(whitelist[Math.floor(Math.random() * whitelist.length)]);
    });

    URLMap.findOne({"shorturl": slug.join("")}).exec().then(
      (data) => {
        if (!data) return slug.join("");
        else return getUniqueSlug()
      },
      (err) => {if (err) console.error(err);});
};

function isValidUrl(url) {
  // Strip trailing slash (/)
  if (url.match(/\/$/)) {
    url = url.slice(0, -1);
  }
     // begins with the http protocol 
  if (url.match(/^https?:\/\//) &&
      // contains no whitespace
      !url.match(/\s/) &&
      // contains at least 1 period
      url.match(/\./) &&
      // contains no double quotes
      !url.match(/\"/)
  ) {
    return true
  } else {
    return false
  }
}

app.get("/api/shorturl/:short", (req, res) => {
  // Poor man's testing: curl http://localhost:5000/api/shorturl/3Nqa6u
  console.log("/api/shorturl/" + req.params.short + " requested.")
  URLMap.findOne({shorturl: req.params.short}, (err, data) => {
    if (err) console.error(err);
    if (data) {
      return res.redirect(data.website);
    } else {
      return res.status(404).send(req.params.short + " does not exist in the system.");
    }
  });
})

app.post("/api/shorturl/new", urlencodedParser, (req, res) => {
  // Poor man's testing: curl --data "website=example.com" http://localhost:5000/api/shorturl/new
  if (isValidUrl(req.body.website)) {
    let urlMap = new URLMap({website: req.body.website, shorturl: getUniqueSlug()});
    urlMap.save((err, data) => {
      if (err) console.error(err);
      return res.json({"website": data.website, "shorturl": data.shorturl});
    });
  } else return res.json({"error": "invalid URL"});
});

app.listen(5000, () => console.log("Microservice running on port 5000"))

module.exports = app