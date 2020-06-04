global.Promise = require("bluebird");
const PORT = process.env.PORT || 7777;

const express = require("express");
const app = express();
const nunjucks = require("nunjucks");
const server = require("http").Server(app);
const io = require("socket.io")(server, { serveClient: true });
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const config = require("./config");
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const passport = require("passport");
const { Strategy } = require("passport-jwt");

const { jwt } = require("./config");

passport.use(
  new Strategy(jwt, function(jwt_payload, done) {
    if (jwt_payload != void 0) {
      return done(false, jwt_payload);
    }
    done();
  })
);

mongoose.connect(config.mongo.url, config.mongo.options);
mongoose.set("debug", process.env.NODE_ENV !== "production");
mongoose.connection.on("error", e => {
  console.error("MongoDB connection error", e);
  process.exit(0);
});

nunjucks.configure("./client/views", {
  autoescape: true,
  express: app
});

app.use(bodyParser.json());
app.use(methodOverride('_method'));
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

app.use(cookieParser());

let gfs;
const conn = mongoose.createConnection(config.mongo.url, config.mongo.options);
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
})

const storage = new GridFsStorage({
  url: 'mongodb://localhost:27017/Margelet',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  //res.json({file: req.file});
  res.redirect('/');
});

app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }
    return res.json(files);
  });
});

app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}).toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }
    return res.json(files);
  });
});

require("./router")(app);

require("./sockets")(io);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});
