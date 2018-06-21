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
  let unique = false;
  
  while (unique == false) {
    const whitelist = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    let slug = [];
    [...Array(6)].forEach((x) => {
      slug.push(whitelist[Math.floor(Math.random() * whitelist.length)]);
    });
/* Callback never called when no match found. What is happening?
    URLMap.findOne({shorturl: slug.join("")}, (err, data) => {
      console.log("asdf")
      if (err) console.error(err);
      console.log(data)
      console.log(!data)
      unique = true;
      return slug.join("")
    });
*/
    unique = true;
    console.log(slug.join(""));
    return slug.join("");
  }
}

app.get("/api/shorturl/:short", (req, res) => {
  // Poor man's testing: curl http://localhost:5000/api/shorturl/3Nqa6u
  console.log("/api/shorturl/" + req.params.short + " requested.")
  URLMap.findOne({shorturl: req.params.short}, (err, data) => {
    if (err) console.error(err);
    if (data) {
      return res.redirect("http://"+data.website);
    } else {
      return res.status(404).send(req.params.short + " does not exist in the system.");
    }
  });
})

app.post("/api/shorturl/new", urlencodedParser, (req, res) => {
  // Poor man's testing: curl --data "website=example.com" http://localhost:5000/api/shorturl/new
  let urlMap = new URLMap({website: req.body.website, shorturl: getUniqueSlug()});
  urlMap.save((err, data) => {
    if (err) console.error(err);
    return res.json({"website": data.website, "shorturl": data.shorturl});
  });
});

app.listen(5000, () => console.log("Microservice running on port 5000"))

module.exports = app