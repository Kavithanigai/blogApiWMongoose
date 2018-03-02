'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

//Use es6 promises with mongoose
mongoose.Promise = global.Promise;

//Port and db url from config.js and blogposts from models.js
const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./models');

//use express and bodyParser
const app = express();
app.use(bodyParser.json());

//Get all blogposts
app.get('/posts', (req,res) =>{
  Blogpost
  .find()
  .then(blogposts => {
      res.json(
        blogposts.map(blogpost => blogpost.serialize()));
   })
    .catch(err =>{
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
  });

 //Get one blogpost by particular id
  app.get('/posts/:id', (req,res) =>{
    Blogpost.findById(req.params.id)
    .then(blogpost => {
      res.json(blogpost.serialize())
    })
     .catch(err => {
       console.error(err);
       res.status(500).json({message: 'Internal Server Error'});
     });
   });

 //To make new blogposts
 app.post('/posts', (req,res) => {
   const reqFields = ['title', 'content', 'author'];
   for(let i=0; i<reqFields.length; i++)
   {
     const fld = reqFields[i];
     if(!(fld in req.body)){
       console.error(`Missing ${fld} in request body`);
       return res.status(400).send(`Missing ${fld} in request body`);
     }
   }

   Blogpost.create({
     title: req.body.title,
     content: req.body.content,
     author: req.body.author,
     created: req.body.created
   })
   .then(blogpost => res.status(201).json(blogpost.serialize()))
   .catch(err =>{
     console.error(err);
     res.status(500).json({message: 'Internal Server Error'});
   });
 });

//to update a blogpost with id
app.put('/posts/:id', (req,res) =>{
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    return res.status(400).json({ message: message });
  }
  // we can update title, author or content
  const toUpdate = {};
  const updatableFields = ['title', 'content', 'author'];

    updatableFields.forEach(field =>{
      if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
    });

  //to update blogposts keeping everything the same except only the changes
  //initiated
  Blogpost.findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(updatedpost => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
 });

// to delete a blogpost
app.delete('/posts/:id', (req,res) =>{
  Blogpost.findByIdAndRemove(req.params.id)
  .then(blogpost => res.status(204).end())
  .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});

//server object to run and close server
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
