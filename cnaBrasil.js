// Importe as bibliotecas necessárias
const puppeteer = require("puppeteer");
const { MongoClient } = require("mongodb");

(async () => {
  // Define a URL do site a ser raspado
  const url = "https://www.cnabrasil.org.br/cna/noticias";

  // Define a URI do banco de dados MongoDB
  const uri = "mongodb://127.0.0.1/";
  const client = new MongoClient(uri);

  // Função para raspar as notícias do site CNA Brasil
  const scrapCna = async () => {
    try {
      // Conecta ao banco de dados MongoDB
      await client.connect();

      // Seleciona o banco de dados e a coleção
      const database = client.db("noticia");
      const collection = database.collection("noticias");

      // Inicializa um array para armazenar as notícias
      const noticias = [];

      // Inicializa o Puppeteer
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });
      
      const page = await browser.newPage();

      // Navega para a URL
      await page.goto(url);

      // Extrai os links das notícias
      const links = await page.evaluate(() => {
        // Obtém os elementos que contêm os links das notícias
        const elements = Array.from(document.querySelectorAll(".renderizar-resultados .grid-pagination-noticias.container-paginacao a"));

        // Extrai os links das notícias
        const links = elements.map((element) => element.getAttribute("href"));

        return links;
      });

      // Itera sobre os links e acessa cada página individualmente
      for (const link of links) {
        // Navega para o link da notícia
        await page.goto(link);

        // Extrai as informações da notícia
        const titulo = await page.$eval(".card__titulo", (element) => element.textContent.trim());
        const resumo = await page.$eval(".card__resumo.pt-20", (element) => element.textContent.trim());
        const imagemCompleta = await page.$eval(".card-noticia-grande__imagem img", (element) => element.getAttribute("src"));
        const dataPublicacao = await page.$eval(".card__data", (element) => {
            // Obtém o texto da data de publicação
            const textoData = element.textContent.trim();
          
            // Extrai o dia, mês e ano do texto
            const regex = /(\d+)\s+de\s+(\w+)\s+(\d+)/;
            const [, dia, mesTexto, ano] = regex.exec(textoData);
          
            // Mapeia o nome do mês para o número correspondente
            const meses = {
              janeiro: "01",
              fevereiro: "02",
              março: "03",
              abril: "04",
              maio: "05",
              junho: "06",
              julho: "07",
              agosto: "08",
              setembro: "09",
              outubro: "10",
              novembro: "11",
              dezembro: "12",
            };
          
            // Obtém o número do mês com base no nome do mês
            const mes = meses[mesTexto.toLowerCase()];
          
            // Retorna a string de data no formato "YYYY-MM-DD"
            return `${ano}-${mes}-${dia}`;
          });
          
          
          
        const fonte = "Fonte: Cna Brasil";
        const textoNoticia = await page.$eval(".conteudo-dinamico", (element) => element.innerHTML.trim());

        // Cria um objeto de notícia
        const noticia = {
          titulo,
          resumo,
          imagemCompleta,
          dataPublicacao,
          fonte,
          link,
          textoNoticia,
        };

        // Adiciona a notícia ao array
        noticias.push(noticia);
      }

      // Insere os dados no banco de dados
      if (noticias.length > 0) {
        const result = await collection.insertMany(noticias);
        console.log(`${result.insertedCount} notícias inseridas no banco de dados.`);
      }

      // Fecha o navegador
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
