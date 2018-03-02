'use strict';

const uuid = require('uuid');
const mongoose = require('mongoose');

//Schema for blogposts
const blogpostsSchema = mongoose.Schema({
      title: {type: String, required: true},
      content: {type: String, required: true},
      author: {
          firstName: {type: String, required: true},
          lastName: {type: String, required: true}
      },
      created: {type: Date, default: Date.now}
});

blogpostsSchema.virtual('authorName').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`;
});

//instance method for blogpostsSchema to get only some fields
blogpostsSchema.methods.serialize  = function(){
  return {
    id: this.id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.created
  };
};

const Blogpost = mongoose.model('Blogpost', blogpostsSchema);
module.exports = {Blogpost};
