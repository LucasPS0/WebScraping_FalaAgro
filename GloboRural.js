const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1/";
const client = new MongoClient(uri);

(async () => {
  const url = "https://globorural.globo.com/ultimas-noticias/";

  const scrapGloboRural = async () => {
    const dataGloboRural = []; // Alteração: agora é um array

    async function getHtml() {
      const { data: html } = await axios.get(url);
      return html;
    }

    const response = await getHtml();
    const $ = cheerio.load(response);
    $(".feed-post-body").each((index, element) => {
      const title = $(element).find(".feed-post-link").text();
      const resume = $(element).find(".feed-post-body-resumo").text();
      const link = $(element).find(".feed-post-body a").attr("href");
      const publication = $(element).find(".feed-post-datetime").text();
      const theme = $(element).find(".feed-post-metadata-section").text();
      const image = $(element).find(".feed-post-figure-link img").attr("src");

      // Archive data in an object
      dataGloboRural.push({ title, resume, link, publication, theme, image }); // Alteração: push para adicionar ao array
    });

    fs.writeFile("globoData.json", JSON.stringify(dataGloboRural), (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });

    return dataGloboRural;
  };

  async function insertData(data) {
    try {
      await client.connect();
      const database = client.db("noticia");
      const collection = database.collection("noticias");

      for (const news of data) {
        // Check if news with the same title already exists
        const existingNews = await collection.findOne({ title: news.title });

        if (existingNews) {
          console.log(`A notícia "${news.title}" já está no banco de dados.`);
          continue; // Skip insertion
        }

        const result = await collection.insertOne(news);
        console.log("Dados inseridos no MongoDB com sucesso:", result.insertedId);
      }

      for (const noticia of noticias) {
        // Abre a página da notícia
        await page.goto(noticia.link);

        // Espera pelo seletor .content-text__container
        await page.waitForSelector('.mc-article-body p.content-text__container');

        // Extrai o texto da notícia
        const texto = await page.evaluate(() => {
          const textoElementos = Array.from(document.querySelectorAll('.mc-article-body p.content-text__container '));
          return textoElementos.map(textoElemento => textoElemento.textContent).join('\n');
        });

        // Atualiza a notícia com o texto
        const result = await collection.updateOne({ link: noticia.link }, { $set: { texto } });
        console.log(`${result.modifiedCount} document(s) updated.`);
      }

      const texto = await page.evaluate(() => {
        // Obtém o elemento do texto
        const elementoTexto = document.querySelector('.content-text__container');
        
        // Obtém o texto do elemento e remove espaços em branco extras
        const texto = elementoTexto.textContent.trim();
      
        // Retorna o texto
        return texto;
      });

      console.log(texto)
      


    } catch (err) {
      console.error("Erro ao inserir os dados no MongoDB:", err);
    } finally {
      await client.close();
    }
  }

  const dataGloboRural = await scrapGloboRural();

  fs.writeFile("globoData.json", JSON.stringify(dataGloboRural), (err) => {
    if (err) throw err;
    console.log("O arquivo foi salvo!");

    // Chama a função para inserir os dados no MongoDB
    insertData(dataGloboRural);
  });
})();
