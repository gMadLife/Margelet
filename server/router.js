const UsersModel = require("./models/users.model");
const UploadsModel = require("./models/uploads.model");
const _ = require("lodash");
const config = require("./config");
const bcrypt = require("bcrypt");
const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const contentDisposition = require('content-disposition')

function checkAuth(req, res, next) {
  passport.authenticate(
    "jwt",
    { session: false },
    (err, decryptToken, jwtError) => {
      if (jwtError != void 0 || err != void 0) {
        return res.render("index.html", { error: err || jwtError });
      }
      req.user = decryptToken;
      next();
    }
  )(req, res, next);
}

function createToken(body) {
  return jwt.sign(body, config.jwt.secretOrKey, {
    expiresIn: config.expiresIn
  });
}



module.exports = app => {
  app.use("/assets", express.static("./client/public"));
  
  app.use(bodyParser.json());
  app.use(methodOverride('_method'));

  const conn = mongoose.createConnection(config.mongo.url, config.mongo.options);

  let gfs;

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

  // POST /upload
  // Uploads file to DB
  app.post('/upload', upload.single('file'), (req, res) => {
    //res.json({file: req.file});
    res.redirect('/');
  });

  // GET /files
  // Display all files in JSON
  app.get('/files', (req, res) => {
   gfs.files.find().toArray((err, files) => {
     // Check if files
      if (!files || files.length === 0) {
       return res.status(404).json({
          err: 'No files exist'
        });
      }
      return res.json(files);
    });
  });

  // GET /files/:filename
  // Display single file object
  app.get('/files/:filename', (req, res) => {
   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
     // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
         err: 'No file exists'
        });
      }
     // File exists
     return res.json(file);
    });
  });

  app.get('/uploads/:filename', (req, res) => {
    UploadsModel.findById(req.params.filename, (err, file) => {
      if (!file) {
        return res.status(404).json({
          err: "No file exists",
        });
      }

      console.log("##########" + contentDisposition(file.filename));

      res.writeHead(200, {
        'Content-Type': "application/octet-stream",
        'Content-disposition': contentDisposition(file.filename),
        'Content-Length': file.data.length
      });
      //res.send(Buffer.from(file.data, 'binary'));
      res.write(file.data,'binary');
      res.end(null, 'binary');
    });
  });

  // GET /image/:filename
  // Display Image
  app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
    
      // Check if image
      if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
       res.status(404).json({
         err: 'Not an image'
        });
     }
   });
  });

  app.get("/", checkAuth, (req, res) => {
    gfs.files.find().toArray((err, files) => {
      //Check if files
      if (!files || files.length === 0) {
        res.render("index.html", { username: req.user.username, files: false });
      } else {
        files.map(file => {
          if(file.contentType ==='image/jpeg' || file.contentType === 'image/png') {
            file.isImage = true;
          } else {
            file.isImage = false;
        }
      });
      res.render("index.html", { username: req.user.username, files: files });
      }
    });
  });


  app.post("/login", async (req, res) => {
    try {
      let user = await UsersModel.findOne({
        username: { $regex: _.escapeRegExp(req.body.username), $options: "i" }
      })
        .lean()
        .exec();
      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        const token = createToken({ id: user._id, username: user.username });
        res.cookie("token", token, {
          httpOnly: true
        });

        res.status(200).send({ message: "User login success." });
      } else
        res
          .status(400)
          .send({ message: "User not exist or password not correct" });
    } catch (e) {
      console.error("E, login,", e);
      res.status(500).send({ message: "some error" });
    }
  });

  app.post("/register", async (req, res) => {
    try {
      let user = await UsersModel.findOne({
        username: { $regex: _.escapeRegExp(req.body.username), $options: "i" }
      })
        .lean()
        .exec();
      if (user) {
        return res.status(400).send({ message: "User already exist" });
      }

      user = await UsersModel.create({
        username: req.body.username,
        password: req.body.password
      });

      const token = createToken({ id: user._id, username: user.username });

      res.cookie("token", token, {
        httpOnly: true
      });

      res.status(200).send({ message: "User created." });
    } catch (e) {
      console.error("E, register,", e);
      res.status(500).send({ message: "some error" });
    }
  });

  app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(200).send({ message: "Logout success." });
  });

};