'use strict'

const mongoose = require( 'mongoose' )

const Noticia = mongoose.model('Noticia', {
  titulo: {
    type: String,
    
  },
  resumo: {
    type: String,
   
  },
 link: {
    type: String,
    
  },
  textoNoticia: {
    type: String,
  },
  dataPublicacao: {
    type: String,
  },
  legendaimagemPrincipal: {
    type: String,
  },
  fonteimagemPrincipal: {
    type: String,
  },
  autor: {
    type: String,
  },

})


module.exports = Noticia;