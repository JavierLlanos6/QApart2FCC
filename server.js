"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { ObjectID } = require("mongodb");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

// Configuración del motor de plantillas
app.set("view engine", "pug");
app.set("views", "./views/pug");

// Middlewares generales
fccTesting(app);
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesión
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// CONEXIÓN A LA BASE DE DATOS Y SERIALIZACIÓN
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");

  // SERIALIZACIÓN Y DESERIALIZACIÓN
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(err, doc);
    });
  });

  // RUTA PRINCIPAL
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to Database",
      message: "Please login",
    });
  });
}).catch((e) => {
  // SI FALLA LA CONEXIÓN
  app.route("/").get((req, res) => {
    res.render("index", {
      title: e,
      message: "Unable to connect to database",
    });
  });
});

// LISTEN FUERA DE myDB
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
