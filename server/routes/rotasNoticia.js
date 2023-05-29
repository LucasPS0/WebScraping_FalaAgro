const router = require('express').Router()

const Noticia = require('../model/Noticia')

//CheckToken
function CheckToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
      return res.status(401).json({ error: 'Token inválido' })
    }
}

//rotas / endpoint 

//LEITURA
router.get("/", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  try {
    const noticias = await Noticia.find();
    res.status(200).json(noticias);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

//LEITURA DO RESUMO DA NOTICIA
router.get("/resumo", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const skip = page * limit;

  try {
    const noticias = await Noticia.find({}, 'titulo imagemCompleta resumo dataPublicacao _id fonte').sort({ dataPublicacao: -1 })
                                   .skip(skip)
                                   .limit(limit);

    const noticiasJSON = noticias.map(noticia => ({
      _id: noticia.id,
      titulo: noticia.titulo,
      imagemCompleta: noticia.imagemCompleta,
      resumo: noticia.resumo,
      fonte: noticia.fonte
    }));

    res.status(200).json(noticiasJSON);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Pesquisa de notícias por termos de pesquisa
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.term; // Obtém o termo de pesquisa dos parâmetros da consulta

    // Realiza a consulta no banco de dados MongoDB para encontrar notícias correspondentes ao termo de pesquisa
    const noticias = await Noticia.find({
      $or: [
        { titulo: { $regex: searchTerm, $options: "i" } }, // Pesquisa por título (ignorando maiúsculas e minúsculas)
        { resumo: { $regex: searchTerm, $options: "i" } } // Pesquisa por resumo (ignorando maiúsculas e minúsculas)
      ]
    });

    res.status(200).json(noticias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



//LEITURA POR ID
router.get('/:id', async(req, res) => {

  const id = req.params.id

  try {
    
    const noticia = await Noticia.findOne({_id: id})

    if(!noticia){
      res.status(422).json({error: "A noticia nao foi encontrada"})
      return
    }

    res.status(200).json(noticia)
    return

  } catch (error) {
    res.status(500).json({error: error})
  }
})

//CRIANDO DADOS

router.post('/', async(req, res) =>{

  const {titulo,
    resumo,
    link,
    textoNoticia,
    dataPublicacao,
    legendaimagemPrincipal,
    autor,
    imagemCompleta,
    fonteimagemCompleta} = req.body

  if(!titulo){
    res.status(422).json({error: 'Campos obrigatorios!'})
  }

  const noticia = {
    titulo,
    resumo,
    link,
    textoNoticia,
    dataPublicacao,
    legendaimagemPrincipal,
    autor,
    imagemCompleta,
    fonteimagemCompleta
  }

  try {
    await Noticia.create(noticia);
    res.status(201).json({message: 'noticia inserida com sucesso'})
  } catch (error) {
    res.status(500).json({error: error});
  }
})  

//ATUALIZAR 
router.put('/:id', async(req, res) => {
  const id = req.params.id

  const {titulo,
    resumo,
    link,
    textoNoticia,
    dataPublicacao,
    legendaimagemPrincipal,
    autor,
    imagemCompleta,
    fonteimagemCompleta} = req.body

  const noticia = {
    titulo,
    resumo,
    link,
    textoNoticia,
    dataPublicacao,
    legendaimagemPrincipal,
    autor,
    imagemCompleta,
    fonteimagemCompleta
  }

  try {
    
    const updateNoticia = await Noticia.updateOne({_id: id}, noticia)

    if(updateNoticia.matchedCount === 0){
      res.status(422).json({error: "A noticia nao foi encontrada"})
      return
    }

    res.status(200).json(noticia)


  } catch (error) {
    res.status(500).json({error: error})
  }
})

//DELETE
router.delete('/:id', async (req, res) => {
  const id = req.params.id

  const noticia = await Noticia.findOne({_id: id})

  if(!noticia){
    res.status(422).json({error: "A noticia nao foi encontrada"})
    return
  }

  try {
    
    await Noticia.deleteOne({_id: id})
    res.status(200).json({message: "usuario removido com sucesso"}) 

  } catch (error) {
    res.status(500).json({error: error})
  }
})

module.exports = router;