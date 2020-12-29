/**
 * Objeto de estado global da aplicação,
 * que será manipulado pelo usuário através dos inputs
 */
const globalState = {
  allDevs: [],
  filteredDevs: [],
  loadingData: true,
  checkboxJava: true,
  checkboxJavaScript: true,
  checkboxPython: true,
  radioAnd: false,
  radioOr: true,
};

/**
 * Variáveis globais que mapeiam elementos HTML
 */
const globalInputName = document.querySelector('#inputName');
const globalCheckboxJava = document.querySelector('#checkboxJava');
const globalCheckboxJavaScript = document.querySelector('#checkboxJavaScript');
const globalCheckboxPython = document.querySelector('#checkboxPython');
const globalRadioAnd = document.querySelector('#radioAnd');
const globalRadioOr = document.querySelector('#radioOr');
const globalDivDevs = document.querySelector('#divDevs');

/**
 * Tudo começa aqui. A invocação desta função é feita
 * na última linha de código deste arquivo
 */
async function start() {
  /**
   * Obtendo todos os dev's do backend
   * de forma assíncrona
   */
  await fetchAllDevs();

  /**
   * Adicionando eventos aos inputs, checkboxes e radio buttons
   */
  globalInputName.addEventListener('input', handleInputChange);

  globalCheckboxJava.addEventListener('input', handleCheckboxClick);
  globalCheckboxJavaScript.addEventListener('input', handleCheckboxClick);
  globalCheckboxPython.addEventListener('input', handleCheckboxClick);

  globalRadioAnd.addEventListener('input', handleRadioClick);
  globalRadioOr.addEventListener('input', handleRadioClick);

  /**
   * Iniciamos o app já filtrando os dev's conforme
   * valor inicial dos inputs
   */
  filterDevs();
}

/**
 * Esta função é executada somente uma vez
 * e traz todos os dev's do backend. Além disso,
 * faz uma transformação nos dados, incluindo um
 * campo para facilitar a pesquisa (removendo acentos,
 * espaços em branco e tornando todo o texto minúsculo) e
 * também um array contendo somente o nome das linguagens
 * de programação que determinado dev conhece
 */
async function fetchAllDevs() {
  const resource = await fetch('http://localhost:3001/devs');
  const json = await resource.json();

  const jsonWithImprovedSearch = json.map((item) => {
    const { name, programmingLanguages } = item;

    const lowerCaseName = name.toLocaleLowerCase();

    return {
      ...item,
      searchName: removeAccentMarksFrom(lowerCaseName)
        .split('')
        .filter((char) => char !== ' ')
        .join(''),
      onlyLanguages: getOnlyLanguagesFrom(programmingLanguages),
    };
  });

  globalState.allDevs = [...jsonWithImprovedSearch];
  globalState.filteredDevs = [...jsonWithImprovedSearch];

  // Forçando um atraso de 2 segundos para feedback visual
  setTimeout(() => {
    globalState.loadingData = false;
    filterDevs();
  }, 2000);
}

function getPreloader() {
  // prettier-ignore
  return (
    `<div class='flexrow'>
       <div class="preloader-wrapper small active">
         <div class="spinner-layer spinner-blue-only">
           <div class="circle-clipper left">
             <div class="circle"></div>
           </div><div class="gap-patch">
             <div class="circle"></div>
           </div><div class="circle-clipper right">
             <div class="circle"></div>
           </div>
         </div>
       </div>
       <span style='margin-left: 20px'>Carregando...</span>
     </div>`
  );
}

/**
 * Em toda mudança no texto de input,
 * haverá uma nova filtragem e renderização
 * de dev's
 */
function handleInputChange() {
  filterDevs();
}

/**
 * Aqui garantimos que uma e somente uma das opções
 * de radio de state permaneça como true. Em seguida,
 * filtramos os dev's
 */
function handleRadioClick({ target }) {
  const radioId = target.id;

  // if (radioId === 'radioAnd') {
  //   globalState.radioAnd = true;
  // } else {
  //   globalState.radioAnd = false;
  // }

  globalState.radioAnd = radioId === 'radioAnd';
  globalState.radioOr = radioId === 'radioOr';

  filterDevs();
}

/**
 * Refletimos os cliques de cada checkbox no state.
 * Identificamos qual checkbox foi clicado através
 * do respectivo id. Em seguida, filtramos os dev's.
 */
function handleCheckboxClick({ target }) {
  const checkboxId = target.id;
  globalState[checkboxId] = !globalState[checkboxId];

  //globalState.checkboxJava === globalState['checkboxJava']

  filterDevs();
}

/**
 * Função para varrer o array de linguagens de programação
 * e trazer somente o nome em minúsculas, de forma ordenada
 */
function getOnlyLanguagesFrom(programmingLanguages) {
  return programmingLanguages
    .map(({ language }) => language.toLocaleLowerCase())
    .sort();
}

/**
 * Função para remover acentos e caracteres especiais
 * de determinado texto
 */
function removeAccentMarksFrom(text) {
  const WITH_ACCENT_MARKS = 'áãâäàéèêëíìîïóôõöòúùûüñ'.split('');
  const WITHOUT_ACCENT_MARKS = 'aaaaaeeeeiiiiooooouuuun'.split('');

  const newText = text
    .toLocaleLowerCase()
    .split('')
    .map((char) => {
      /**
       * Se indexOf retorna -1, indica
       * que o elemento não foi encontrado
       * no array. Caso contrário, indexOf
       * retorna a posição de determinado
       * caractere no array de busca
       */
      const index = WITH_ACCENT_MARKS.indexOf(char);

      /**
       * Caso o caractere acentuado tenha sido
       * encontrado, substituímos pelo equivalente
       * do array b
       */
      if (index > -1) {
        return WITHOUT_ACCENT_MARKS[index];
      }

      return char;
    })
    .join('');

  return newText;
}

/**
 * Principal função deste app.
 *
 * Filtra os dev's conforme definições
 * do usuário e invoca a renderização
 * da tela
 */
function filterDevs() {
  const { allDevs, radioOr } = globalState;

  /**
   * Obtendo texto "limpo" do input
   */
  const lowerCaseText = globalInputName.value.toLocaleLowerCase().trim();
  const textFromInput = removeAccentMarksFrom(lowerCaseText);

  /**
   * Obtendo array de linguagens de programação a partir dos
   * checkboxes
   */
  const filterProgrammingLanguages = getFilteredProgrammingLanguages();

  /**
   * Obtendo os dev's com base nas linguagens de programação
   * e se o usuário escolheu "OU", o que abrange mais opções do
   * que "E" (mais limitado)
   */
  let filteredDevs = allDevs.filter(({ onlyLanguages }) => {
    /**
     * Com "OU", verificamos se pelo menos uma das linguagens
     * definidas pelo usuário percente às linguagens do dev.
     * Ex: Se o usuário escolheu somente Java, vai chegar dev
     * que sabe Java e Python
     *
     * Com "E", verificamos a comparação exata da(s) linguagem(ns)
     * Ex: Se o usuário escolheu somente Java, vai chegar dev
     * que sabe somente Java
     */
    return radioOr
      ? filterProgrammingLanguages.some((item) => onlyLanguages.includes(item))
      : filterProgrammingLanguages.join('') === onlyLanguages.join('');
  });

  /**
   * Após o primeiro filtro, filtramos mais uma vez
   * conforme o texto do input
   */
  if (textFromInput) {
    filteredDevs = filteredDevs.filter(({ searchName }) =>
      searchName.includes(textFromInput)
    );
  }

  /**
   * Definimos os dev's filtrados no estado do app
   * e invocamos a função de renderização em seguida.
   */
  globalState.filteredDevs = filteredDevs;
  renderDevs();
}

/**
 * Montamos um array de linguagens de programação,
 * conforme a marcação dos checkboxes
 */
function getFilteredProgrammingLanguages() {
  const { checkboxJava, checkboxJavaScript, checkboxPython } = globalState;

  let filterProgrammingLanguages = [];

  if (checkboxJava) {
    filterProgrammingLanguages.push('java');
  }

  if (checkboxJavaScript) {
    filterProgrammingLanguages.push('javascript');
  }

  if (checkboxPython) {
    filterProgrammingLanguages.push('python');
  }

  return filterProgrammingLanguages;
}

/**
 * Função de renderização dos dev's em tela
 */
function renderDevs() {
  if (globalState.loadingData) {
    globalDivDevs.innerHTML = getPreloader();
    return;
  }

  const { filteredDevs } = globalState;

  const devsToShow = filteredDevs
    .map((dev) => {
      return renderDev(dev);
    })
    .join('');

  const renderedHTML = `
     <div>
       <h2>${filteredDevs.length} dev(s) encontrado(s)</h2>
       <div class='row'>
         ${devsToShow}
       </div>
     </div>
  `;

  globalDivDevs.innerHTML = renderedHTML;
}

/**
 * Isolamos a função para renderizar um dev,
 * utilizando algumas classes do Materialize
 * e o próprio CSS do app
 */
function renderDev(dev) {
  const { name, picture, programmingLanguages } = dev;

  return `
    <div class='col s12 m6 l4'>
      <div class='dev-card'>
        <img class='avatar' src="${picture}" alt="${name}" title="${name}" />
        <div class='data'>
          <span>${name}</span>
          <span>${renderProgrammingLanguages(programmingLanguages)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Função para renderizar as linguagens de programação
 * através de ícones. Os ícones já foram fornecidos pelo
 * app na pasta "img"
 */
function renderProgrammingLanguages(programmingLanguages) {
  return programmingLanguages
    .map(({ language }) => {
      const src = `./img/${language.toLocaleLowerCase()}.png`;
      return `<img class='language' src='${src}' alt='${language}' title='${language}' />`;
    })
    .join(' ');
}

/**
 * Inicializando o app
 */
start();
