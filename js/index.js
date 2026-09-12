let campoCidade = document.querySelector("#cidade");
let elementoMensagem = document.querySelector("#mensagem");
let elementoCidades = document.querySelector("#cidades");
let elementoPrevisao = document.querySelector("#previsao");

campoCidade.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    buscarCidades();
  }
});

async function buscarCidades() {
  let nome = campoCidade.value.trim();

  if (!nome) {
    elementoMensagem.textContent = "Digite o nome de uma cidade.";
    return;
  }

  elementoMensagem.textContent = "Buscando . . .";
  elementoCidades.innerHTML = "";
  elementoPrevisao.innerHTML = "";

  try {
    let resposta = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=10&language=pt&format=json`,
    );

    let dados = await resposta.json();

    if (
      !resposta.ok ||
      !Array.isArray(dados.results) ||
      dados.results.length === 0
    ) {
      elementoMensagem.textContent = "Nenhuma cidade encontrada.";
      return;
    }

    for (let i = 0; i < dados.results.length; i++) {
      let cidade = dados.results[i];
      let elementoCidade = document.createElement("button");
      let estado = cidade.admin1 || cidade.country || "";

      elementoCidade.type = "button";
      elementoCidade.textContent = `${cidade.name}${estado ? ` - ${estado}` : ""}`;
      elementoCidade.classList.add("cidade");
      elementoCidade.addEventListener("click", function () {
        buscarPrevisao(cidade.latitude, cidade.longitude, cidade.name, estado);
      });
      elementoCidades.appendChild(elementoCidade);
    }

    elementoMensagem.textContent = `${dados.results.length} cidade(s) encontrada(s).`;
  } catch (erro) {
    elementoMensagem.textContent =
      "Não foi possível buscar cidades neste momento.";
  }
}

async function buscarPrevisao(latitude, longitude, cidade, estado) {
  elementoPrevisao.textContent = "Buscando . . .";

  try {
    let resposta = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max&timezone=auto&forecast_days=6`,
    );

    let dados = await resposta.json();

    if (!resposta.ok || !dados.daily) {
      elementoPrevisao.textContent = "Não foi possível carregar a previsão.";
      return;
    }

    let dias = dados.daily.time
      .map((data, indice) => {
        let condicao = descricaoClima(dados.daily.weather_code[indice]);
        let minima = Math.round(dados.daily.temperature_2m_min[indice]);
        let maxima = Math.round(dados.daily.temperature_2m_max[indice]);
        let indiceUv = Number(dados.daily.uv_index_max[indice] ?? 0).toFixed(1);

        return `
          <article class="dia">
            <p class="data">${formatarData(data)}</p>
            <p>${condicao}</p>
            <div class="temperaturas">
              <span><strong>${minima} °C</strong> Mínima</span>
              <span><strong>${maxima} °C</strong> Máxima</span>
            </div>
            <p>Índice UV: ${indiceUv}</p>
          </article>
        `;
      })
      .join("");

    elementoPrevisao.innerHTML = `
      <h2>${cidade}${estado ? ` - ${estado}` : ""}</h2>
      <div class="dias">${dias}</div>
    `;
    elementoCidades.innerHTML = "";
    elementoMensagem.textContent = "";
  } catch (erro) {
    elementoPrevisao.textContent = "Não foi possível carregar a previsão.";
  }
}

function descricaoClima(codigo) {
  let condicoes = {
    0: "Céu limpo",
    1: "Parcialmente nublado",
    2: "Nublado",
    3: "Céu encoberto",
    45: "Nevoeiro",
    48: "Nevoeiro com geada",
    51: "Garoa leve",
    53: "Garoa moderada",
    55: "Garoa intensa",
    56: "Garoa gelada leve",
    57: "Garoa gelada intensa",
    61: "Chuva leve",
    63: "Chuva moderada",
    65: "Chuva forte",
    66: "Chuva gelada leve",
    67: "Chuva gelada intensa",
    71: "Neve leve",
    73: "Neve moderada",
    75: "Neve forte",
    77: "Grãos de neve",
    80: "Pancadas leves",
    81: "Pancadas moderadas",
    82: "Pancadas fortes",
    85: "Neve intensa",
    86: "Neve muito intensa",
    95: "Trovoadas",
    96: "Trovoadas com granizo",
    99: "Trovoadas com granizo intenso",
  };

  return condicoes[codigo] || "Clima variável";
}

function formatarData(data) {
  let partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarData(data){
  let partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
