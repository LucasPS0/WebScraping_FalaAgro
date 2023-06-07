const puppeteer = require("puppeteer");
const { MongoClient } = require("mongodb");
const cron = require("node-cron");

(async () => {
  // Define a URL do site a ser raspado
  const url = "https://www.cnabrasil.org.br/cna/noticias";

  // Define a URI do banco de dados MongoDB
  const uri = "mongodb+srv://lucaspsilva:35253030@courtneysdata.vjqs1cs.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  // Função para raspar as notícias do site CNA Brasil
  const scrapCna = async () => {
    try {
      // Conecta ao banco de dados MongoDB
      await client.connect();

      // Seleciona o banco de dados e a coleção
      const database = client.db("noticia");
      const collection = database.collection("noticias");

      // Inicializa o navegador Puppeteer
      const browser = await puppeteer.launch();

      // Abre uma nova página
      const page = await browser.newPage();

      // Navega para a URL do site
      await page.goto(url);

      // Aguarda o carregamento dos elementos na página
      await page.waitForSelector(".renderizar-resultados .card-noticia-grande");

      // Extrai os dados das notícias
      const noticias = await page.evaluate(() => {
        // Obtém os elementos que contêm as notícias
        const elements = Array.from(document.querySelectorAll(".renderizar-resultados .card-noticia-grande"));

        // Extrai as informações das notícias
        const noticias = elements.map((element) => {
          let titulo = element.querySelector(".card__titulo.bourbon-important")?.textContent?.trim();
          if (!titulo) {
            titulo = element.querySelector(".card__titulo")?.textContent?.trim();
          }

          const resumo = element.querySelector(".card__resumo.pt-20")?.textContent?.trim();
          const imagemCompleta = element.querySelector(".card-noticia-grande__imagem img")?.getAttribute("src");
          const dataPublicacao = element.querySelector(".card__data")?.textContent?.trim();
          const fonte = "Fonte: Cna Brasil";

          return {
            titulo,
            resumo,
            imagemCompleta,
            dataPublicacao,
            fonte,
          };
        });

        return noticias;
      });

      // Extrai os links das notícias
      const links = await page.evaluate(() => {
        // Obtém os elementos que contêm os links das notícias
        const elements = Array.from(document.querySelectorAll(".renderizar-resultados .grid-pagination-noticias.container-paginacao a"));

        // Extrai os links das notícias
        const links = elements.map((element) => element.getAttribute("href"));

        return links;
      });

      // Loop para acessar cada link e obter o conteúdo completo da notícia
      for (let i = 0; i < noticias.length; i++) {
        const link = links[i];

        // Abre uma nova página para cada link de notícia
        const noticiaPage = await browser.newPage();

        // Navega para o link da notícia
        await noticiaPage.goto(link);

        // Aguarda o carregamento do elemento que contém o texto completo da notícia
        await noticiaPage.waitForSelector(".conteudo-dinamico");

        // Extrai o texto completo da notícia
   // Extrai o HTML completo da notícia
const textoNoticia = await noticiaPage.evaluate(() => {
    const conteudoElement = document.querySelector(".conteudo-dinamico");
    return conteudoElement ? conteudoElement.innerHTML.trim() : "";
  });
  

        // Atualiza o objeto de notícia com o conteúdo completo
        noticias[i].textoNoticia = textoNoticia;

        // Fecha a página da notícia
        await noticiaPage.close();
      }

      // Insere os dados no banco de dados
      if (noticias.length > 0) {
        const result = await collection.insertMany(noticias);
        console.log(`${result.insertedCount} notícias inseridas no banco de dados.`);
      }

      // Fecha o navegador Puppeteer
      await browser.close();
    } catch (error) {
      console.log(error);
    } finally {
      // Fecha a conexão com o banco de dados
      await client.close();
    }
  };

  // Chama a função para realizar o scraping e inserir os dados
  await scrapCna();
})();
