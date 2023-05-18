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
    type: [],
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

  textoNoticiaHtml: {
    type: String
  },

  imagemCompleta: {
    type: String
  },

  fonte: {
    type: String
  }
})


module.exports = Noticia;