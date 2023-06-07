const router = require('express').Router();
const Noticia = require('../model/Noticia');
const diacriticSensitiveRegex = require('diacritic-sensitive-regex');


// Middleware para verificar o token
function CheckToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Executa o próximo middleware ou rota
  next();
}

// Rota de leitura de todas as notícias
router.get("/", async (req, res) => {
  // Configuração dos cabeçalhos de controle de acesso
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  try {
    // Busca todas as notícias no banco de dados
    const noticias = await Noticia.find();

    // Retorna as notícias encontradas como resposta
    res.status(200).json(noticias);
    console.log(noticias);
  } catch (error) {
    // Retorna um erro caso ocorra um problema na busca
    res.status(500).json({ error: error });
  }
});

// Rota de leitura do resumo das notícias com paginação
router.get("/resumo", async (req, res) => {
  // Configuração dos cabeçalhos de controle de acesso
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const skip = page * limit;

  try {
    // Realiza a consulta das notícias no banco de dados com projeção e ordenação
    const noticias = await Noticia.find({}, 'titulo imagemCompleta resumo dataPublicacao _id fonte')
      .sort({ dataPublicacao: -1 })
      .skip(skip)
      .limit(limit);

    // Formata as notícias retornadas com as propriedades desejadas
    const noticiasJSON = noticias.map(noticia => ({
      _id: noticia.id,
      titulo: noticia.titulo,
      imagemCompleta: noticia.imagemCompleta,
      resumo: noticia.resumo,
      fonte: noticia.fonte
    }));

    // Retorna as notícias formatadas como resposta
    res.status(200).json(noticiasJSON);
  } catch (error) {
    // Retorna um erro caso ocorra um problema na busca
    res.status(500).json({ error: error });
  }
});

// Rota de pesquisa de notícias por termo
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.term; // Obtém o termo de pesquisa dos parâmetros da consulta

    // Remove acentuação do termo de pesquisa
    const searchTermWithoutAccents = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Cria uma expressão regular diacrítica e case insensitive sensível com o termo de pesquisa
    const regex = diacriticSensitiveRegex(searchTermWithoutAccents, 'di');

    // Realiza a consulta no banco de dados MongoDB para encontrar notícias correspondentes ao termo de pesquisa
    const noticias = await Noticia.find({
      $or: [
        { titulo: { $regex: regex, $options: "i" } }, // Pesquisa por título (ignorando maiúsculas e minúsculas)
        { resumo: { $regex: regex, $options: "i" } } // Pesquisa por resumo (ignorando maiúsculas e minúsculas)
      ]
    });

    // Retorna as notícias encontradas como resposta
    res.status(200).json(noticias);
  } catch (error) {
    // Retorna um erro caso ocorra um problema na busca
    res.status(500).json({ error: error.message });
  }
});


// Rota de leitura de notícia por ID
router.get('/:id', async(req, res) => {
  const id = req.params.id;

  try {
    // Busca a notícia no banco de dados por ID
    const noticia = await Noticia.findOne({ _id: id });

    if (!noticia) {
      res.status(422).json({ error: "A notícia não foi encontrada" });
      return;
    }

    // Retorna a notícia encontrada como resposta
    res.status(200).json(noticia);
    return;
  } catch (error) {
    // Retorna um erro caso ocorra um problema na busca
    res.status(500).json({ error: error });
  }
});

// Rota para criar uma nova notícia
router.post('/', async(req, res) => {
  const {
    titulo,
    resumo,
    link,
    textoNoticia,
    dataPublicacao,
    legendaimagemPrincipal,
    autor,
    imagemCompleta,
    fonteimagemCompleta
  } = req.body;

  if (!titulo) {
    res.status(422).json({ error: 'Campos obrigatórios!' });
    return;
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
  };

  try {
    // Cria a notícia no banco de dados
    await Noticia.create(noticia);
    res.status(201).json({ message: 'Notícia inserida com sucesso' });
  } catch (error) {
    // Retorna um erro caso ocorra um problema na criação da notícia
    res.status(500).json({ error: error });
  }
});

// Rota para atualizar uma notícia existente
router.put('/:id', async(req, res) => {
  const id = req.params.id;

  const {
    titulo,
    resumo,
    link,
    textoNoticia,
    dataPublicacao,
    legendaimagemPrincipal,
    autor,
    imagemCompleta,
    fonteimagemCompleta
  } = req.body;

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
  };

  try {
    // Atualiza a notícia no banco de dados por ID
    const updateNoticia = await Noticia.updateOne({ _id: id }, noticia);

    if (updateNoticia.matchedCount === 0) {
      res.status(422).json({ error: "A notícia não foi encontrada" });
      return;
    }

    // Retorna a notícia atualizada como resposta
    res.status(200).json(noticia);
  } catch (error) {
    // Retorna um erro caso ocorra um problema na atualização da notícia
    res.status(500).json({ error: error });
  }
});

// Rota para excluir uma notícia por ID
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  const noticia = await Noticia.findOne({ _id: id });

  if (!noticia) {
    res.status(422).json({ error: "A notícia não foi encontrada" });
    return;
  }

  try {
    // Remove a notícia do banco de dados por ID
    await Noticia.deleteOne({ _id: id });
    res.status(200).json({ message: "Notícia removida com sucesso" });
  } catch (error) {
    // Retorna um erro caso ocorra um problema na exclusão da notícia
    res.status(500).json({ error: error });
  }
});

module.exports = router;
