const cheerio = require("cheerio");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const cron = require("node-cron");

(async () => {
  const url = "https://www.embrapa.br/busca-de-noticias";

  const uri = "mongodb://127.0.0.1/";
  const client = new MongoClient(uri);

  const scrapEmbrapa = async () => {
    try {
      await client.connect();

      const database = client.db("noticia");
      const collection = database.collection("noticias");

      const { data } = await axios.get(url);

      const $ = cheerio.load(data);

      const noticias = [];

      for (const element of $(".table-data .conteudo")) {
        const titulo = $(element).find(".titulo").text().trim();
        const resumo = $(element).find(".detalhes p").text().trim();
        const dataPublicacao = $(element)
          .find(".detalhes p:nth-of-type(2)")
          .text();
        const link = $(element).find("a").attr("href").replace(/\?.*/, "");

        const { data: noticiaData } = await axios.get(link);
        const $noticia = cheerio.load(noticiaData);
        // encontra o texto da notícia
        const textoNoticia = $noticia(
          ".conteudo-noticia .texto-noticia-oculto"
        ).text();

        // encontra a imagem principal
        const imagemPrincipal = $noticia(".imagem-principal img[src]").attr(
          "data-src"
        );

        const imagemCompleta = "https://www.embrapa.br/" + imagemPrincipal;
        console.log(imagemCompleta);

        const legendaimagemPrincipal = $noticia(
          ".legenda-imagem-principal"
        ).text();
        console.log(legendaimagemPrincipal);

        const fonteimagemPrincipal = $noticia(
          ".fonte-imagem-principal"
        ).text();
        console.log(fonteimagemPrincipal);

        const autor = $noticia(".autor").text();
        console.log(autor);



        

        // Verifica se a notícia já existe no banco de dados
        const existingNoticia = await collection.findOne({ link });

        if (!existingNoticia) {
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

          // Adiciona a imagem principal, se existir
          if (imagemCompleta) {
            noticia.imagemCompleta = imagemCompleta;
          }

          await collection.insertOne(noticia);

          console.log(`Notícia "${titulo}" foi adicionada ao banco de dados.`);
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

          } = existingNoticia;

          const camposModificados =
            existingTitulo !== titulo ||
            existingResumo !== resumo ||
            existingTextoNoticia !== textoNoticia ||
            existingImagemCompleta !== imagemCompleta ||
            existingdataPublicacao !== dataPublicacao ||
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
      await client.close();
    }
  };

  cron.schedule("*/5 * * * * *", async () => {
    await scrapEmbrapa();
  });
})();
