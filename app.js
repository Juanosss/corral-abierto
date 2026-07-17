// Limpiar ancla de la URL solo si es una carga directa/recarga (sin referrer de nuestro sitio)
// Esto permite que los enlaces "En Vivo" y "Análisis" desde las subpáginas funcionen,
// pero evita que al recargar o volver atrás desde el historial salte a la sección.
if (window.location.hash) {
    const fromSubpage = document.referrer && document.referrer.includes(window.location.hostname);
    if (!fromSubpage) {
        history.replaceState(null, null, window.location.pathname);
    }
}
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
    // Solo forzar scroll arriba si no venimos con una redirección con hash intencionada
    if (!window.location.hash) {
        window.scrollTo(0, 0);
        setTimeout(() => window.scrollTo(0, 0), 10);
    } else {
        // Si hay hash intencionado desde subpágina, desplazarse suavemente a la sección (centrando el elemento)
        const targetId = window.location.hash.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            setTimeout(() => {
                const elementRect = targetElement.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const elementHeight = elementRect.height;
                const windowHeight = window.innerHeight;
                const headerHeight = document.querySelector('.app-header')?.offsetHeight || 80;
                
                const availableHeight = windowHeight - headerHeight;
                let targetPosition = absoluteElementTop - headerHeight - (availableHeight - elementHeight) / 2;
                
                if (elementHeight > availableHeight) {
                    targetPosition = absoluteElementTop - headerHeight - 20; // 20px de margen arriba si no cabe
                }
                
                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            }, 150);
        }
    }
});

const defaultRodeoData = [
    { n: 1, asociacion: "LAGO LLANQUIHUE", criadero: "EL ECO", jinetes: ["JUAN ANTONIO REHBEIN", "BRUNO REHBEIN"], caballos: ["CARPACHO", "FANTASIA"], animal1: 2, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 2, asociacion: "QUILLOTA MAIPO", criadero: "", jinetes: ["RICARDO LEMUS", "MATIAS RAMIREZ"], caballos: ["RESPLENDOR", "ULTIMO"], animal1: -3, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 3, asociacion: "QUILLOTA", criadero: "", jinetes: ["SERGIO ABARCA", "NICOLAS MAGGI"], caballos: ["ESPUELAZO", "ESTAFADO II"], animal1: 0, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 4, asociacion: "SANTIAGO ORIENTE", criadero: "", jinetes: ["PABLO PINO", "MARTIN DURAN"], caballos: ["NEGRITA", "PACHAMAMA"], animal1: 5, animal2: 4, sub1: 9, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 5, asociacion: "CORDILLERA", criadero: "ROCIO DE LUNA", jinetes: ["CLAUDIO HERRERA", "FRANCISCO MATAS"], caballos: ["PITRAL", "DICHA"], animal1: 5, animal2: 7, sub1: 12, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 6, asociacion: "LITORAL CENTRAL", criadero: "RINCONADA DEL MONTE", jinetes: ["JERONIMO VALDES", "JOAQUIN VALDES"], caballos: ["MERCENARIO", "PRIMERA DAMA"], animal1: 10, animal2: 2, sub1: 12, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 7, asociacion: "TALAGANTE", criadero: "", jinetes: ["SEBASTIAN MORENO", "GUILLERMO OLAVE"], caballos: ["RESPONSO", "QUIRQUINCHO"], animal1: 3, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 8, asociacion: "LITORAL CENTRAL", criadero: "", jinetes: ["FRANCISCO OLIVOS", "JOAQUIN MALLEA"], caballos: ["CADEJILLO", "LOLERO"], animal1: 5, animal2: 4, sub1: 9, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 9, asociacion: "RIO RAHUE", criadero: "", jinetes: ["SEBASTIAN IBAÑEZ", "VITTORIO CAVALIERI"], caballos: ["YUCATAN", "BUEN RECUERDO"], animal1: 4, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 10, asociacion: "CARDENAL CARO", criadero: "ENTRE QUISCOS Y ESPINOS", jinetes: ["JUAN PABLO YAÑEZ", "JUAN PABLO YAÑEZ"], caballos: ["DECRETO", "ASTRONERA"], animal1: 5, animal2: 8, sub1: 13, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 11, asociacion: "OSORNO", criadero: "MUTICAO", jinetes: ["JOAQUIN GROB", "CAMILO PADILLA"], caballos: ["MALICIA", "TERREMOTO"], animal1: 8, animal2: 8, sub1: 16, animal3: 3, sub2: 19, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 12, asociacion: "TALCA ORIENTE", criadero: "", jinetes: ["LEVIS LINEROS", "FRANCISCO LINEROS"], caballos: ["REVUELTO", "FAMOSO"], animal1: "NO CORRE POR LESION DEL CABALLO FAMOSO", animal2: "", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 13, asociacion: "SANTIAGO SUR", criadero: "PALMAS DE PEÑAFLOR", jinetes: ["ALFREDO MORENO", "JUAN IGNACIO MEZA"], caballos: ["TAY MAL", "BIEN PAGADA"], animal1: 5, animal2: 4, sub1: 9, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 14, asociacion: "RIO RAHUE", criadero: "", jinetes: ["FELIPE KILALEO", "JUAN IGNACIO VARGAS"], caballos: ["MORENA MIA", "ESENCIA"], animal1: 8, animal2: 3, sub1: 11, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 15, asociacion: "MALLECO", criadero: "PELECO", jinetes: ["GUSTAVO VALDEBENITO", "FELIPE GARCES"], caballos: ["PARODIA", "CHAPERONA"], animal1: 9, animal2: 5, sub1: 14, animal3: -1, sub2: 13, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 16, asociacion: "OSORNO", criadero: "", jinetes: ["GONZALO SCHWALM", "GONZALO SCHWALM"], caballos: ["BURLESCO", "PINTOSO"], animal1: 11, animal2: 5, sub1: 16, animal3: 8, sub2: 24, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 17, asociacion: "MAGALLANES", criadero: "", jinetes: ["NELSON GARCIA", "HERNAN LÖBEL"], caballos: ["ANTONIETA", "AMIGA MIA"], animal1: 9, animal2: 5, sub1: 14, animal3: 5, sub2: 19, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 18, asociacion: "COLCHAGUA", criadero: "", jinetes: ["DIEGO PACHECO", "SEBASTIAN CARO"], caballos: ["BUEN VECINO", "DON GONZA"], animal1: 4, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 19, asociacion: "MELIPILLA", criadero: "LOS TACOS DE RUMAI", jinetes: ["ROBERTO BOZZO", "MATIAS SEPULVEDA"], caballos: ["QUERENDON", "RECLUTA"], animal1: 5, animal2: 7, sub1: 12, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 20, asociacion: "MELIPILLA", criadero: "", jinetes: ["FRANCISCO HIDALGO", "NICOLAS AREVALO"], caballos: ["FABULOSO", "SARMIENTO"], animal1: 6, animal2: 13, sub1: 19, animal3: 8, sub2: 27, animal4: 7, resultado: 34, empates: "", lugar: "3°" },
    { n: 21, asociacion: "SANTIAGO ORIENTE", criadero: "RISCO LISO", jinetes: ["PABLO PINO", "MARTIN DURAN"], caballos: ["LAURENCIO", "RAMONCITO"], animal1: 12, animal2: 8, sub1: 20, animal3: 11, sub2: 31, animal4: 12, resultado: 43, empates: "", lugar: "1°" },
    { n: 22, asociacion: "VALDIVIA", criadero: "ALUCARPA", jinetes: ["GUSTAVO CORNEJO", "RAFAEL MELO"], caballos: ["ENCAPUCHAO", "FIGURITA"], animal1: 3, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 23, asociacion: "MAIPO NORTE", criadero: "CARIMALLIN", jinetes: ["PEDRO ESPINOZA", "ARTURO RIOS"], caballos: ["REVOLTOSA", "LISTO NO MAS"], animal1: 8, animal2: 8, sub1: 16, animal3: 5, sub2: 21, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 24, asociacion: "VALDIVIA CAUQUENES", criadero: "SANTA BERNARDITA", jinetes: ["FERNANDO ALCALDE", "LUIS FERNANDO CORVALAN"], caballos: ["CHICO MATI", "CACHULO"], animal1: 10, animal2: 10, sub1: 20, animal3: 7, sub2: 27, animal4: 4, resultado: 31, empates: "", lugar: "" },
    { n: 25, asociacion: "CAUTIN", criadero: "SANTA ELBA", jinetes: ["SEBASTIAN POBLETE", "JUAN POBLETE"], caballos: ["CALICANTO", "CHAPEADO"], animal1: 10, animal2: 0, sub1: 10, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 26, asociacion: "SANTIAGO SUR TALCA ORIENTE", criadero: "EL CARMEN DE NILAHUE", jinetes: ["PABLO BARAONA", "RUFINO HERNANDEZ"], caballos: ["FACINANTE", "NO VA MAS"], animal1: 4, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 27, asociacion: "COLCHAGUA", criadero: "", jinetes: ["DIEGO PACHECO", "ROBERTO PAVEZ"], caballos: ["CAPERUSO", "COTOTUDO"], animal1: 7, animal2: 1, sub1: 8, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 28, asociacion: "SAN FELIPE", criadero: "", jinetes: ["JORGE ORTEGA", "RODRIGO ORTEGA"], caballos: ["ACUSAO", "AGRAVIO"], animal1: 5, animal2: 10, sub1: 15, animal3: 7, sub2: 22, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 29, asociacion: "CORDILLERA", criadero: "", jinetes: ["NICOLAS BARROS", "JOSE DE LA JARA"], caballos: ["TENTAITA", "JORNADA"], animal1: 5, animal2: -4, sub1: 1, animal3: "X", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 30, asociacion: "COLCHAGUA SANTIAGO ORIENTE", criadero: "TAITAO II", jinetes: ["DIEGO PACHECO", "EMILIANO RUIZ"], caballos: ["SAFIRA", "ESTELITA"], animal1: 4, animal2: "X", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 31, asociacion: "MAULE SUR", criadero: "BELLA CATALINA", jinetes: ["LUCIANO TAPIA", "RICARDO SOTO"], caballos: ["MI MORENA", "OÑA JAVI"], animal1: 9, animal2: 5, sub1: 14, animal3: 5, sub2: 19, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 32, asociacion: "TALCA ORIENTE", criadero: "LOS MAQUIS", jinetes: ["ALFONSO BARRIENTOS", "JUAN PABLO GONZALEZ"], caballos: ["AGUA BUENA", "DERROTADA"], animal1: 5, animal2: "NO SIGUE CORRIENDO POR LESION DE DERROTADA", sub1: "", animal3: "", sub2: "", animal4: "", resultado: "", empates: "", lugar: "" },
    { n: 33, asociacion: "MAGALLANES", criadero: "LOS ALERCES", jinetes: ["NELSON GARCIA", "HERNAN LÖBEL"], caballos: ["RECLUTA", "ALERCE"], animal1: 7, animal2: 13, sub1: 20, animal3: 8, sub2: 28, animal4: 4, resultado: 32, empates: "", lugar: "" },
    { n: 34, asociacion: "SANTIAGO SUR TALCA ORIENTE", criadero: "EL CARMEN DE NILAHUE", jinetes: ["ANIBAL BARAONA", "RUFINO HERNANDEZ"], caballos: ["CONVENTILLERA", "CARABELA"], animal1: 12, animal2: 11, sub1: 23, animal3: 8, sub2: 31, animal4: 9, resultado: 40, empates: "", lugar: "2°" },
    { n: 35, asociacion: "MAIPO NORTE", criadero: "AGUA DE LOS CAMPOS Y MAQUENA", jinetes: ["GONZALO ABARCA", "CRISTOBAL CORTINA"], caballos: ["CUCHU CUCHU", "DESPEINADA"], animal1: 5, animal2: 13, sub1: 18, animal3: 7, sub2: 25, animal4: 7, resultado: 32, empates: "", lugar: "" },
    { n: 36, asociacion: "VALDIVIA", criadero: "VISTA VOLCAN", jinetes: ["RICARDO ALVAREZ", "MIGUEL PARRA"], caballos: ["GOLPE A GOLPE", "PATA E PERRO"], animal1: 7, animal2: 13, sub1: 20, animal3: 2, sub2: 22, animal4: "X", resultado: "", empates: "", lugar: "" },
    { n: 37, asociacion: "MALLECO", criadero: "PELECO", jinetes: ["GUSTAVO VALDEBENITO", "FELIPE GARCES"], caballos: ["MESSI", "EL MAMO"], animal1: 9, animal2: 5, sub1: 14, animal3: -2, sub2: 12, animal4: "X", resultado: "", empates: "", lugar: "" }
];

const defaultGenealogiaData = [
    {
        id: "carpacho",
        nombre: "CARPACHO",
        criadero: "CRIADERO EL ECO",
        nacional: "SBT N° 238190",
        fn: "F.N. 18-11-2012",
        foto: "carpacho.png",
        alzada: "1,40 m",
        cincha: "1,70 m",
        cana: "19 cm",
        padre: "Plebiscito",
        madre: "Esperanzada",
        abueloP: "Bellaco",
        abuelaP: "Tula",
        abueloM: "Estribillo",
        abuelaM: "Guinda",
        bisP1: "Taco",
        bisP2: "Percala",
        bisP3: "Colibrí",
        bisP4: "Nutria",
        bisM1: "Guaraní",
        bisM2: "Reserva",
        bisM3: "Clementina",
        bisM4: "Desdicha"
    },
    {
        id: "fantasia",
        nombre: "FANTASÍA",
        criadero: "CRIADERO EL ECO",
        nacional: "SBT N° 245901",
        fn: "F.N. 05-09-2014",
        foto: "",
        alzada: "1,38 m",
        cincha: "1,68 m",
        cana: "18 cm",
        padre: "Escorpión",
        madre: "Que Luna",
        abueloP: "Estribillo",
        abuelaP: "Torhuela",
        abueloM: "Borracho En Domingo",
        abuelaM: "Ocurrencia",
        bisP1: "Guaraní",
        bisP2: "Reserva",
        bisP3: "Taco",
        bisP4: "Nevería",
        bisM1: "Que Más Da",
        bisM2: "En Domingo",
        bisM3: "Bellaco",
        bisM4: "Chupilca"
    },
    {
        id: "resplendor",
        nombre: "RESPLENDOR",
        criadero: "PROPIETARIOS: LEMUS / RAMÍREZ",
        nacional: "SBT N° 229103",
        fn: "F.N. 12-10-2011",
        foto: "",
        alzada: "1.42 m",
        cincha: "1.72 m",
        cana: "19.5 cm",
        padre: "Rotoso",
        madre: "Estampa",
        abueloP: "Taco",
        abuelaP: "Rotosa",
        abueloM: "Esquinazo",
        abuelaM: "Codiciada",
        bisP1: "Rascacielos",
        bisP2: "Talavera",
        bisP3: "El Quinto",
        bisP4: "Rota",
        bisM1: "Estribillo",
        bisM2: "Talavera II",
        bisM3: "Taco",
        bisM4: "Codicia"
    },
    {
        id: "ultimo",
        nombre: "ÚLTIMO",
        criadero: "PROPIETARIOS: LEMUS / RAMÍREZ",
        nacional: "SBT N° 251092",
        fn: "F.N. 14-11-2015",
        foto: "",
        alzada: "1.41 m",
        cincha: "1.71 m",
        cana: "19 cm",
        padre: "Esquinazo",
        madre: "Inocencia",
        abueloP: "Estribillo",
        abuelaP: "Talavera II",
        abueloM: "Rante",
        abuelaM: "Purísima",
        bisP1: "Guaraní",
        bisP2: "Reserva",
        bisP3: "Taco",
        bisP4: "Talavera",
        bisM1: "Rigor",
        bisM2: "Anchoa",
        bisM3: "Taco",
        bisM4: "Purísima I"
    },
    {
        id: "espuelazo",
        nombre: "ESPUELAZO",
        criadero: "PROPIETARIOS: ABARCA / MAGGI",
        nacional: "SBT N° 236481",
        fn: "F.N. 22-10-2012",
        foto: "",
        alzada: "1.39 m",
        cincha: "1.69 m",
        cana: "18.5 cm",
        padre: "Esperando",
        madre: "Revoltosa",
        abueloP: "Estribillo",
        abuelaP: "Guinda",
        abueloM: "Taco",
        abuelaM: "Llovizna",
        bisP1: "Guaraní",
        bisP2: "Reserva",
        bisP3: "Clementina",
        bisP4: "Desdicha",
        bisM1: "Rascacielos",
        bisM2: "Talavera",
        bisM3: "Colibrí",
        bisM4: "Lluvia"
    },
    {
        id: "estafado-ii",
        nombre: "ESTAFADO II",
        criadero: "PROPIETARIOS: ABARCA / MAGGI",
        nacional: "SBT N° 240982",
        fn: "F.N. 02-09-2013",
        foto: "",
        alzada: "1.43 m",
        cincha: "1.74 m",
        cana: "20 cm",
        padre: "Estribillo",
        madre: "Chacarera",
        abueloP: "Guaraní",
        abuelaP: "Reserva",
        abueloM: "Comodín",
        abuelaM: "Fianza",
        bisP1: "Quebrado",
        bisP2: "Guaraní I",
        bisP3: "Estribillo I",
        bisP4: "Fianza",
        bisM1: "Taco",
        bisM2: "Comadre",
        bisM3: "Rigor",
        bisM4: "Fianza I"
    },
    {
        id: "negrita",
        nombre: "NEGRITA",
        criadero: "PROPIETARIOS: PINO / DURÁN",
        nacional: "SBT N° 248761",
        fn: "F.N. 19-11-2014",
        foto: "",
        alzada: "1.37 m",
        cincha: "1.67 m",
        cana: "18 cm",
        padre: "Remehue",
        madre: "Pachacha",
        abueloP: "Guante",
        abuelaP: "Ratera",
        abueloM: "Taco",
        abuelaM: "Consentida",
        bisP1: "Taco",
        bisP2: "Guadaña",
        bisP3: "Rante",
        bisP4: "Ratera I",
        bisM1: "Rascacielos",
        bisM2: "Talavera",
        bisM3: "Bellaco",
        bisM4: "Consentida I"
    },
    {
        id: "pachamama",
        nombre: "PACHAMAMA",
        criadero: "PROPIETARIOS: PINO / DURÁN",
        nacional: "SBT N° 256193",
        fn: "F.N. 30-10-2016",
        foto: "",
        alzada: "1.40 m",
        cincha: "1.70 m",
        cana: "19 cm",
        padre: "Talento",
        madre: "Presumida",
        abueloP: "Taco",
        abuelaP: "Que Chica",
        abueloM: "Esquinazo",
        abuelaM: "Coqueta",
        bisP1: "Rascacielos",
        bisP2: "Talavera",
        bisP3: "Estribillo",
        bisP4: "Chica",
        bisM1: "Estribillo",
        bisM2: "Talavera II",
        bisM3: "Rotoso",
        bisM4: "Coqueta I"
    },
    {
        id: "pitral",
        nombre: "PITRAL",
        criadero: "CRIADERO ROCÍO DE LUNA",
        nacional: "SBT N° 243981",
        fn: "F.N. 25-11-2013",
        foto: "",
        alzada: "1.41 m",
        cincha: "1.73 m",
        cana: "19.5 cm",
        padre: "Albertio",
        madre: "Que Luna",
        abueloP: "Escorpión",
        abuelaP: "Alberca",
        abueloM: "Borracho En Domingo",
        abuelaM: "Ocurrencia",
        bisP1: "Estribillo",
        bisP2: "Torhuela",
        bisP3: "Taco",
        bisP4: "Alberca I",
        bisM1: "Que Más Da",
        bisM2: "En Domingo",
        bisM3: "Bellaco",
        bisM4: "Chupilca"
    },
    {
        id: "dicha",
        nombre: "DICHA",
        criadero: "CRIADERO ROCÍO DE LUNA",
        nacional: "SBT N° 231492",
        fn: "F.N. 10-10-2011",
        foto: "",
        alzada: "1.39 m",
        cincha: "1.68 m",
        cana: "18.5 cm",
        padre: "Canteado",
        madre: "Dicha H.",
        abueloP: "Esperando",
        abuelaP: "Tula",
        abueloM: "Taco",
        abuelaM: "Estampa",
        bisP1: "Estribillo",
        bisP2: "Guinda",
        bisP3: "Colibrí",
        bisP4: "Nutria",
        bisM1: "Rascacielos",
        bisM2: "Talavera",
        bisM3: "Esquinazo",
        bisM4: "Codiciada"
    }
];

// Persistencia en localStorage
let rodeoData = null;
try {
    const rawRodeo = localStorage.getItem('rodeoData');
    if (rawRodeo && rawRodeo !== "undefined") {
        rodeoData = JSON.parse(rawRodeo);
    }
} catch (e) {
    console.error("Error al leer rodeoData de localStorage:", e);
}

if (!rodeoData || rodeoData.length === 0) {
    rodeoData = defaultRodeoData;
    try {
        localStorage.setItem('rodeoData', JSON.stringify(rodeoData));
    } catch(e) {
        console.error("Error al guardar defaultRodeoData:", e);
    }
} else {
    // CORRECCIÓN AUTOMÁTICA DE SUB-TOTALES DAÑADOS
    let databaseFixed = false;
    rodeoData.forEach(row => {
        const score1 = parseInt(row.animal1);
        const score2 = parseInt(row.animal2);
        const score3 = parseInt(row.animal3);
        
        if (!isNaN(score1) && !isNaN(score2) && (row.sub1 === "" || row.sub1 === null || row.sub1 === undefined)) {
            row.sub1 = score1 + score2;
            databaseFixed = true;
        }
        if (row.sub1 !== "" && row.sub1 !== null && row.sub1 !== undefined && !isNaN(score3) && (row.sub2 === "" || row.sub2 === null || row.sub2 === undefined)) {
            row.sub2 = parseInt(row.sub1) + score3;
            databaseFixed = true;
        }
    });
    if (databaseFixed) {
        try {
            localStorage.setItem('rodeoData', JSON.stringify(rodeoData));
        } catch(e) {
            console.error(e);
        }
    }
}

let genealogiaData = null;
try {
    const rawGenealogia = localStorage.getItem('genealogiaData');
    if (rawGenealogia && rawGenealogia !== "undefined") {
        genealogiaData = JSON.parse(rawGenealogia);
    }
} catch(e) {
    console.error("Error al leer genealogiaData de localStorage:", e);
}

if (!genealogiaData || genealogiaData.length === 0) {
    genealogiaData = defaultGenealogiaData;
    try {
        localStorage.setItem('genealogiaData', JSON.stringify(genealogiaData));
    } catch(e) {
        console.error("Error al guardar defaultGenealogiaData:", e);
    }
}

function formatScore(val) {
    if (val === "" || val === null || val === undefined) return "";
    if (val === "X" || val === "x") return `<span class="td-score-val val-x">X</span>`;
    if (typeof val === 'number' || !isNaN(val)) return `<span class="td-score-val val-num">${val}</span>`;
    return `<span class="td-score-val val-text">${val}</span>`;
}

function analyzeData(data) {
    const container = document.getElementById('analisis-container');
    
    // Campeones
    const primeros = data.find(d => d.lugar === "1°");
    const segundos = data.find(d => d.lugar === "2°");
    const terceros = data.find(d => d.lugar === "3°");
    
    // Corrieron el Cuarto Animal
    const cuartoAnimal = data.filter(d => typeof d.animal4 === 'number' || (typeof d.animal4 === 'string' && !isNaN(parseInt(d.animal4))));
    
    // Mejor atajada/toro
    let maxPunto = 0;
    let mejorCollera = null;
    let mejorToro = "";
    
    data.forEach(d => {
        ['animal1', 'animal2', 'animal3', 'animal4'].forEach((toro, idx) => {
            let val = parseInt(d[toro]);
            if (!isNaN(val) && val > maxPunto) {
                maxPunto = val;
                mejorCollera = d;
                mejorToro = (idx+1) + "° Toro";
            }
        });
    });

    let html = "";
    
    if (primeros) {
        html += `
            <div class="analisis-card card-champion">
                <h3><div class="card-icon-wrapper">🏆</div> Campeones de Chile</h3>
                <p>${primeros.jinetes.join(" y ")}</p>
                <p class="sub-detail">Montando a ${primeros.caballos.join(" y ")}</p>
                <span class="highlight">${primeros.resultado} pts</span>
            </div>
        `;
    }
    if (segundos) {
        html += `
            <div class="analisis-card card-vice">
                <h3><div class="card-icon-wrapper">🥈</div> Vicecampeones</h3>
                <p>${segundos.jinetes.join(" y ")}</p>
                <p class="sub-detail">Montando a ${segundos.caballos.join(" y ")}</p>
                <span class="highlight">${segundos.resultado} pts</span>
            </div>
        `;
    }
    if (terceros) {
        html += `
            <div class="analisis-card card-third">
                <h3><div class="card-icon-wrapper">🥉</div> Terceros Campeones</h3>
                <p>${terceros.jinetes.join(" y ")}</p>
                <p class="sub-detail">Montando a ${terceros.caballos.join(" y ")}</p>
                <span class="highlight">${terceros.resultado} pts</span>
            </div>
        `;
    }
    
    let collerasCuartoHTML = "<div class='colleras-list-container'>";
    cuartoAnimal.forEach(c => {
        collerasCuartoHTML += `<span class="collera-badge">${c.jinetes.join(" y ")}</span>`;
    });
    collerasCuartoHTML += "</div>";
    
    html += `
        <div class="analisis-card card-fourth">
            <h3><div class="card-icon-wrapper">🐂</div> Cuarto Animal</h3>
            <p>Llegaron al 4to animal</p>
            <span class="highlight">${cuartoAnimal.length} <span style="font-size: 1.5rem; color: var(--text-muted); font-weight: 600;">colleras</span></span>
            ${collerasCuartoHTML}
        </div>
    `;

    container.innerHTML = html;
}

function getFinalScore(row) {
    let score = parseInt(row.resultado);
    if (!isNaN(score)) return score;
    score = parseInt(row.sub2);
    if (!isNaN(score)) return score;
    score = parseInt(row.sub1);
    if (!isNaN(score)) return score;
    score = parseInt(row.animal1);
    if (!isNaN(score)) return score;
    return -999;
}

function getScoreForStage(row, stage) {
    let score = -999;
    if (stage === 1) score = parseInt(row.animal1);
    else if (stage === 2) score = parseInt(row.sub1);
    else if (stage === 3) score = parseInt(row.sub2);
    else if (stage === 4) score = parseInt(row.resultado);
    return isNaN(score) ? -999 : score;
}

function renderTable(data, stage = 4) {
    const tbody = document.getElementById('table-body');
    const thead = document.getElementById('table-head');
    if (!tbody) return;
    
    const isTotalMode = stage === "total";
    const displayStage = isTotalMode ? 4 : stage;
    
    // 1. Reconstruir encabezados de la tabla dinámicamente según etapa (sin subtotales intermedios)
    let theadHtml = `
        <tr>
            <th>Posición</th>
            <th>Asociación</th>
            <th>Criadero</th>
            <th>Jinetes</th>
            <th>Caballos</th>
    `;
    if (displayStage === 1) {
        theadHtml += `<th>1er Animal</th>`;
    } else if (displayStage === 2) {
        theadHtml += `<th>1er Animal</th><th>2do Animal</th><th>Sub Total</th>`;
    } else if (displayStage === 3) {
        theadHtml += `<th>1er Animal</th><th>2do Animal</th><th>3er Animal</th><th>Sub Total</th>`;
    } else if (displayStage === 4) {
        theadHtml += `<th>1er Animal</th><th>2do Animal</th><th>3er Animal</th><th>4to Animal</th><th>Resultado</th><th>Empates</th><th>Lugar</th>`;
    }
    theadHtml += `</tr>`;
    
    if (thead) thead.innerHTML = theadHtml;
    tbody.innerHTML = "";

    let filteredData = data.filter(row => {
        if (isTotalMode || stage === 1) return parseInt(row.animal1) > -100 || typeof row.animal1 === 'number'; 
        if (stage === 2) return row.animal2 !== "X" && row.animal2 !== "x" && row.animal2 !== "" && !row.animal2.toString().includes("LESION") && !row.animal2.toString().includes("NO");
        if (stage === 3) return row.animal3 !== "X" && row.animal3 !== "x" && row.animal3 !== "" && !row.animal3.toString().includes("LESION") && !row.animal3.toString().includes("NO");
        if (stage === 4) return row.animal4 !== "X" && row.animal4 !== "x" && row.animal4 !== "" && !row.animal4.toString().includes("LESION") && !row.animal4.toString().includes("NO");
        return true;
    });

    const sortedData = filteredData.sort((a, b) => {
        let scoreA = isTotalMode ? getFinalScore(a) : getScoreForStage(a, stage);
        let scoreB = isTotalMode ? getFinalScore(b) : getScoreForStage(b, stage);
        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }
        return a.n - b.n;
    });

    sortedData.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        let pos = index + 1;
        let rankBadge = "";
        if (pos === 1) rankBadge = "🏆 1° Lugar";
        else if (pos === 2) rankBadge = "🥈 2° Lugar";
        else if (pos === 3) rankBadge = "🥉 3° Lugar";
        else rankBadge = `${pos}° Lugar`;
        
        // Jinetes formatting
        const jinetesHtml = row.jinetes.map(j => `<span class="jinete-item">${j}</span>`).join('');
        
        // Caballos formatting (como link a su genealogía)
        const caballosHtml = row.caballos.map(c => {
            const slug = c.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
            return `<a href="genealogia.html#${slug}" class="caballo-item caballo-link">${c}</a>`;
        }).join('');

        let trHtml = `
            <td data-label="Posición">
                <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-color); margin-bottom: 2px;">${rankBadge}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Collera Nº ${row.n}</div>
            </td>
            <td data-label="Asociación">${row.asociacion}</td>
            <td data-label="Criadero">${row.criadero}</td>
            <td data-label="Jinetes" class="td-jinetes"><div class="jinetes-list">${jinetesHtml}</div></td>
            <td data-label="Caballos" class="td-caballos"><div class="caballos-list">${caballosHtml}</div></td>
            <td data-label="1er Animal">${formatScore(row.animal1)}</td>
        `;

        if (displayStage === 2) {
            trHtml += `
                <td data-label="2do Animal">${formatScore(row.animal2)}</td>
                <td data-label="Sub Total">${formatScore(row.sub1)}</td>
            `;
        } else if (displayStage === 3) {
            trHtml += `
                <td data-label="2do Animal">${formatScore(row.animal2)}</td>
                <td data-label="3er Animal">${formatScore(row.animal3)}</td>
                <td data-label="Sub Total">${formatScore(row.sub2)}</td>
            `;
        } else if (displayStage === 4) {
            trHtml += `
                <td data-label="2do Animal">${formatScore(row.animal2)}</td>
                <td data-label="3er Animal">${formatScore(row.animal3)}</td>
                <td data-label="4to Animal">${formatScore(row.animal4)}</td>
                <td data-label="Resultado" class="td-resultado">${formatScore(isTotalMode ? getFinalScore(row) : row.resultado)}</td>
                <td data-label="Empates">${formatScore(row.empates)}</td>
                <td data-label="Lugar" class="td-lugar">${row.lugar}</td>
            `;
        }

        tr.innerHTML = trHtml;
        
        tbody.appendChild(tr);
    });
}

function renderChart(data, stage = 4) {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe para evitar superposiciones
    if (window.myChart) {
        window.myChart.destroy();
    }

    const isTotalMode = stage === "total";

    // Filtrar usando exactamente la misma lógica de la tabla
    const filteredData = data.filter(row => {
        if (isTotalMode || stage === 1) return parseInt(row.animal1) > -100 || typeof row.animal1 === 'number'; 
        if (stage === 2) return row.animal2 !== "X" && row.animal2 !== "x" && row.animal2 !== "" && !row.animal2.toString().includes("LESION") && !row.animal2.toString().includes("NO");
        if (stage === 3) return row.animal3 !== "X" && row.animal3 !== "x" && row.animal3 !== "" && !row.animal3.toString().includes("LESION") && !row.animal3.toString().includes("NO");
        if (stage === 4) return row.animal4 !== "X" && row.animal4 !== "x" && row.animal4 !== "" && !row.animal4.toString().includes("LESION") && !row.animal4.toString().includes("NO");
        return true;
    });

    // Ordenar para el gráfico (mismo orden que la tabla)
    const sortedData = [...filteredData].sort((a, b) => {
        let scoreA = isTotalMode ? getFinalScore(a) : getScoreForStage(a, stage);
        let scoreB = isTotalMode ? getFinalScore(b) : getScoreForStage(b, stage);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.n - b.n;
    });

    // Ajustar la altura del contenedor dinámicamente según la cantidad de colleras
    const parent = ctx.parentElement;
    if (parent) {
        parent.style.height = `${Math.max(300, sortedData.length * 30)}px`;
    }

    const labels = sortedData.map(d => {
        let score = isTotalMode ? getFinalScore(d) : getScoreForStage(d, stage);
        let baseLabel = `${d.jinetes.join(' / ')} (Nº ${d.n})`;
        if (score < 0) {
            return `${baseLabel} (${score} pts)`;
        }
        return baseLabel;
    });
    const scores = sortedData.map(d => {
        let val = isTotalMode ? getFinalScore(d) : getScoreForStage(d, stage);
        return val < 0 ? 0 : val; // Convertir puntajes negativos a 0 para que no dibuje barras hacia la izquierda
    });

    let labelName = 'Puntaje Final';
    if (isTotalMode) labelName = 'Puntaje Acumulado';
    else if (stage === 1) labelName = 'Puntaje 1er Animal';
    else if (stage === 2) labelName = 'Puntaje Acum. (2 Animales)';
    else if (stage === 3) labelName = 'Puntaje Acum. (3 Animales)';

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: labelName,
                data: scores,
                backgroundColor: 'rgba(216, 67, 21, 0.85)',
                borderColor: '#bf360c',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            layout: {
                padding: {
                    top: 10,
                    bottom: 30, // Margen extra abajo para evitar recortes de nombres
                    left: 10,
                    right: 20
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Puntos' }
                },
                y: {
                    ticks: {
                        autoSkip: false, // Forzar a mostrar todas las etiquetas
                        font: {
                            size: 10,
                            family: 'system-ui'
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

async function initRodeoData() {
    if (supabaseClient) {
        try {
            // Leer colleras desde Supabase en tiempo real
            const { data, error } = await supabaseClient.from('colleras').select('*').order('n');
            if (!error && data && data.length > 0) {
                rodeoData = data;
                try {
                    localStorage.setItem('rodeoData', JSON.stringify(rodeoData));
                } catch(e) {
                    console.error(e);
                }
            } else {
                loadBackupLocalRodeoData();
            }
        } catch(err) {
            console.error("Error al cargar colleras de Supabase:", err);
            loadBackupLocalRodeoData();
        }
    } else {
        loadBackupLocalRodeoData();
    }

    // Renderizar una vez cargados los datos
    const isToroPage = document.body.getAttribute('data-toro');
    if (isToroPage) {
        const stage = parseInt(isToroPage);
        renderTable(rodeoData, stage);
        renderChart(rodeoData, stage);
    } else {
        analyzeData(rodeoData);
        renderChart(rodeoData, "total");
        renderTable(rodeoData, "total");
    }
}

function loadBackupLocalRodeoData() {
    let localData = null;
    try {
        localData = JSON.parse(localStorage.getItem('rodeoData'));
    } catch(e) {
        console.error("Error al parsear localStorage:", e);
    }
    if (!localData || localData.length === 0) {
        localData = defaultRodeoData;
        try {
            localStorage.setItem('rodeoData', JSON.stringify(localData));
        } catch(e) {
            console.error(e);
        }
    }
    rodeoData = localData;
}

    // Custom Smooth Scroll para el menú (un poco más lento)
    document.querySelectorAll('.nav-btn').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Si no tiene '#' es un enlace a otra página, no hacemos preventDefault
            if (!href.includes('#')) return;
            
            const targetId = href.split('#')[1];
            const targetElement = document.getElementById(targetId);
            
            // Si el elemento no existe en esta página (porque es enlace a index.html desde otra), dejamos que navegue normal
            if (!targetElement) return;

            // Si el elemento existe en esta página, interceptamos el click y hacemos el scroll suave
            e.preventDefault();
            
            const elementRect = targetElement.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.scrollY;
            const elementHeight = elementRect.height;
            const windowHeight = window.innerHeight;
            const headerHeight = document.querySelector('.app-header')?.offsetHeight || 80;
            
            const availableHeight = windowHeight - headerHeight;
            let targetPosition = absoluteElementTop - headerHeight - (availableHeight - elementHeight) / 2;
            
            if (elementHeight > availableHeight) {
                targetPosition = absoluteElementTop - headerHeight - 20; // 20px de margen arriba si no cabe
            }
            
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = 540; // 540ms
            let start = null;

            window.requestAnimationFrame(function step(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                
                // Función easeInOutQuad
                const ease = progress < duration / 2 
                    ? 2 * Math.pow(progress / duration, 2) 
                    : 1 - Math.pow(-2 * progress / duration + 2, 2) / 2;
                
                window.scrollTo(0, startPosition + distance * ease);
                
                if (progress < duration) {
                    window.requestAnimationFrame(step);
                } else {
                    window.scrollTo(0, targetPosition);
                }
            });
        });
    });

// ==========================================================================
// SISTEMA DE SOCIOS Y CONTROL DE ACCESO (Supabase Real-Time Connection)
// ==========================================================================

// Configuración de Supabase
const SUPABASE_URL = "https://hphtzcuwyixcxpaskprj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__swYk_OxwILPUBbsAk9YKQ_EEH_ZDe_";

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Inicializar interfaz y verificar permisos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    updateHeaderAuthUI();
    await checkPageAccess();
    createLoginModalDOM();
    await initRodeoData();
});

// Función para actualizar los botones de login/perfil en la barra de navegación
function updateHeaderAuthUI() {
    const navs = document.querySelectorAll('.header-nav');
    navs.forEach(nav => {
        // Remover el botón de Flow (Hacerse Socio) si está en el HTML para despejar la barra
        const flowUrl = "https://www.flow.cl/btn.php?token=t72149f43e71af43c82f6f67fdf40c375fa191cb";
        const flowBtn = nav.querySelector(`a[href="${flowUrl}"]`);
        if (flowBtn) {
            const prevSibling = flowBtn.previousElementSibling;
            if (prevSibling && prevSibling.classList.contains('nav-divider')) {
                prevSibling.remove();
            }
            flowBtn.remove();
        }

        // Remover botón previo si existe
        const prevBtn = nav.querySelector('.nav-auth-wrapper');
        if (prevBtn) prevBtn.remove();

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const authWrapper = document.createElement('div');
        authWrapper.className = 'nav-auth-wrapper';
        authWrapper.style.display = 'inline-flex';
        authWrapper.style.alignItems = 'center';
        authWrapper.style.gap = '8px';

        if (currentUser) {
            const displayName = currentUser.nombre ? currentUser.nombre.toUpperCase() : currentUser.email.split('@')[0].toUpperCase();
            authWrapper.innerHTML = `
                <div class="profile-dropdown" style="position: relative; display: inline-block;">
                    <button onclick="toggleProfileDropdown(event)" class="nav-btn" style="background: rgba(255, 255, 255, 0.03); color: #e0d5c1; border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 0.35rem 0.85rem; border-radius: 22px; font-family: inherit; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='rgba(255,255,255,0.25)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.03)'; this.style.borderColor='rgba(255,255,255,0.12)';">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.8rem; font-family: sans-serif; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${displayName.charAt(0)}</div>
                        <span style="font-weight: 700; font-size: 0.85rem; letter-spacing: 0.02em;">${displayName}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px; display: block;"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div id="profile-dropdown-menu" style="display: none; position: absolute; right: 0; top: 115%; background: #1c1412; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 2000; min-width: 160px; overflow: hidden; font-family: inherit;">
                        <a href="#" onclick="openAccountPlanModal(event)" style="display: block; padding: 10px 16px; color: #e0d5c1; text-decoration: none; font-size: 0.82rem; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; white-space: nowrap;">Plan de Cuenta</a>
                        <a href="#" onclick="openEditProfileModal(event)" style="display: block; padding: 10px 16px; color: #e0d5c1; text-decoration: none; font-size: 0.82rem; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; white-space: nowrap;">Editar Datos</a>
                        <a href="#" onclick="handleLogout(event)" style="display: block; padding: 10px 16px; color: #ef9a9a; text-decoration: none; font-size: 0.82rem; font-weight: 700; transition: background 0.2s; white-space: nowrap;">Cerrar Sesión</a>
                    </div>
                </div>
            `;
        } else {
            authWrapper.innerHTML = `
                <div class="auth-dropdown" style="position: relative; display: inline-block;">
                    <button onclick="toggleAuthDropdown(event)" class="nav-btn" style="background: rgba(230, 81, 0, 0.15); color: #ffb74d; font-weight: 700; border: 1px solid rgba(230, 81, 0, 0.5); padding: 0.45rem 1.1rem; box-shadow: 0 0 10px rgba(230,81,0,0.15); border-radius: 22px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit;">
                        👤 Ingresar
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,183,77,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px; display: block;"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div id="auth-dropdown-menu" style="display: none; position: absolute; right: 0; top: 115%; background: #1c1412; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.6); z-index: 2000; min-width: 240px; padding: 20px; font-family: inherit; text-align: center; box-sizing: border-box;">
                        <button onclick="openLoginModalFromDropdown('login')" style="width: 100%; padding: 10px 16px; background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); color: white; border: none; font-weight: 700; cursor: pointer; border-radius: 22px; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(230,81,0,0.3); margin-bottom: 12px; transition: all 0.2s; font-family: inherit;">Inicia sesión</button>
                        
                        <div style="color: #e0d5c1; font-size: 0.8rem; margin-bottom: 16px; font-family: inherit;">
                            ¿No tienes cuenta? <a href="#" onclick="openLoginModalFromDropdown('register')" style="color: #ffb74d; text-decoration: underline; font-weight: 700; font-family: inherit;">Crea una</a>
                        </div>
                        
                        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; text-align: left; font-family: inherit;">
                            <a href="https://wa.me/56944363150?text=Hola,%20necesito%20ayuda%20con%20Corral%20Abierto" target="_blank" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none; color: #e0d5c1; font-size: 0.8rem; font-weight: 600; padding: 4px 2px; transition: color 0.2s; font-family: inherit;" onmouseover="this.style.color='#ffb74d'" onmouseout="this.style.color='#e0d5c1'">
                                <span>¿Necesitas ayuda?</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        nav.appendChild(authWrapper);
    });
}

// Bloquear el acceso a páginas premium si no es socio activo
async function checkPageAccess() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);

    // Permitir index.html y admin.html libremente (admin tiene su propia clave)
    if (page === '' || page === 'index.html' || page === 'admin.html') {
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch(e) {}
    
    let isSocioActivo = false;

    // Si no hay sesión local pero hay sesión activa de administrador en Supabase, la sincronizamos
    if (!currentUser && supabaseClient) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user && session.user.email === 'admin@corralabierto.cl') {
                currentUser = {
                    email: session.user.email,
                    active: true,
                    nombre: "ADMINISTRADOR",
                    apellido: "PRINCIPAL"
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        } catch(err) {
            console.error(err);
        }
    }

    // Si el usuario es el administrador principal, tiene acceso total e ilimitado
    if (currentUser && currentUser.email === 'admin@corralabierto.cl') {
        isSocioActivo = true;
    } else if (currentUser && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('members')
                .select('active')
                .eq('email', currentUser.email)
                .maybeSingle();
            
            if (data) {
                isSocioActivo = data.active === true;
                // Sincronizar estado local por si cambió
                currentUser.active = data.active;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                isSocioActivo = false;
                currentUser.active = false;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        } catch (e) {
            console.error("Error verificando membresía en Supabase: ", e);
        }
    }

    if (!isSocioActivo) {
        // Ocultar el contenido principal
        const main = document.querySelector('.main-content');
        if (main) {
            main.style.display = 'none';
        }

        // Crear pantalla de bloqueo (Lock Screen)
        const lockScreen = document.createElement('div');
        lockScreen.id = 'page-lock-screen';
        lockScreen.style.position = 'fixed';
        lockScreen.style.top = '80px'; // Debajo del header
        lockScreen.style.left = '0';
        lockScreen.style.right = '0';
        lockScreen.style.bottom = '0';
        lockScreen.style.background = 'rgba(20, 12, 10, 0.95)';
        lockScreen.style.backdropFilter = 'blur(10px)';
        lockScreen.style.display = 'flex';
        lockScreen.style.flexDirection = 'column';
        lockScreen.style.alignItems = 'center';
        lockScreen.style.justifyContent = 'center';
        lockScreen.style.textAlign = 'center';
        lockScreen.style.padding = '2rem';
        lockScreen.style.zIndex = '1000';

        const flowUrl = "https://www.flow.cl/btn.php?token=t72149f43e71af43c82f6f67fdf40c375fa191cb";

        lockScreen.innerHTML = `
            <div style="max-width: 550px; background: linear-gradient(145deg, rgba(38, 24, 21, 0.9) 0%, rgba(20, 12, 10, 0.95) 100%); padding: 3rem 2rem; border-radius: 20px; border: 1px solid rgba(230, 81, 0, 0.25); box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
                <span style="font-size: 4rem;">🔒</span>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 2rem; color: #ff5722; margin: 1.5rem 0 1rem 0; font-weight:800;">Contenido Exclusivo para Socios</h2>
                <p style="color: #e0d5c1; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
                    Para ver los resultados en vivo animal por animal, anuarios completos y fichas morfológicas detalladas, necesitas una cuenta de Socio Activo de Corral Abierto.
                </p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <a href="${flowUrl}" target="_blank" class="nav-btn" style="background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); color: white; border: none; font-weight: 700; padding: 12px 24px; text-transform: uppercase; border-radius: 8px; font-size: 0.95rem; text-decoration: none; box-shadow: 0 4px 15px rgba(230,81,0,0.4);">Hacerse Socio de Temporada 🐴</a>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin: 8px 0;">¿Ya tienes una cuenta o ya pagaste?</div>
                    <button onclick="openLoginModal(event)" class="nav-btn" style="background: rgba(255,255,255,0.1); color: #fff; font-weight: 600; border: 1px solid rgba(255,255,255,0.25); padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; text-transform: uppercase;">Iniciar Sesión / Crear Cuenta</button>
                </div>
            </div>
        `;
        document.body.appendChild(lockScreen);
    }
}

// Crear el Modal de Login en el DOM
function createLoginModalDOM() {
    if (document.getElementById('auth-modal-overlay')) return;

    // Inyectar estilos responsivos y de spinner para el modal split
    if (!document.getElementById('auth-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.innerHTML = `
            @keyframes auth-spin {
                to { transform: rotate(360deg); }
            }
            .auth-loading-spinner {
                display: inline-block;
                width: 18px;
                height: 18px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: auth-spin 0.8s linear infinite;
                vertical-align: middle;
            }
            @media (max-width: 768px) {
                .auth-banner-left {
                    display: none !important;
                }
                #auth-form-column {
                    width: 100% !important;
                    padding: 30px 20px !important;
                }
                #auth-modal-overlay > div {
                    height: auto !important;
                    max-height: 95vh;
                    overflow-y: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.id = 'auth-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.backdropFilter = 'blur(6px)';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '3000';

    overlay.innerHTML = `
        <div class="auth-modal-card" style="background: #1c1412; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 90%; max-width: 820px; height: 550px; box-shadow: 0 25px 60px rgba(0,0,0,0.85); overflow: hidden; position: relative; display: flex; box-sizing: border-box;">
            <!-- Botón de Cerrar (X) -->
            <button onclick="closeLoginModal()" style="position: absolute; right: 16px; top: 16px; background: rgba(0,0,0,0.3); border: none; color: rgba(255,255,255,0.6); cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; line-height: 1; z-index: 100; transition: all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.5)'; this.style.color='#ffb74d'" onmouseout="this.style.background='rgba(0,0,0,0.3)'; this.style.color='rgba(255,255,255,0.6)'">&times;</button>
            
            <!-- Banner de Imagen Izquierdo (Oculto en móvil) -->
            <div class="auth-banner-left" style="width: 42%; background: linear-gradient(to right, rgba(20,12,10,0.1) 0%, rgba(20,12,10,0.95) 100%), url('champion_huasos.jpg'); background-size: cover; background-position: center; display: block; flex-shrink: 0; position: relative;">
                <div style="position: absolute; bottom: 30px; left: 35px; right: 25px; z-index: 2;">
                    <h4 style="font-family: 'Playfair Display', serif; font-size: 1.8rem; color: #ff5722; margin: 0 0 8px 0; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">Corral Abierto</h4>
                    <p style="color: #e0d5c1; font-size: 0.85rem; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,0.8); line-height: 1.45;">Comencemos tu historia con nosotros. Accede a resultados en vivo, genealogía y más.</p>
                </div>
            </div>
            
            <!-- Contenido del Formulario Derecho -->
            <div style="width: 58%; padding: 40px 35px 30px 35px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; position: relative;" id="auth-form-column">
                <!-- Formulario Iniciar Sesión -->
                <div id="auth-view-login" style="display: block; width: 100%;">
                    <h3 style="font-family: 'Playfair Display', serif; font-size: 1.6rem; color: #ff5722; margin: 0 0 6px 0; font-weight: 800;">Iniciar Sesión</h3>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0 0 24px 0;">Ingresa tus credenciales para acceder</p>
                    
                    <form id="form-auth-login" onsubmit="submitLogin(event)">
                        <div style="margin-bottom: 16px;">
                            <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Correo Electrónico</label>
                            <input type="email" id="auth-login-email" required style="width:100%; padding:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="ejemplo@correo.com">
                        </div>
                        <div style="margin-bottom: 24px;">
                            <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Contraseña</label>
                            <div style="position: relative;">
                                <input type="password" id="auth-login-pass" required style="width:100%; padding:11px 40px 11px 11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="••••••••">
                                <button type="button" onclick="togglePasswordVisibility('auth-login-pass', this)" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" onmouseover="this.style.color='rgba(255,255,255,0.8)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                            </div>
                        </div>
                        <button type="submit" id="btn-login-submit" class="nav-btn" style="width:100%; padding: 12px; background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); color: white; border: none; font-weight: 700; cursor:pointer; border-radius: 22px; text-transform: uppercase; font-size:0.85rem; box-shadow: 0 4px 12px rgba(230,81,0,0.35); font-family: inherit;">Ingresar</button>
                    </form>
                    
                    <div style="margin-top: 24px; text-align: center; color: #e0d5c1; font-size: 0.85rem;">
                        ¿No tienes cuenta? <a href="#" onclick="switchAuthView('register')" style="color: #ffb74d; text-decoration: underline; font-weight: 700;">Regístrate</a>
                    </div>
                </div>
                
                <!-- Formulario Registro Multitrabajo -->
                <div id="auth-view-register" style="display: none; width: 100%;">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #ff5722; margin:0; font-weight: 800;">Crear Cuenta</h3>
                        <span id="register-step-indicator" style="font-size: 0.72rem; color: #ffb74d; font-weight: 700; background: rgba(230,81,0,0.15); padding: 4px 10px; border-radius: 12px;">Paso 1 de 3</span>
                    </div>
                    <p id="register-step-title" style="color: var(--text-muted); font-size: 0.82rem; margin: 0 0 20px 0;">Comencemos tu historia con Corral Abierto</p>
                    
                    <form id="form-auth-register" onsubmit="handleRegisterNext(event)">
                        <!-- PASO 1: Datos de Contacto -->
                        <div id="reg-step-1" style="display: block;">
                            <div style="margin-bottom: 16px;">
                                <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Correo Electrónico</label>
                                <input type="email" id="auth-register-email" style="width:100%; padding:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="ejemplo@correo.com">
                            </div>
                            <div style="margin-bottom: 24px;">
                                <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Teléfono</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" readonly style="width: 80px; padding:11px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#aaa; font-family:inherit; text-align:center; box-sizing: border-box;" value="+56">
                                    <input type="tel" id="auth-register-telefono" style="flex:1; padding:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="944362579" pattern="[0-9]{9}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- PASO 2: Identidad -->
                        <div id="reg-step-2" style="display: none;">
                            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                                <div style="flex: 1;">
                                    <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Nombre</label>
                                    <input type="text" id="auth-register-nombre" style="width:100%; padding:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="Juan">
                                </div>
                                <div style="flex: 1;">
                                    <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Apellido</label>
                                    <input type="text" id="auth-register-apellido" style="width:100%; padding:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="Pérez">
                                </div>
                            </div>
                            <div style="margin-bottom: 24px;">
                                <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Fecha de Nacimiento</label>
                                <input type="date" id="auth-register-nacimiento" style="width:100%; padding:11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box; color-scheme: dark;">
                            </div>
                        </div>
                        
                        <!-- PASO 3: Clave & Términos -->
                        <div id="reg-step-3" style="display: none;">
                            <div style="margin-bottom: 14px;">
                                <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Contraseña</label>
                                <div style="position: relative;">
                                    <input type="password" id="auth-register-pass" style="width:100%; padding:11px 40px 11px 11px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" placeholder="Mínimo 6 caracteres" minlength="6">
                                    <button type="button" onclick="togglePasswordVisibility('auth-register-pass', this)" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" onmouseover="this.style.color='rgba(255,255,255,0.8)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                                </div>
                            </div>
                            <div style="margin-bottom: 20px; display: flex; align-items: flex-start; gap: 8px;">
                                <input type="checkbox" id="auth-register-terms" style="margin-top: 3px; cursor: pointer; width:16px; height:16px;">
                                <label for="auth-register-terms" style="color: #e0d5c1; font-size: 0.78rem; cursor: pointer; line-height: 1.3;">Acepto los términos, condiciones y políticas de privacidad de Corral Abierto.</label>
                            </div>
                        </div>
                        
                        <!-- Botón de Navegación de Registro -->
                        <button type="submit" id="btn-register-action" class="nav-btn" style="width:100%; padding: 12px; background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); color: white; border: none; font-weight: 700; cursor:pointer; border-radius: 22px; text-transform: uppercase; font-size:0.85rem; box-shadow: 0 4px 12px rgba(230,81,0,0.35); font-family: inherit;">Siguiente</button>
                    </form>
                    
                    <div style="margin-top: 20px; text-align: center; color: #e0d5c1; font-size: 0.85rem;">
                        ¿Tienes cuenta? <a href="#" onclick="switchAuthView('login')" style="color: #ffb74d; text-decoration: underline; font-weight: 700;">Inicia sesión</a>
                    </div>
                </div>
                
                <div id="auth-msg" style="margin-top: 14px; text-align:center; font-size:0.82rem; display:none; line-height: 1.4;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Abrir el Modal de Login
function openLoginModal(e) {
    if (e) e.preventDefault();
    createLoginModalDOM();
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        switchAuthView('login');
        // Pequeño retardo para disparar la animación de escala y opacidad
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    }
}

// Cerrar el Modal de Login
function closeLoginModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        // Esperar a que termine la animación antes de quitar el display flex
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 280);
    }
}

let currentRegisterStep = 1;

// Cambiar de vistas en el modal de autenticación (Login vs Registro)
function switchAuthView(view) {
    const loginView = document.getElementById('auth-view-login');
    const registerView = document.getElementById('auth-view-register');
    const msg = document.getElementById('auth-msg');
    if (msg) msg.style.display = 'none';

    if (view === 'login') {
        if (loginView) loginView.style.display = 'block';
        if (registerView) registerView.style.display = 'none';
    } else {
        if (loginView) loginView.style.display = 'none';
        if (registerView) registerView.style.display = 'block';
        currentRegisterStep = 1;
        renderRegisterStep(1);
    }
}

// Renderizar el paso del registro

// Renderizar el paso del registro
function renderRegisterStep(step) {
    const step1 = document.getElementById('reg-step-1');
    const step2 = document.getElementById('reg-step-2');
    const step3 = document.getElementById('reg-step-3');
    
    if (step1) step1.style.display = step === 1 ? 'block' : 'none';
    if (step2) step2.style.display = step === 2 ? 'block' : 'none';
    if (step3) step3.style.display = step === 3 ? 'block' : 'none';

    const indicator = document.getElementById('register-step-indicator');
    const stepTitle = document.getElementById('register-step-title');
    const btnAction = document.getElementById('btn-register-action');

    if (step === 1) {
        if (indicator) indicator.innerText = "Paso 1 de 3";
        if (stepTitle) stepTitle.innerText = "Comencemos tu historia con Corral Abierto";
        if (btnAction) btnAction.innerText = "Siguiente";
    } else if (step === 2) {
        if (indicator) indicator.innerText = "Paso 2 de 3";
        if (stepTitle) stepTitle.innerText = "&#191;Cu&aacute;l es tu nombre?";
        if (btnAction) btnAction.innerText = "Siguiente";
    } else if (step === 3) {
        if (indicator) indicator.innerText = "Paso 3 de 3";
        if (stepTitle) stepTitle.innerText = "Ahora, crea tu contrase&ntilde;a";
        if (btnAction) btnAction.innerText = "Crear Cuenta";
    }
}

// Manejar avance de pasos
async function handleRegisterNext(e) {
    e.preventDefault();
    const msg = document.getElementById('auth-msg');
    if (msg) msg.style.display = 'none';

    if (currentRegisterStep === 1) {
        const email = document.getElementById('auth-register-email').value.trim();
        const telefono = document.getElementById('auth-register-telefono').value.trim();
        if (!email || !telefono) {
            showAuthError("Por favor completa los campos de contacto.");
            return;
        }
        currentRegisterStep = 2;
        renderRegisterStep(2);
    } else if (currentRegisterStep === 2) {
        const nombre = document.getElementById('auth-register-nombre').value.trim();
        const apellido = document.getElementById('auth-register-apellido').value.trim();
        const nacimiento = document.getElementById('auth-register-nacimiento').value;
        if (!nombre || !apellido || !nacimiento) {
            showAuthError("Por favor completa tus datos de identidad.");
            return;
        }
        currentRegisterStep = 3;
        renderRegisterStep(3);
    } else if (currentRegisterStep === 3) {
        const terms = document.getElementById('auth-register-terms').checked;
        if (!terms) {
            showAuthError("Debes aceptar los t&eacute;rminos y condiciones para crear tu cuenta.");
            return;
        }
        // Ejecutar registro real
        await submitRegister(e);
    }
}

function showAuthError(text) {
    const msg = document.getElementById('auth-msg');
    if (msg) {
        msg.style.color = '#ff8a80';
        msg.innerText = text;
        msg.style.display = 'block';
    }
}

// Controlar el estado de carga y bloqueo de los formularios de autenticación
function setAuthLoading(isLoading, formId, buttonId, originalText) {
    const form = document.getElementById(formId);
    const button = document.getElementById(buttonId);
    if (!form || !button) return;

    // Deshabilitar o habilitar inputs del formulario
    const elements = form.querySelectorAll('input, button');
    elements.forEach(el => {
        el.disabled = isLoading;
        if (isLoading) {
            el.style.opacity = '0.5';
            el.style.cursor = 'not-allowed';
        } else {
            el.style.opacity = '1';
            el.style.cursor = '';
        }
    });

    // Asegurar que el botón de cerrar modal del fondo no se deshabilite
    const closeBtn = document.querySelector('#auth-modal-overlay button[onclick="closeLoginModal()"]');
    if (closeBtn) {
        closeBtn.disabled = false;
        closeBtn.style.opacity = '1';
        closeBtn.style.cursor = 'pointer';
    }

    if (isLoading) {
        button.innerHTML = `<span class="auth-loading-spinner"></span>`;
        button.disabled = true;
        button.style.cursor = 'not-allowed';
    } else {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.cursor = 'pointer';
    }
}

// Enviar Login a Supabase
async function submitLogin(e) {
    e.preventDefault();
    const email = document.getElementById('auth-login-email').value.trim().toLowerCase();
    const pass = document.getElementById('auth-login-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!supabaseClient) {
        msg.style.color = '#ff8a80';
        msg.innerText = "Error: No se pudo conectar con el servicio de autenticación.";
        msg.style.display = 'block';
        return;
    }

    if (msg) msg.style.display = 'none';
    setAuthLoading(true, 'form-auth-login', 'btn-login-submit', 'Ingresar');

    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: pass
        });

        if (authError) {
            setAuthLoading(false, 'form-auth-login', 'btn-login-submit', 'Ingresar');
            msg.style.color = '#ff8a80';
            msg.innerText = "Correo o contraseña incorrectos. Intente nuevamente.";
            msg.style.display = 'block';
            return;
        }

        // Login de Auth exitoso, ahora verificar si está activo en la tabla members
        const { data: memberData, error: dbError } = await supabaseClient
            .from('members')
            .select('active, nombre, apellido, fecha_nacimiento')
            .eq('email', email)
            .maybeSingle();

        if (dbError) {
            setAuthLoading(false, 'form-auth-login', 'btn-login-submit', 'Ingresar');
            msg.style.color = '#ff8a80';
            msg.innerText = "Error al consultar estado de membresía: " + dbError.message;
            msg.style.display = 'block';
            return;
        }

        // Permitir inicio de sesión local para todos, pero guardando si están activos o no
        const isActive = (email === 'admin@corralabierto.cl') || (memberData && memberData.active === true);
        const userSessionObj = { 
            email: email, 
            active: isActive,
            nombre: memberData ? memberData.nombre : (email === 'admin@corralabierto.cl' ? 'ADMINISTRADOR' : ''),
            apellido: memberData ? memberData.apellido : '',
            fecha_nacimiento: memberData ? memberData.fecha_nacimiento : ''
        };
        localStorage.setItem('currentUser', JSON.stringify(userSessionObj));
        
        msg.style.color = '#a5d6a7';
        msg.innerText = "¡Ingreso correcto! Redirigiendo...";
        msg.style.display = 'block';
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (err) {
        setAuthLoading(false, 'form-auth-login', 'btn-login-submit', 'Ingresar');
        msg.style.color = '#ff8a80';
        msg.innerText = "Ocurrió un error inesperado al intentar iniciar sesión.";
        msg.style.display = 'block';
        console.error(err);
    }
}

// Registrar en Supabase
async function submitRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById('auth-register-nombre').value.trim();
    const apellido = document.getElementById('auth-register-apellido').value.trim();
    const nacimiento = document.getElementById('auth-register-nacimiento').value;
    const email = document.getElementById('auth-register-email').value.trim().toLowerCase();
    const telefono = document.getElementById('auth-register-telefono').value.trim();
    const pass = document.getElementById('auth-register-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!supabaseClient) {
        msg.style.color = '#ff8a80';
        msg.innerText = "Error: No se pudo conectar con el servicio de autenticación.";
        msg.style.display = 'block';
        return;
    }

    if (msg) msg.style.display = 'none';
    setAuthLoading(true, 'form-auth-register', 'btn-register-action', 'Crear Cuenta');

    try {
        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: pass,
            options: {
                data: {
                    nombre: nombre,
                    apellido: apellido,
                    fecha_nacimiento: nacimiento,
                    telefono: telefono
                }
            }
        });

        if (authError) {
            setAuthLoading(false, 'form-auth-register', 'btn-register-action', 'Crear Cuenta');
            msg.style.color = '#ff8a80';
            msg.innerText = "Error al crear cuenta: " + authError.message;
            msg.style.display = 'block';
            return;
        }

        // 2. Insertar fila de control en la tabla members
        const { error: dbError } = await supabaseClient
            .from('members')
            .insert([{ 
                email: email, 
                active: false,
                nombre: nombre,
                apellido: apellido,
                fecha_nacimiento: nacimiento,
                telefono: telefono
            }]);

        if (dbError) {
            setAuthLoading(false, 'form-auth-register', 'btn-register-action', 'Crear Cuenta');
            msg.style.color = '#ffb74d';
            msg.innerText = "Usuario creado, pero hubo un problema al guardar la membresía. Contacta soporte.";
            msg.style.display = 'block';
            console.error(dbError);
            return;
        }

        // Iniciar sesión localmente en estado inactivo (Pendiente de pago) de forma automática
        const userSessionObj = { 
            email: email, 
            active: false,
            nombre: nombre,
            apellido: apellido,
            fecha_nacimiento: nacimiento,
            telefono: telefono
        };
        localStorage.setItem('currentUser', JSON.stringify(userSessionObj));

        msg.style.color = '#a5d6a7';
        msg.innerHTML = `¡Cuenta creada e ingresada con éxito!<br><span style="color:#ffb74d; font-weight:700;">Estado: PENDIENTE DE PAGO.</span><br>Redirigiendo...`;
        msg.style.display = 'block';

        // Limpiar campos
        document.getElementById('auth-register-nombre').value = '';
        document.getElementById('auth-register-apellido').value = '';
        document.getElementById('auth-register-nacimiento').value = '';
        document.getElementById('auth-register-email').value = '';
        document.getElementById('auth-register-telefono').value = '';
        document.getElementById('auth-register-pass').value = '';

        // Actualizar tabla del admin si está abierta
        if (typeof renderUsuariosTable === 'function') {
            renderUsuariosTable();
        }

        // Redirigir/recargar después de 1.5 segundos para reflejar que inició sesión
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (err) {
        setAuthLoading(false, 'form-auth-register', 'btn-register-action', 'Crear Cuenta');
        msg.style.color = '#ff8a80';
        msg.innerText = "Ocurrió un error inesperado al registrar el usuario.";
        msg.style.display = 'block';
        console.error(err);
    }
}

// Cerrar Sesión en Supabase
async function handleLogout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('currentUser');
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    location.reload();
}

// Alternar visibilidad de contraseña con iconos vectoriales SVG discretos
const EYE_OPEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`;

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = EYE_CLOSED_SVG;
    } else {
        input.type = 'password';
        btn.innerHTML = EYE_OPEN_SVG;
    }
}

// Alternar dropdown del perfil
function toggleProfileDropdown(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Alternar dropdown de ingreso (Logged Out)
function toggleAuthDropdown(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const menu = document.getElementById('auth-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Abrir modal de login desde el dropdown seleccionando pestaña
function openLoginModalFromDropdown(tab) {
    const menu = document.getElementById('auth-dropdown-menu');
    if (menu) menu.style.display = 'none';
    openLoginModal();
    switchAuthView(tab);
}

// Cerrar dropdowns al hacer clic en cualquier otra parte
document.addEventListener('click', (e) => {
    // Dropdown perfil
    const menuProfile = document.getElementById('profile-dropdown-menu');
    if (menuProfile) {
        const isClickInside = e.target.closest('.profile-dropdown');
        if (!isClickInside) {
            menuProfile.style.display = 'none';
        }
    }
    // Dropdown login/registro
    const menuAuth = document.getElementById('auth-dropdown-menu');
    if (menuAuth) {
        const isClickInside = e.target.closest('.auth-dropdown');
        if (!isClickInside) {
            menuAuth.style.display = 'none';
        }
    }
});

// MODAL PLAN DE CUENTA
function openAccountPlanModal(e) {
    if (e) e.preventDefault();
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) menu.style.display = 'none';

    const prevModal = document.getElementById('account-plan-overlay');
    if (prevModal) prevModal.remove();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const overlay = document.createElement('div');
    overlay.id = 'account-plan-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '3000';

    const isAdmin = currentUser.email === 'admin@corralabierto.cl';
    const statusText = isAdmin
        ? '<span style="color:#2e7d32; font-weight:700;">🟢 ADMINISTRADOR (ACCESO TOTAL)</span>'
        : (currentUser.active 
            ? '<span style="color:#2e7d32; font-weight:700;">🟢 SOCIO ACTIVO (ACCESO COMPLETO)</span>'
            : '<span style="color:#c62828; font-weight:700;">🔴 PENDIENTE DE PAGO (ACCESO LIMITADO)</span>');

    const flowUrl = "https://www.flow.cl/btn.php?token=t72149f43e71af43c82f6f67fdf40c375fa191cb";
    const paymentButton = (!currentUser.active && !isAdmin)
        ? `<div style="margin-top: 20px; text-align: center;">
             <a href="${flowUrl}" target="_blank" class="nav-btn" style="background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); color: white; border: none; font-weight: 700; padding: 10px 20px; text-transform: uppercase; border-radius: 8px; font-size: 0.85rem; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(230,81,0,0.3);">Pagar Membresía en Flow 🐴</a>
           </div>`
        : '';

    overlay.innerHTML = `
        <div style="background: #1c1412; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); overflow: hidden; position: relative; padding: 24px;">
            <button onclick="document.getElementById('account-plan-overlay').remove()" style="position: absolute; right: 16px; top: 12px; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 1.6rem; line-height: 1; padding: 4px; z-index: 10; font-family: Arial, sans-serif; transition: color 0.2s;" onmouseover="this.style.color='#ffb74d'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">&times;</button>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #ff5722; margin: 0 0 16px 0; font-weight:800; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">Plan de Cuenta</h3>
            
            <div style="color: #e0d5c1; font-size: 0.9rem; display: flex; flex-direction: column; gap: 12px; line-height: 1.5;">
                <div><strong>Usuario:</strong> ${currentUser.email}</div>
                <div><strong>Nombre Completo:</strong> ${currentUser.nombre || '--'} ${currentUser.apellido || ''}</div>
                <div><strong>Estado de Membresía:</strong> ${statusText}</div>
                ${paymentButton}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// MODAL EDITAR PERFIL
function openEditProfileModal(e) {
    if (e) e.preventDefault();
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) menu.style.display = 'none';

    const prevModal = document.getElementById('edit-profile-overlay');
    if (prevModal) prevModal.remove();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const overlay = document.createElement('div');
    overlay.id = 'edit-profile-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '3000';

    overlay.innerHTML = `
        <div style="background: #1c1412; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); overflow: hidden; position: relative; padding: 24px;">
            <button onclick="document.getElementById('edit-profile-overlay').remove()" style="position: absolute; right: 16px; top: 12px; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 1.6rem; line-height: 1; padding: 4px; z-index: 10; font-family: Arial, sans-serif; transition: color 0.2s;" onmouseover="this.style.color='#ffb74d'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">&times;</button>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #ff5722; margin: 0 0 16px 0; font-weight:800; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">Editar Mis Datos</h3>
            
            <form id="form-edit-profile" onsubmit="submitEditProfile(event)">
                <div style="margin-bottom: 14px;">
                    <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Nombre</label>
                    <input type="text" id="edit-nombre" required style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" value="${currentUser.nombre || ''}">
                </div>
                <div style="margin-bottom: 14px;">
                    <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Apellido</label>
                    <input type="text" id="edit-apellido" required style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" value="${currentUser.apellido || ''}">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; color:#e0d5c1; font-size:0.8rem; margin-bottom: 6px; font-weight:600;">Fecha de Nacimiento</label>
                    <input type="date" id="edit-nacimiento" required style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-family:inherit; box-sizing: border-box;" value="${currentUser.fecha_nacimiento || ''}">
                </div>
                <button type="submit" class="nav-btn" style="width:100%; padding: 12px; background: linear-gradient(135deg, #e65100 0%, #ff5722 100%); color: white; border: none; font-weight: 700; cursor:pointer; border-radius: 8px; text-transform: uppercase; font-size:0.9rem;">Guardar Cambios</button>
                <div id="edit-msg" style="margin-top: 10px; text-align:center; font-size:0.8rem; display:none;"></div>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);
}

// GUARDAR EDICIÓN DE DATOS EN SUPABASE
async function submitEditProfile(e) {
    e.preventDefault();
    const nombre = document.getElementById('edit-nombre').value.trim();
    const apellido = document.getElementById('edit-apellido').value.trim();
    const nacimiento = document.getElementById('edit-nacimiento').value;
    const msg = document.getElementById('edit-msg');

    if (!supabaseClient) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    msg.style.color = '#e0d5c1';
    msg.innerText = "Guardando cambios en Supabase...";
    msg.style.display = 'block';

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({ nombre: nombre, apellido: apellido, fecha_nacimiento: nacimiento })
            .eq('email', currentUser.email);

        if (error) {
            msg.style.color = '#ff8a80';
            msg.innerText = "Error: " + error.message;
            return;
        }

        // Actualizar sesión local
        currentUser.nombre = nombre;
        currentUser.apellido = apellido;
        currentUser.fecha_nacimiento = nacimiento;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        msg.style.color = '#a5d6a7';
        msg.innerText = "¡Datos actualizados con éxito!";
        
        // Recargar interfaz
        updateHeaderAuthUI();
        setTimeout(() => {
            document.getElementById('edit-profile-overlay').remove();
        }, 1000);
    } catch (err) {
        msg.style.color = '#ff8a80';
        msg.innerText = "Error inesperado.";
        console.error(err);
    }
}

