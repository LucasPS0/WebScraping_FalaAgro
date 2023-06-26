# WebScraping_FalaAgro
**Web scraping do site FalaAgro**

Este projeto é um web scraper que extrai notícias do site da Embrapa, GloboRural e CNA (em desenvolvimento), e armazena as informações em um banco de dados MongoDB. O scraper verifica se as notícias já existem no banco de dados e, se necessário, insere ou atualiza as informações. A função de scraping é executada a cada 6 horas usando a biblioteca node-cron.

**Requisitos**
$$
Node.js
MongoDB
Dependências
axios
cheerio
mongodb
node-cron
$$

# Instalação
**Clone este repositório:**

```console
git clone https://github.com/LCourtneey/WebScraping_FalaAgro.git
```

**Acesse o diretório do projeto:**
```console
cd WebScraping-FalaAgro
```

**Instale as dependências:**
```console
npm install
```
Inicie o MongoDB em sua máquina local ou configure a URI do MongoDB no arquivo embrapa.js para apontar para seu banco de dados remoto.

**Execute o script:**
```console
node embrapa.js
node GloboRural.js
node cna.js
```

**Funcionalidades**
O web scraper realiza as seguintes tarefas:
- Faz uma requisição GET para obter o HTML da página de notícias.
- Extrai as informações das notícias, como título, resumo, link, texto da notícia, data de publicação, imagem principal e suas informações (legenda, fonte e autor).
- Verifica se a notícia já existe no banco de dados MongoDB.
- Se a notícia não existe, insere as informações no banco de dados.
- Se a notícia já existe, verifica se houve alteração nos campos e, se necessário, atualiza as informações no banco de dados.
- Agenda a função de scraping para ser executada a cada 6 horas.
- 
- Sinta-se à vontade para contribuir com este projeto, enviando pull requests ou abrindo issues com sugestões de melhorias e correções.
