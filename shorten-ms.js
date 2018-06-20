const express = require("express");
const app = express();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;

const URLMapSchema = new Schema({
  short: {
      type: String,
      required: true,
      unique: true
  },
  url: {
    type: String,
    required: true,
  }
});

const URLMap = mongoose.model('URLMap', URLMapSchema);

function giveMeShorts() {
  let unique = false;
  let generatedURL = new Array(6);

  while (unique == false) {
    const whitelistedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("")
    for (urlChar of generatedURL) {
      urlChar = whitelistedChars[Math.floor(Math.random() * whitelistedChars.length)]
    }
    URLMap.findOne({short: generatedURL.join("")}, (err, data) => {
      if (err) console.log(err);
      if (!data) unique = true;
    });
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