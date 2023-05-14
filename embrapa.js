// Importa as bibliotecas necessárias
const cheerio = require("cheerio");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const cron = require("node-cron");
const moment = require("moment");

(async () => {
  // Define a URL do site a ser raspado
  const url = "https://www.embrapa.br/busca-de-noticias";

  // Define a URI do banco de dados MongoDB
  const uri = "mongodb://127.0.0.1/";
  const client = new MongoClient(uri);

  // Função para raspar as notícias do site Embrapa
  const scrapEmbrapa = async () => {
    try {
      // Conecta ao banco de dados MongoDB
      await client.connect();

      // Seleciona o banco de dados e a coleção
      const database = client.db("noticia");
      const collection = database.collection("noticias");

      // Faz uma requisição GET para obter o HTML da página
      const { data } = await axios.get(url);

      // Carrega o HTML obtido com a biblioteca Cheerio
      const $ = cheerio.load(data);

      // Inicializa um array para armazenar as notícias
      const noticias = [];

      // Itera sobre os elementos da página que contêm as notícias
      for (const element of $(".table-data .conteudo")) {
        // Extrai as informações da notícia
        const titulo = $(element).find(".titulo").text().trim();
        const resumo = $(element).find(".detalhes p").text().trim();

        const dataPublicacao = moment(
          $(element).find(".situacao").text(),
          "DD/MM/YY"
        ).toDate();

        const link = $(element).find("a").attr("href").replace(/\?.*/, "");

        // Faz uma nova requisição GET para obter o HTML da notícia individual
        const { data: noticiaData } = await axios.get(link);
        const $noticia = cheerio.load(noticiaData);

        // Extrai o texto da notícia e ajusta os links das imagens
        const textoNoticia = $noticia(".texto-noticia")
          .html()
          .replace(
            /src="\/documents/g,
            'src="https://www.embrapa.br/documents'
          );

        // Extrai a imagem principal e suas informações
        const imagemPrincipal = $noticia(".imagem-principal img[src]").attr(
          "data-src"
        );
        const imagemCompleta = "https://www.embrapa.br/" + imagemPrincipal;
        const legendaimagemPrincipal = $noticia(
          ".legenda-imagem-principal"
        ).text();
        const fonteimagemPrincipal = $noticia(".fonte-imagem-principal").text();
        const autor = $noticia(".autor").text();

        // Verifica se a notícia já existe no banco de dados
        const noticiaAtual = await collection.findOne({ link });

        if (!noticiaAtual) {
          // Se a notícia não existe, cria um novo objeto com as informações e adiciona ao banco de dados
          const noticia = {
            titulo: titulo,
            resumo: resumo,
            link: link,
            textoNoticia: textoNoticia,
            dataPublicacao: dataPublicacao,
            legendaimagemPrincipal: legendaimagemPrincipal,
            fonteimagemPrincipal: fonteimagemPrincipal,
            autor: autor,
          };

          if (imagemCompleta) {
            noticia.imagemCompleta = imagemCompleta;
          }

          const noticiasExistentes = await collection
            .find()
            .sort({ dataPublicacao: -1 })
            .toArray();

          let inserted = false;

          for (let i = 0; i <= noticiasExistentes.length; i++) {
            const noticiaAtual = noticiasExistentes[i];

            if (!noticiaAtual || dataPublicacao > noticiaAtual.dataPublicacao) {
              await collection.insertOne(noticia, { $position: i });

              console.log(
                `Notícia "${titulo}" foi adicionada ao banco de dados.`
              );
              inserted = true;
              break;
            }
          }

          if (!inserted) {
            await collection.insertOne(noticia);

            console.log(
              `Notícia "${titulo}" foi adicionada ao final do banco de dados.`
            );
          }
        } else {
          // Se a notícia já existe, verifica se houve alteração nos campos
          const {
            titulo: existingTitulo,
            resumo: existingResumo,
            textoNoticia: existingTextoNoticia,
            imagemCompleta: existingImagemCompleta,
            dataPublicacao: existingdataPublicacao,
            legendaimagemPrincipal: existinglegendaimagemPrincipal,
            fonteimagemPrincipal: existingfonteimagemPrincipal,
            autor: existingautor,
          } = noticiaAtual;

          console.log("existingdataPublicacao:", existingdataPublicacao);
          console.log("dataPublicacao:", dataPublicacao);
          const camposModificados =
            existingTitulo !== titulo ||
            existingResumo !== resumo ||
            existingTextoNoticia !== textoNoticia ||
            existingImagemCompleta !== imagemCompleta ||
            existingdataPublicacao.toISOString() !== dataPublicacao.toISOString() ||
            existinglegendaimagemPrincipal !== legendaimagemPrincipal ||
            existingfonteimagemPrincipal !== fonteimagemPrincipal ||
            existingautor !== autor;

          if (camposModificados) {
            // Se houve alteração nos campos, atualiza a notícia no banco de dados
            await collection.updateMany(
              { link: link },
              {
                $set: {
                  titulo: titulo,
                  resumo: resumo,
                  textoNoticia: textoNoticia,
                  imagemCompleta: imagemCompleta,
                  dataPublicacao: dataPublicacao,
                  legendaimagemPrincipal: legendaimagemPrincipal,
                  fonteimagemPrincipal: fonteimagemPrincipal,
                  autor: autor,
                },
              }
            );

            console.log(
              `Notícia "${titulo}" foi atualizada no banco de dados.`
            );
          } else {
            // Se não houve alteração nos campos, não faz nada
            console.log(
              `Notícia "${titulo}" já existe no banco de dados e não precisa ser atualizada.`
            );
          }
        }
      }

      console.log(noticias);
    } catch (error) {
      console.log(error);
    } finally {
      // Fecha a conexão com o banco de dados
      await client.close();
    }
  };

  // Agenda a função scrapEmbrapa para ser executada a cada 10 segundos
  cron.schedule("*/10 * * * * *", async () => {
    await scrapEmbrapa();
  });
})();
