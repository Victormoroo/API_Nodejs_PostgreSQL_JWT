const express = require("express");
const { pool } = require("./data/data");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.listen(8080, () =>{
  console.log("O servidor esta ativo!");
});

app.get("/", async (req, res) => {
  res.send('<h1>Home Page!</h1>')
});
