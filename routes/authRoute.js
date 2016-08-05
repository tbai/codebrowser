var db = require("../models/db")
  , url = require("url")
  , passport = require("passport")
  , crypto = require("crypto")
  , nodemailer = require("nodemailer")
  , ejs = require("ejs")
  , path = require("path")
  , fs = require("fs")
  , config = require("../config")
  , mongoose = require('mongoose');



/* Login */
exports.loginForm = function (req, res) {

  var locals = { template: 'loginForm' };
  var error = req.flash("error");
  if (error && error != "") {
    locals.formError = { "email": error };
    locals.formAttributes = { "email": req.flash("email") };
  }
  res.render('auth/auth', locals);

};



exports.logout = function (req, res) {

  req.logout();
  res.redirect('/');

};

