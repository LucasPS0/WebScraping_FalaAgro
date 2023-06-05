const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const moment = require('moment');


const uri = "mongodb+srv://lucaspsilva:35253030@courtneysdata.vjqs1cs.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

(async () => {
  const url = "https://globorural.globo.com/ultimas-noticias/";

  const scrapGloboRural = async () => {
    const dataGloboRural = [];

    async function getHtml() {
      const { data: html } = await axios.get(url);
      return html;
    }

    async function getCompleteNews(link) {
      const { data: html } = await axios.get(link);
      const $ = cheerio.load(html);
      const textoNoticia = $("article").html().trim();
      const dataPublicacaoFormatted = moment($(".content-publication-data__updated").text(), 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY');
      const dataParts = dataPublicacaoFormatted.split('/');
      const dataPublicacao = new Date(Number(dataParts[2]), Number(dataParts[1]) - 1, Number(dataParts[0]));
      const titulo = $(".title").text();
      
    
      return { textoNoticia, dataPublicacao, titulo };
    }
    

    const response = await getHtml();
const $ = cheerio.load(response);
const feedPostBody = $(".feed-post-body").toArray();

for (const element of feedPostBody) {
  const resumo = $(element).find(".feed-post-body-resumo").text();
  const link = $(element).find(".feed-post-body a").attr("href");
  const imagemCompleta = $(element).find(".feed-post-figure-link img").attr("src");
  const fonte = "Fonte: Globo Rural";

  const { textoNoticia, dataPublicacao, titulo } = await getCompleteNews(link);

  const dataPublicacaoFormatted = moment(dataPublicacao).format('DD/MM/YYYY');
  const resumoConcatenado = resumo + " - Data de publicação: " + dataPublicacaoFormatted;

  dataGloboRural.push({ titulo, resumo: resumoConcatenado, link, imagemCompleta, textoNoticia, dataPublicacao, fonte });
}


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
        const existingNews = await collection.findOne({ titulo: news.titulo });

        if (existingNews) {
          console.log(`A notícia "${news.titulo}" já está no banco de dados.`);
          continue;
        }

        const result = await collection.insertOne(news);
        console.log("Dados inseridos no MongoDB com sucesso:", result.insertedId);
      }

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
