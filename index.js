const express = require('express');
const Joi = require('joi');
const app = express();
const router = express.Router();

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// !! All letters
const Apha = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", "z", 'x', 'c', 'v', "b", "n", "m", 'Q', "W", "E", 'R', "T", "Y", "U", "I", "O", "P", "A", "S", "D", 'F', "G", "H", 'J', "K", "L", 'Z', "X", "C", "V", "B", "N", "M"];
// !! Base url
const BASE_URL = "http://localhost:3000/";

// !! Temporary data
const db = {
    totalUrlCount: 0,
    totalVisitCount: 0,
    urls: []
}
// !! Urls count for unique id
let urlsCount = 0


// !! Generate random extension (returns shortened link)
const generateRandomUrl = () => {
    let randomStrings = ""
    for (let i = 0; i < 6; i++) {
        const item = Apha[Math.floor(Math.random() * Apha.length)];
        randomStrings += item;
    }
    return BASE_URL + randomStrings;
}

//  !! Get data
app.get("/api/urls", (req, res) => {
    res.status(200).send(db)
})

// !! Go to shortened url (redirect)
app.get("/:code", async (req, res) => {
    const findedUrl = await db.urls.find(url => url.shortenedUrl.replace(BASE_URL, "") === req.params.code)
    if (!findedUrl) return res.status(404).json("No Url found!");
    const indexOfValue = db.urls.indexOf(findedUrl)
    db.urls[indexOfValue] = {
        ...findedUrl,
        visitCount: findedUrl.visitCount + 1
    }
    db.totalVisitCount += 1
    res.redirect(findedUrl.mainUrl);
})

// !! Shorten url
app.post("/api/shorten", async (req, res) => {
    const schema = Joi.object({
        url: Joi.string().uri().required()
    })
    const { error } = schema.validate(req.body);
    if (error) return res.status(404).send(error);
    const requestUrl = req.body.url;
    const hasUrl = !!(await db.urls.find(url => url.mainUrl === requestUrl));
    if (hasUrl) return res.status(400).json("This url have already shortened!");
    const generatedUrl = generateRandomUrl();
    const newShortenedUrl = {
        id: urlsCount + 1,
        mainUrl: requestUrl,
        shortenedUrl: generatedUrl,
        visitCount: 0
    };
    urlsCount++
    db.urls.push(newShortenedUrl)
    db.totalUrlCount = db.urls.length;
    res.status(200).send(db)
})

// !! Delete shortened url with id
app.delete("/api/delete/:urlId", async (req, res) => {
    if (!req.params.urlId) return res.status(400).json("Url id is required!");
    const findedUrl = await db.urls.find(url => url.id === parseInt(req.params.urlId))
    if (!findedUrl) return res.status(404).json(`The link with id ${req.params.urlId} was not found!`);
    db.totalVisitCount -= findedUrl.visitCount;
    db.urls = await db.urls.filter(url => url.id !== findedUrl.id);
    db.totalUrlCount -= 1;
    res.status(200).send(db)
})

// !! Port
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Listening on port ${port} ...`))