const express = require('express');
const mongoose = require('mongoose');
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
mongoose.connect("mongodb://127.0.0.1/noticia", {
      useNewUrlParser: true,

      useUnifiedTopology: true,
    })
    .then((result) => {
      console.log("conexão feita!");
      app.listen(3000)
    })
    .catch((error) => {
      console.log("Erro ao conectar" + error);
    });