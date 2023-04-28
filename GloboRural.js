const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();



  async function buscarNoticias() {
    await page.goto('https://g1.globo.com/economia/agronegocios/globo-rural/');
    await page.waitForSelector('.feed-post-body');

    // Rola ate o final da pagina
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Coleta as noticias
    const noticias = await page.evaluate(() => {
      const newsElementos = Array.from(document.querySelectorAll('.feed-post-body'));
      return newsElementos.map(newsElementos => {
        const tituloElementos = newsElementos.querySelector('a.feed-post-link');
        const titulo = tituloElementos.textContent;
        const link = tituloElementos.href;
        const resumoElemento = newsElementos.querySelector('.feed-post-body-resumo');
        const resumo = resumoElemento.textContent;
        return { titulo, resumo, link };
      });
    });

    // Conecta ao MongoDB
    const uri = 'mongodb://127.0.0.1/';
    const client = new MongoClient(uri);

    try {
      await client.connect();

      const database = client.db('local');
      const collection = database.collection('Noticias');




      for (const noticia of noticias) {
        const existingNoticia = await collection.findOne({ link: noticia.link });
        if (existingNoticia) {
          // Atualiza a noticia (caso tenha mudado o conteudo)
          const result = await collection.updateOne({ link: noticia.link }, { $set: { titulo: noticia.titulo, resumo: noticia.resumo } });
          console.log(`${result.modifiedCount} document(s) updated.`);
        } else {
          // Insere nova noticia (Caso o link ainda nao exista no Banco de dados)
          const result = await collection.insertOne(noticia);
          console.log(`${result.insertedCount} document(s) inserted.`);
        }
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


    } catch (err) {
      console.error(err);
    } finally {
      // Fehca a conexao
      client.close();
    }
  }

  cron.schedule('*/5 * * * *', async () => {
    await buscarNoticias();
  });


})();
