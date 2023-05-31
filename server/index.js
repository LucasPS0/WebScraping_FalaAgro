require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express();
const cors = require('cors');


//configurando leitura json
app.use(
  express.urlencoded({
    extended: true,
  }),     
)
app.use(express.json())
app.use(cors());

//rotas da api
const rotasNoticia = require('./routes/rotasNoticia')

app.use('/noticia', rotasNoticia)


//configurando porta e conexão com o banco de dados

//mongodb+srv://igor:8kLkRS49PZ6ycfiv@cluster0.otazhn5.mongodb.net/?retryWrites=true&w=majority
//mongodb://localhost:27017/Noticia
const dbUser= process.env.DB_USER
const dbPassword = process.env.DB_PASS 
const dbLink = process.env.DB_LINK

mongoose.connect(dbLink, { 
      useNewUrlParser: true,
      dbName: 'noticia',
      useUnifiedTopology: true,
    })
    .then((result) => {
      console.log("conexão feita!");
      app.listen(3000)
    })
    .catch((error) => {
      console.log("Erro ao conectar" + error);
    });