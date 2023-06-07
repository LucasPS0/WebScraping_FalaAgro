// Redirecionar para a página principal ao clicar no logo
const logoElement = document.querySelector("#logoAgro");
logoElement.addEventListener("click", function () {
  window.location.href = "https://falaagro.com/links/";
});

// Exibir botão de volta ao topo ao rolar a página
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (
    document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20
  ) {
    document.getElementById("btn-topo").style.display = "block";
  } else {
    document.getElementById("btn-topo").style.display = "none";
  }
}

// Voltar ao topo da página quando o botão for clicado
function topFunction() {
  document.body.scrollTop = 0; // Para Safari
  document.documentElement.scrollTop = 0; // Para Chrome, Firefox, IE e Opera
}

// Realizar pesquisa quando o valor do campo de pesquisa for alterado
let debounceTimeout;
const searchInput = document.querySelector("#searchInput");
searchInput.addEventListener("input", function (event) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const searchTerm = searchInput.value;
    if (searchTerm === "") {
      location.reload(); // Recarregar a página quando a pesquisa estiver vazia
    } else {
      searchNews(searchTerm); // Realizar pesquisa com o termo inserido
    }
  }, 500); // Atraso de 500 milissegundos (ajuste conforme necessário)
});

// Variáveis para controle da paginação e identificação de notícias exibidas
let currentPage = 0;
const itemsPerPage = 10;
let mainItemsAdded = 0;
const containerPrincipal = document.querySelector("#containerPrincipal");
const postsContainer = document.querySelector("#posts");
const displayedNewsIds = new Set();

// Buscar dados da API e exibir notícias
function fetchData() {
  const endpoint = `https://apifalaagro.onrender.com/noticia/resumo?page=${currentPage}&limit=${itemsPerPage}`;

  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((postData, index) => {
        if (displayedNewsIds.has(postData._id)) {
          return;
        }

        displayedNewsIds.add(postData._id);

        // Criar elementos HTML para exibir cada notícia
        const divMain = document.createElement("div");
        divMain.className = "postprincipal";

        const divMainTitle = document.createElement("a");
        divMainTitle.className = "title";
        divMainTitle.textContent = postData.titulo;

        const divMainfoto = document.createElement("img");
        divMainfoto.src = postData.imagemCompleta;

        const divFilter = document.createElement("div");
        divFilter.className = "image-filter";

        const post = document.createElement("div");
        post.className = "postagem";

        const imgpost = document.createElement("img");
        imgpost.className = "imgpost";
        imgpost.src = postData.imagemCompleta;

        const conteudopost = document.createElement("div");
        conteudopost.className = "conteudo";

        const title = document.createElement("p");
        title.className = "title";
        title.textContent = postData.titulo;

        const sub = document.createElement("p");
        sub.className = "sub";
        sub.innerHTML = postData.resumo;

        const fonte = document.createElement("p");
        fonte.className = "fonte";
        fonte.innerHTML = postData.fonte;

        const imageDiv = document.createElement("div");
        imageDiv.className = "image";

        // Adicionar eventos de clique para redirecionar para o conteúdo completo da notícia
        divMainTitle.addEventListener("click", () => {
          window.location.href = `conteudo.html?id=${postData._id}`;
        });

        divMain.addEventListener("click", () => {
          window.location.href = `conteudo.html?id=${postData._id}`;
        });

        title.addEventListener("click", () => {
          window.location.href = `conteudo.html?id=${postData._id}`;
        });

        imgpost.addEventListener("click", () => {
          window.location.href = `conteudo.html?id=${postData._id}`;
        });

        conteudopost.appendChild(title);
        conteudopost.appendChild(sub);
        conteudopost.appendChild(fonte);

        post.appendChild(imgpost);
        post.appendChild(conteudopost);
        divMain.appendChild(divMainTitle);
        imageDiv.appendChild(divMainfoto);
        divMain.appendChild(imageDiv);
        divMain.appendChild(divFilter);

        // Adicionar notícias principais ou secundárias com base na quantidade de itens adicionados
        if (mainItemsAdded < 3) {
          containerPrincipal.appendChild(divMain); // Adicionar notícia principal
          mainItemsAdded++;
        } else {
          postsContainer.appendChild(post); // Adicionar notícia secundária
        }
      });

      currentPage++;
    })
    .catch((error) => console.error(error));
}

// Realizar pesquisa de notícias com base no termo de pesquisa
function searchNews(searchTerm) {
  const endpoint = `https://apifalaagro.onrender.com/noticia/search?term=${searchTerm}`;

  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      const existingPosts = postsContainer.querySelectorAll(".postagem");
      existingPosts.forEach((post) => {
        post.classList.add("fade-out"); // Aplicar classe para efeito de fade-out
      });

      setTimeout(() => {
        postsContainer.innerHTML = "";
        containerPrincipal.innerHTML = "";

        if (data.length === 0) {
          // Exibir mensagem quando nenhuma notícia for encontrada
          postsContainer.innerHTML =
            "<p style=\"padding:20px; font-family: 'Space Grotesk', sans-serif; font-size: 2rem\">Nenhuma notícia foi encontrada.</p>";
          return;
        }

        data.forEach((postData, index) => {
          // Criar elementos HTML para exibir cada notícia encontrada na pesquisa
          const post = document.createElement("div");
          post.className = "postagem fade-in"; // Adicionar classe para efeito de fade-in

          const imgpost = document.createElement("img");
          imgpost.className = "imgpost";
          imgpost.src = postData.imagemCompleta;

          const conteudopost = document.createElement("div");
          conteudopost.className = "conteudo";

          const title = document.createElement("p");
          title.className = "title";
          title.textContent = postData.titulo;

          const sub = document.createElement("p");
          sub.className = "sub";
          sub.innerHTML = postData.resumo;

          const fonte = document.createElement("p");
          fonte.className = "fonte";
          fonte.innerHTML = postData.fonte;

          post.addEventListener("click", () => {
            window.location.href = `conteudo.html?id=${postData._id}`;
          });

          conteudopost.appendChild(title);
          conteudopost.appendChild(sub);
          conteudopost.appendChild(fonte);

          post.appendChild(imgpost);
          post.appendChild(conteudopost);

          postsContainer.appendChild(post);
        });

        // Remover classe fade-out dos novos posts após um pequeno atraso
        setTimeout(() => {
          const newPosts = postsContainer.querySelectorAll(".fade-in");
          newPosts.forEach((post) => {
            post.classList.remove("fade-in");
          });
        }, 100);
      }, 200);
    })
    .catch((error) => console.error(error));
}

// Buscar dados iniciais
fetchData();

// Carregar mais notícias ao rolar a página até o final
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight
  ) {
    setTimeout(fetchData, 500); // Atraso de 500ms antes de chamar a função fetchData()
  }
});

// Carregar mais notícias ao rolar a página no dispositivo móvel
let timeoutId;
window.addEventListener("touchmove", () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(fetchData, 2000); // Atraso de 2 segundos antes de chamar a função fetchData()
});
