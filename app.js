// ----------------------------------------------------
// STATE MANAGEMENT & LOCAL STORAGE
// ----------------------------------------------------

const STORAGE_KEYS = {
    DISCIPLINAS: 'chronos_disciplinas',
    PROFESSORES: 'chronos_professores',
    TURMAS: 'chronos_turmas',
    TIMETABLE: 'chronos_timetable'
};

const DEFAULT_CONFIG = {
    dias: [2, 3, 4, 5, 6], // 2=Segunda, 6=Sexta
    diasNomes: { 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta' },
    tempos: 7,
    temposHorarios: ["07:10 - 08:00", "08:00 - 08:50", "08:50 - 09:40", "10:10 - 11:00", "11:00 - 11:50", "11:50 - 12:40", "12:40 - 13:30"]
};

let activeConfig = JSON.parse(localStorage.getItem('chronos_config')) || DEFAULT_CONFIG;

// Mock Data para iniciar com uma demonstração premium
const MOCK_DISCIPLINAS = [
    {
        "id": "d_1",
        "nome": "Matemática A",
        "tempos": 2
    },
    {
        "id": "d_2",
        "nome": "Projeto Integrador",
        "tempos": 2
    },
    {
        "id": "d_3",
        "nome": "Gramática",
        "tempos": 2
    },
    {
        "id": "d_4",
        "nome": "Empreendedorismo",
        "tempos": 2
    },
    {
        "id": "d_5",
        "nome": "Projeto Final",
        "tempos": 2
    },
    {
        "id": "d_6",
        "nome": "Matemática B",
        "tempos": 2
    },
    {
        "id": "d_7",
        "nome": "Química",
        "tempos": 2
    },
    {
        "id": "d_8",
        "nome": "História",
        "tempos": 2
    },
    {
        "id": "d_9",
        "nome": "Literatura",
        "tempos": 2
    },
    {
        "id": "d_10",
        "nome": "Inglês",
        "tempos": 2
    },
    {
        "id": "d_11",
        "nome": "Gestão de Pessoas",
        "tempos": 2
    },
    {
        "id": "d_12",
        "nome": "Banco de Dados",
        "tempos": 2
    },
    {
        "id": "d_13",
        "nome": "Física",
        "tempos": 2
    },
    {
        "id": "d_14",
        "nome": "Gestão Marketing",
        "tempos": 2
    },
    {
        "id": "d_15",
        "nome": "Fund. Algoritmos e Estrutura de Dados",
        "tempos": 2
    },
    {
        "id": "d_16",
        "nome": "Ed. Física",
        "tempos": 2
    },
    {
        "id": "d_17",
        "nome": "Geografia",
        "tempos": 2
    },
    {
        "id": "d_18",
        "nome": "Gestão Financeira",
        "tempos": 2
    },
    {
        "id": "d_19",
        "nome": "Sistemas Operacionais",
        "tempos": 2
    },
    {
        "id": "d_20",
        "nome": "Contabilidade/ Custos",
        "tempos": 2
    },
    {
        "id": "d_21",
        "nome": "Redes",
        "tempos": 2
    },
    {
        "id": "d_22",
        "nome": "Artes / Projeto de Vida",
        "tempos": 2
    },
    {
        "id": "d_23",
        "nome": "Filosofia/Sociologia",
        "tempos": 2
    },
    {
        "id": "d_24",
        "nome": "Redação",
        "tempos": 2
    },
    {
        "id": "d_25",
        "nome": "Gestão da Produção",
        "tempos": 2
    },
    {
        "id": "d_26",
        "nome": "Análise e Projeto de Sistemas",
        "tempos": 2
    },
    {
        "id": "d_27",
        "nome": "Matemática Financeira",
        "tempos": 2
    },
    {
        "id": "d_28",
        "nome": "Gestão de Materiais",
        "tempos": 2
    },
    {
        "id": "d_29",
        "nome": "Programação I",
        "tempos": 2
    },
    {
        "id": "d_30",
        "nome": "Biologia",
        "tempos": 2
    },
    {
        "id": "d_31",
        "nome": "Legislação Empresarial",
        "tempos": 2
    },
    {
        "id": "d_32",
        "nome": "Programação II",
        "tempos": 2
    },
    {
        "id": "d_33",
        "nome": "Web Design",
        "tempos": 2
    },
    {
        "id": "d_34",
        "nome": "Fund. de Administração",
        "tempos": 2
    },
    {
        "id": "d_35",
        "nome": "Saúde e Segurança do Trabalho",
        "tempos": 2
    },
    {
        "id": "d_36",
        "nome": "Estatística Básica",
        "tempos": 2
    },
    {
        "id": "d_37",
        "nome": "Princípios do Design Gráfico",
        "tempos": 2
    },
    {
        "id": "d_38",
        "nome": "Informática Aplicada",
        "tempos": 2
    },
    {
        "id": "d_39",
        "nome": "Fund. de Informática",
        "tempos": 2
    }
];

const MOCK_PROFESSORES = [
    {
        "id": "p_1",
        "nome": "Prof. André",
        "disciplinas": [
            "d_1"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_2",
        "nome": "Prof. Gustavo",
        "disciplinas": [
            "d_2",
            "d_4",
            "d_5",
            "d_6",
            "d_18",
            "d_20",
            "d_25",
            "d_27",
            "d_34",
            "d_35",
            "d_36"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_3",
        "nome": "Prof. Thaisa",
        "disciplinas": [
            "d_3",
            "d_9",
            "d_24"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_4",
        "nome": "Prof. Hugo",
        "disciplinas": [
            "d_7",
            "d_30"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_5",
        "nome": "Prof. Luanna",
        "disciplinas": [
            "d_8",
            "d_23"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_6",
        "nome": "Prof. Douglas",
        "disciplinas": [
            "d_10"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_7",
        "nome": "Prof. Rayane",
        "disciplinas": [
            "d_11",
            "d_14",
            "d_28"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_8",
        "nome": "Prof. Eduardo",
        "disciplinas": [
            "d_12",
            "d_15",
            "d_19",
            "d_21",
            "d_26"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_9",
        "nome": "Prof. Carol",
        "disciplinas": [
            "d_13"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_10",
        "nome": "Prof. Carla",
        "disciplinas": [
            "d_16"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_11",
        "nome": "Prof. Marcelo",
        "disciplinas": [
            "d_17"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_12",
        "nome": "Prof. Wemerson",
        "disciplinas": [
            "d_22"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_13",
        "nome": "Prof. Tesla",
        "disciplinas": [
            "d_9",
            "d_24"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_14",
        "nome": "Prof. Denilson",
        "disciplinas": [
            "d_29",
            "d_32",
            "d_33",
            "d_37",
            "d_38",
            "d_39",
            "d_2"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_15",
        "nome": "Prof. Lilian",
        "disciplinas": [
            "d_30"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    },
    {
        "id": "p_16",
        "nome": "Prof. Rayne",
        "disciplinas": [
            "d_31"
        ],
        "disponibilidade": {
            "2": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "3": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "4": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "5": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "6": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ]
        }
    }
];

const MOCK_TURMAS = [
    {
        "id": "t_1",
        "nome": "1001 TA",
        "cargaHoraria": {
            "d_1": 2,
            "d_4": 1,
            "d_3": 1,
            "d_7": 2,
            "d_9": 1,
            "d_6": 2,
            "d_14": 2,
            "d_16": 1,
            "d_17": 2,
            "d_8": 2,
            "d_10": 1,
            "d_22": 1,
            "d_23": 1,
            "d_24": 1,
            "d_13": 2,
            "d_30": 2,
            "d_34": 2,
            "d_36": 1,
            "d_38": 1,
            "d_2": 1
        }
    },
    {
        "id": "t_2",
        "nome": "1001 TI",
        "cargaHoraria": {
            "d_1": 2,
            "d_4": 1,
            "d_3": 1,
            "d_7": 2,
            "d_9": 1,
            "d_6": 2,
            "d_15": 2,
            "d_16": 1,
            "d_17": 2,
            "d_8": 2,
            "d_10": 1,
            "d_22": 1,
            "d_23": 1,
            "d_24": 1,
            "d_13": 2,
            "d_30": 2,
            "d_33": 3,
            "d_37": 1,
            "d_39": 1,
            "d_2": 1
        }
    },
    {
        "id": "t_3",
        "nome": "2001 TA",
        "cargaHoraria": {
            "d_2": 1,
            "d_1": 2,
            "d_3": 2,
            "d_6": 2,
            "d_8": 2,
            "d_11": 2,
            "d_13": 3,
            "d_7": 3,
            "d_10": 1,
            "d_20": 2,
            "d_24": 1,
            "d_27": 1,
            "d_28": 2,
            "d_17": 2,
            "d_9": 1,
            "d_16": 1,
            "d_30": 3
        }
    },
    {
        "id": "t_4",
        "nome": "2001 TI",
        "cargaHoraria": {
            "d_2": 1,
            "d_1": 2,
            "d_3": 2,
            "d_6": 2,
            "d_8": 2,
            "d_12": 2,
            "d_13": 3,
            "d_7": 3,
            "d_10": 1,
            "d_21": 3,
            "d_24": 1,
            "d_29": 3,
            "d_17": 2,
            "d_9": 1,
            "d_16": 1,
            "d_30": 3
        }
    },
    {
        "id": "t_5",
        "nome": "3001TA",
        "cargaHoraria": {
            "d_3": 2,
            "d_5": 1,
            "d_1": 3,
            "d_8": 3,
            "d_10": 1,
            "d_7": 2,
            "d_13": 3,
            "d_6": 2,
            "d_18": 2,
            "d_25": 1,
            "d_9": 2,
            "d_30": 4,
            "d_17": 3,
            "d_31": 2,
            "d_24": 2,
            "d_35": 1,
            "d_16": 1
        }
    },
    {
        "id": "t_6",
        "nome": "3001 TI",
        "cargaHoraria": {
            "d_3": 2,
            "d_5": 1,
            "d_1": 3,
            "d_8": 3,
            "d_10": 1,
            "d_7": 2,
            "d_13": 3,
            "d_6": 2,
            "d_19": 2,
            "d_26": 1,
            "d_9": 2,
            "d_30": 4,
            "d_17": 3,
            "d_32": 3,
            "d_24": 2,
            "d_16": 1
        }
    }
];
const MOCK_TIMETABLE = {
    "t_1": {
        "2": [
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_4",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_3"
            },
            null
        ],
        "3": [
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_14",
                "professorId": "p_7"
            },
            {
                "disciplinaId": "d_14",
                "professorId": "p_7"
            },
            {
                "disciplinaId": "d_16",
                "professorId": "p_10"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            null
        ],
        "4": [
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_10",
                "professorId": "p_6"
            },
            {
                "disciplinaId": "d_22",
                "professorId": "p_12"
            },
            {
                "disciplinaId": "d_23",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_3"
            },
            null
        ],
        "5": [
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            null,
            null
        ],
        "6": [
            {
                "disciplinaId": "d_34",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_34",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_36",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_38",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_2",
                "professorId": "p_14"
            },
            null
        ]
    },
    "t_2": {
        "2": [
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_4",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_3"
            },
            null
        ],
        "3": [
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_15",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_15",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_16",
                "professorId": "p_10"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            null
        ],
        "4": [
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_10",
                "professorId": "p_6"
            },
            {
                "disciplinaId": "d_22",
                "professorId": "p_12"
            },
            {
                "disciplinaId": "d_23",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_3"
            },
            null
        ],
        "5": [
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_33",
                "professorId": "p_14"
            },
            null
        ],
        "6": [
            {
                "disciplinaId": "d_33",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_33",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_37",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_39",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_2",
                "professorId": "p_14"
            },
            null
        ]
    },
    "t_3": {
        "2": [
            {
                "disciplinaId": "d_2",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            }
        ],
        "3": [
            {
                "disciplinaId": "d_11",
                "professorId": "p_7"
            },
            {
                "disciplinaId": "d_11",
                "professorId": "p_7"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            }
        ],
        "4": [
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_10",
                "professorId": "p_6"
            },
            {
                "disciplinaId": "d_20",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_20",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_27",
                "professorId": "p_2"
            },
            null
        ],
        "5": [
            {
                "disciplinaId": "d_28",
                "professorId": "p_7"
            },
            {
                "disciplinaId": "d_28",
                "professorId": "p_7"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_13"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            null
        ],
        "6": [
            null,
            {
                "disciplinaId": "d_16",
                "professorId": "p_10"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            null
        ]
    },
    "t_4": {
        "2": [
            {
                "disciplinaId": "d_2",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            }
        ],
        "3": [
            {
                "disciplinaId": "d_12",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_12",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            }
        ],
        "4": [
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_10",
                "professorId": "p_6"
            },
            {
                "disciplinaId": "d_21",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_21",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_21",
                "professorId": "p_8"
            },
            null
        ],
        "5": [
            {
                "disciplinaId": "d_29",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_29",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_13"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_29",
                "professorId": "p_14"
            }
        ],
        "6": [
            null,
            {
                "disciplinaId": "d_16",
                "professorId": "p_10"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_15"
            },
            null
        ]
    },
    "t_5": {
        "2": [
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_5",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_10",
                "professorId": "p_6"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            }
        ],
        "3": [
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            }
        ],
        "4": [
            {
                "disciplinaId": "d_18",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_18",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_25",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_13"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_13"
            }
        ],
        "5": [
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_31",
                "professorId": "p_16"
            },
            {
                "disciplinaId": "d_31",
                "professorId": "p_16"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_13"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_13"
            }
        ],
        "6": [
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_35",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_16",
                "professorId": "p_10"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            }
        ]
    },
    "t_6": {
        "2": [
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_3",
                "professorId": "p_3"
            },
            {
                "disciplinaId": "d_5",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_10",
                "professorId": "p_6"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            }
        ],
        "3": [
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_6",
                "professorId": "p_2"
            },
            {
                "disciplinaId": "d_7",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            },
            {
                "disciplinaId": "d_1",
                "professorId": "p_1"
            }
        ],
        "4": [
            {
                "disciplinaId": "d_19",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_19",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_8",
                "professorId": "p_5"
            },
            {
                "disciplinaId": "d_26",
                "professorId": "p_8"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_13"
            },
            {
                "disciplinaId": "d_9",
                "professorId": "p_13"
            }
        ],
        "5": [
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_32",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_32",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_13",
                "professorId": "p_9"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_13"
            },
            {
                "disciplinaId": "d_24",
                "professorId": "p_13"
            }
        ],
        "6": [
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_32",
                "professorId": "p_14"
            },
            {
                "disciplinaId": "d_16",
                "professorId": "p_10"
            },
            {
                "disciplinaId": "d_30",
                "professorId": "p_4"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            },
            {
                "disciplinaId": "d_17",
                "professorId": "p_11"
            }
        ]
    }
};


let state = {
    disciplinas: [],
    professores: [],
    turmas: [],
    timetable: {} // { turmaId: { dia: [ { disciplinaId, professorId } ou null ] } }
};

// Carregar dados iniciais
function initData() {
    // Forçar limpeza de qualquer resquício de dados antigos de 5 ou 8 tempos (V3)
    if (localStorage.getItem('chronos_v3_migration') !== 'true') {
        localStorage.clear();
        localStorage.setItem('chronos_v3_migration', 'true');
    }
    
    state.disciplinas = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCIPLINAS)) || MOCK_DISCIPLINAS;
    state.professores = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFESSORES)) || MOCK_PROFESSORES;
    state.turmas = JSON.parse(localStorage.getItem(STORAGE_KEYS.TURMAS)) || MOCK_TURMAS;
    
    // Carregar horários de forma individual por turma
    state.timetable = {};
    state.turmas.forEach(t => {
        const saved = localStorage.getItem(`chronos_timetable_${t.id}`);
        if (saved) {
            state.timetable[t.id] = JSON.parse(saved);
        } else if (MOCK_TIMETABLE[t.id]) {
            state.timetable[t.id] = MOCK_TIMETABLE[t.id];
        } else {
            state.timetable[t.id] = {};
            activeConfig.dias.forEach(dia => {
                state.timetable[t.id][dia] = Array(activeConfig.tempos).fill(null);
            });
        }
    });
    
    // Migração de dados antigos sem o campo tempos
    state.disciplinas.forEach(d => {
        if (d.tempos === undefined) {
            d.tempos = 4;
        }
    });

    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(state.disciplinas));
    localStorage.setItem(STORAGE_KEYS.PROFESSORES, JSON.stringify(state.professores));
    localStorage.setItem(STORAGE_KEYS.TURMAS, JSON.stringify(state.turmas));
    localStorage.setItem('chronos_config', JSON.stringify(activeConfig));
    updateDashboardStats();
}

// ----------------------------------------------------
// ROUTING & NAVIGATION
// ----------------------------------------------------

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        
        // Ativar link na sidebar
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Alternar seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(`section-${target}`);
        activeSection.classList.add('active');

        // Atualizar título do cabeçalho
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Visão geral do planejamento escolar' },
            disciplinas: { title: 'Disciplinas', subtitle: 'Gerenciamento das matérias ofertadas' },
            professores: { title: 'Professores', subtitle: 'Cadastro de docentes e disponibilidades' },
            turmas: { title: 'Turmas', subtitle: 'Configuração de turmas e carga horária semanal' },
            horarios: { title: 'Grade de Horários', subtitle: 'Geração inteligente e ajuste interativo por drag-and-drop' }
        };
        document.getElementById('current-page-title').textContent = titles[target].title;
        document.getElementById('current-page-subtitle').textContent = titles[target].subtitle;

        // Renderizar conteúdo específico se necessário
        if (target === 'disciplinas') renderDisciplinas();
        if (target === 'professores') renderProfessores();
        if (target === 'turmas') renderTurmas();
        if (target === 'horarios') renderHorariosView();
    });
});

// ----------------------------------------------------
// UI RENDERING - DASHBOARD
// ----------------------------------------------------

function updateDashboardStats() {
    document.getElementById('stat-turmas').textContent = state.turmas.length;
    document.getElementById('stat-professores').textContent = state.professores.length;
    document.getElementById('stat-disciplinas').textContent = state.disciplinas.length;
    
    const hasTimetable = Object.keys(state.timetable).length > 0;
    const statusEl = document.getElementById('stat-status');
    if (hasTimetable) {
        statusEl.textContent = 'Gerado';
        statusEl.style.color = 'var(--success)';
    } else {
        statusEl.textContent = 'Não Gerado';
        statusEl.style.color = 'var(--warning)';
    }
}

// ----------------------------------------------------
// UI RENDERING - DISCIPLINAS
// ----------------------------------------------------

const modalDisciplina = document.getElementById('modal-disciplina');
const formDisciplina = document.getElementById('form-disciplina');

document.getElementById('btn-add-disciplina').addEventListener('click', () => {
    document.getElementById('modal-disciplina-title').textContent = 'Adicionar Disciplina';
    formDisciplina.reset();
    document.getElementById('edit-disciplina-id').value = '';
    modalDisciplina.classList.add('active');
});

formDisciplina.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-disciplina-id').value;
    const nome = document.getElementById('input-disciplina-nome').value;
    const tempos = parseInt(document.getElementById('input-disciplina-tempos').value, 10) || 4;

    if (id) {
        // Editar
        const disc = state.disciplinas.find(d => d.id === id);
        if (disc) {
            disc.nome = nome;
            disc.tempos = tempos;
        }
    } else {
        // Novo
        state.disciplinas.push({
            id: 'd_' + Date.now(),
            nome: nome,
            tempos: tempos
        });
    }

    saveToStorage();
    modalDisciplina.classList.remove('active');
    renderDisciplinas();
});

function renderDisciplinas() {
    const tbody = document.querySelector('#table-disciplinas tbody');
    tbody.innerHTML = '';

    if (state.disciplinas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhuma disciplina cadastrada.</td></tr>`;
        return;
    }

    state.disciplinas.forEach(disc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${disc.nome}</td>
            <td><span class="badge badge-secondary">${disc.tempos || 4} tempos</span></td>
            <td style="width: 120px;">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editDisciplina('${disc.id}')" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteDisciplina('${disc.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editDisciplina = function(id) {
    const disc = state.disciplinas.find(d => d.id === id);
    if (!disc) return;

    document.getElementById('modal-disciplina-title').textContent = 'Editar Disciplina';
    document.getElementById('edit-disciplina-id').value = disc.id;
    document.getElementById('input-disciplina-nome').value = disc.nome;
    document.getElementById('input-disciplina-tempos').value = disc.tempos || 4;
    modalDisciplina.classList.add('active');
};

window.deleteDisciplina = function(id) {
    if (confirm('Tem certeza que deseja excluir esta disciplina? Isso também a removerá das turmas e professores.')) {
        state.disciplinas = state.disciplinas.filter(d => d.id !== id);
        
        // Limpar das turmas
        state.turmas.forEach(t => {
            if (t.cargaHoraria && t.cargaHoraria[id]) {
                delete t.cargaHoraria[id];
            }
        });

        // Limpar dos professores
        state.professores.forEach(p => {
            p.disciplinas = p.disciplinas.filter(dId => dId !== id);
        });

        // Limpar grade
        state.timetable = {};

        saveToStorage();
        renderDisciplinas();
    }
};

// ----------------------------------------------------
// UI RENDERING - PROFESSORES
// ----------------------------------------------------

const modalProfessor = document.getElementById('modal-professor');
const formProfessor = document.getElementById('form-professor');

document.getElementById('btn-add-professor').addEventListener('click', () => {
    document.getElementById('modal-professor-title').textContent = 'Adicionar Professor';
    formProfessor.reset();
    document.getElementById('edit-professor-id').value = '';
    
    renderProfDisciplinasCheckboxes([]);
    renderAvailabilityEditor(null);
    modalProfessor.classList.add('active');
});

formProfessor.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-professor-id').value;
    const nome = document.getElementById('input-professor-nome').value;

    // Obter disciplinas selecionadas
    const disciplinasSelecionadas = [];
    document.querySelectorAll('.prof-disc-checkbox:checked').forEach(cb => {
        disciplinasSelecionadas.push(cb.value);
    });

    // Obter disponibilidade selecionada
    const disponibilidade = {};
    activeConfig.dias.forEach(dia => {
        disponibilidade[dia] = [];
        document.querySelectorAll(`.avail-cell-select[data-dia="${dia}"]:checked`).forEach(cb => {
            disponibilidade[dia].push(parseInt(cb.getAttribute('data-tempo'), 10));
        });
    });

    if (id) {
        // Editar
        const prof = state.professores.find(p => p.id === id);
        if (prof) {
            prof.nome = nome;
            prof.disciplinas = disciplinasSelecionadas;
            prof.disponibilidade = disponibilidade;
        }
    } else {
        // Novo
        state.professores.push({
            id: 'p_' + Date.now(),
            nome: nome,
            disciplinas: disciplinasSelecionadas,
            disponibilidade: disponibilidade
        });
    }

    saveToStorage();
    modalProfessor.classList.remove('active');
    renderProfessores();
});

function renderProfesores() {
    // Para funcionar a chamada de roteamento por string
    renderProfessores();
}

function renderProfessores() {
    const tbody = document.querySelector('#table-professores tbody');
    tbody.innerHTML = '';

    if (state.professores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Nenhum professor cadastrado.</td></tr>`;
        return;
    }

    state.professores.forEach(prof => {
        const nomesDisciplinas = prof.disciplinas.map(dId => {
            const d = state.disciplinas.find(disc => disc.id === dId);
            return d ? d.nome : '';
        }).filter(n => n !== '').join(', ');

        // Calcular quantos tempos livres o professor tem no total
        let totalTemposLivres = 0;
        if (prof.disponibilidade) {
            Object.values(prof.disponibilidade).forEach(list => {
                totalTemposLivres += list.length;
            });
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${prof.nome}</td>
            <td><span class="badge badge-primary">${nomesDisciplinas || 'Nenhuma'}</span></td>
            <td><span class="badge badge-secondary">${totalTemposLivres} tempos semanais livres</span></td>
            <td style="width: 120px;">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editProfessor('${prof.id}')" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteProfessor('${prof.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderProfDisciplinasCheckboxes(checkedIds = []) {
    const container = document.getElementById('prof-disciplinas-checkboxes');
    container.innerHTML = '';

    if (state.disciplinas.length === 0) {
        container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">Cadastre disciplinas primeiro.</span>`;
        return;
    }

    state.disciplinas.forEach(d => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        const isChecked = checkedIds.includes(d.id) ? 'checked' : '';
        label.innerHTML = `
            <input type="checkbox" class="prof-disc-checkbox" value="${d.id}" ${isChecked}>
            <span>${d.nome}</span>
        `;
        container.appendChild(label);
    });
}

function renderAvailabilityEditor(profDisponibilidade = null) {
    const tbody = document.querySelector('#availability-table-editor tbody');
    tbody.innerHTML = '';

    for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${tempo + 1}º Tempo</strong><br><span style="font-size:0.75rem; color: var(--text-muted);">${activeConfig.temposHorarios[tempo]}</span></td>`;
        
        activeConfig.dias.forEach(dia => {
            let isChecked = true; // Por padrão, ativo para novas cadastros
            if (profDisponibilidade && profDisponibilidade[dia]) {
                isChecked = profDisponibilidade[dia].includes(tempo);
            }
            
            const td = document.createElement('td');
            td.innerHTML = `<input type="checkbox" class="avail-cell-select" data-dia="${dia}" data-tempo="${tempo}" ${isChecked ? 'checked' : ''}>`;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    }
}

// Helpers do Editor de Disponibilidade
document.getElementById('btn-select-all-avail').addEventListener('click', () => {
    document.querySelectorAll('.avail-cell-select').forEach(cb => cb.checked = true);
});
document.getElementById('btn-clear-all-avail').addEventListener('click', () => {
    document.querySelectorAll('.avail-cell-select').forEach(cb => cb.checked = false);
});

window.editProfessor = function(id) {
    const prof = state.professores.find(p => p.id === id);
    if (!prof) return;

    document.getElementById('modal-professor-title').textContent = 'Editar Professor';
    document.getElementById('edit-professor-id').value = prof.id;
    document.getElementById('input-professor-nome').value = prof.nome;

    renderProfDisciplinasCheckboxes(prof.disciplinas);
    renderAvailabilityEditor(prof.disponibilidade);
    modalProfessor.classList.add('active');
};

window.deleteProfessor = function(id) {
    if (confirm('Deseja realmente remover este professor?')) {
        state.professores = state.professores.filter(p => p.id !== id);
        state.timetable = {}; // Limpar grade pois o professor mudou
        saveToStorage();
        renderProfessores();
    }
};

// ----------------------------------------------------
// UI RENDERING - TURMAS
// ----------------------------------------------------

const modalTurma = document.getElementById('modal-turma');
const formTurma = document.getElementById('form-turma');

document.getElementById('btn-add-turma').addEventListener('click', () => {
    document.getElementById('modal-turma-title').textContent = 'Adicionar Turma';
    formTurma.reset();
    document.getElementById('edit-turma-id').value = '';
    
    renderTurmaCargaInputs({});
    modalTurma.classList.add('active');
});

formTurma.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-turma-id').value;
    const nome = document.getElementById('input-turma-nome').value;

    // Coletar cargas horárias
    const cargaHoraria = {};
    document.querySelectorAll('.workload-input').forEach(input => {
        const dId = input.getAttribute('data-disciplina-id');
        const value = parseInt(input.value, 10) || 0;
        if (value > 0) {
            cargaHoraria[dId] = value;
        }
    });

    if (id) {
        // Editar
        const turma = state.turmas.find(t => t.id === id);
        if (turma) {
            turma.nome = nome;
            turma.cargaHoraria = cargaHoraria;
        }
    } else {
        // Novo
        state.turmas.push({
            id: 't_' + Date.now(),
            nome: nome,
            cargaHoraria: cargaHoraria
        });
    }

    saveToStorage();
    modalTurma.classList.remove('active');
    renderTurmas();
});

function renderTurmas() {
    const tbody = document.querySelector('#table-turmas tbody');
    tbody.innerHTML = '';

    if (state.turmas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhuma turma cadastrada.</td></tr>`;
        return;
    }

    state.turmas.forEach(turma => {
        let listCargaText = [];
        Object.entries(turma.cargaHoraria || {}).forEach(([dId, horas]) => {
            const d = state.disciplinas.find(disc => disc.id === dId);
            if (d) {
                listCargaText.push(`${d.nome}: ${horas}h`);
            }
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${turma.nome}</td>
            <td><span class="badge badge-primary">${listCargaText.join(', ') || 'Nenhuma carga configurada'}</span></td>
            <td style="width: 120px;">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editTurma('${turma.id}')" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteTurma('${turma.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTurmaCargaInputs(cargaExistente = {}) {
    const container = document.getElementById('turma-carga-horaria-inputs');
    container.innerHTML = '';

    if (state.disciplinas.length === 0) {
        container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">Cadastre disciplinas primeiro para definir a carga horária.</span>`;
        return;
    }

    state.disciplinas.forEach(d => {
        // Se já houver uma carga configurada (inclusive 0), usa ela; senão usa os tempos da disciplina
        const horasVal = cargaExistente[d.id] !== undefined ? cargaExistente[d.id] : (d.tempos || 4);
        const div = document.createElement('div');
        div.className = 'workload-item';
        div.innerHTML = `
            <span>${d.nome} (padrão: ${d.tempos || 4}h)</span>
            <input type="number" min="0" max="25" class="form-control workload-input" data-disciplina-id="${d.id}" value="${horasVal}" placeholder="0">
        `;
        container.appendChild(div);
    });
}

window.editTurma = function(id) {
    const turma = state.turmas.find(t => t.id === id);
    if (!turma) return;

    document.getElementById('modal-turma-title').textContent = 'Editar Turma';
    document.getElementById('edit-turma-id').value = turma.id;
    document.getElementById('input-turma-nome').value = turma.nome;

    renderTurmaCargaInputs(turma.cargaHoraria);
    modalTurma.classList.add('active');
};

window.deleteTurma = function(id) {
    if (confirm('Deseja realmente remover esta turma?')) {
        state.turmas = state.turmas.filter(t => t.id !== id);
        state.timetable = {}; // Limpar grade
        saveToStorage();
        renderTurmas();
    }
};

// ----------------------------------------------------
// TIMETABLE GENERATION & DRAG AND DROP HANDLERS
// ----------------------------------------------------

const selectViewMode = document.getElementById('select-view-mode');
const selectTimetableTurma = document.getElementById('select-timetable-turma');
const selectTimetableProfessor = document.getElementById('select-timetable-professor');

selectViewMode.addEventListener('change', () => {
    if (selectViewMode.value === 'turma') {
        document.getElementById('group-select-turma').classList.remove('d-none');
        document.getElementById('group-select-professor').classList.add('d-none');
    } else {
        document.getElementById('group-select-turma').classList.add('d-none');
        document.getElementById('group-select-professor').classList.remove('d-none');
    }
    renderHorariosGrid();
});

selectTimetableTurma.addEventListener('change', renderHorariosGrid);
selectTimetableProfessor.addEventListener('change', renderHorariosGrid);

// Geração Automática
document.getElementById('btn-generate-timetable').addEventListener('click', generateTimetableFlow);
document.getElementById('btn-quick-generate').addEventListener('click', () => {
    // Mudar para seção de horários e rodar a geração
    document.querySelector('.nav-link[data-target="horarios"]').click();
    generateTimetableFlow();
});

// Salvar Horário da Turma Atual
document.getElementById('btn-save-current-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) {
        showGenerationMessage('Nenhuma turma selecionada para salvar.', 'danger');
        return;
    }
    localStorage.setItem(`chronos_timetable_${currentTurmaId}`, JSON.stringify(state.timetable[currentTurmaId] || {}));
    showGenerationMessage('Horário da turma atual salvo com sucesso!', 'success');
});

// Retirar Tempos Vagos da Turma Atual (Compactar)
document.getElementById('btn-compact-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) {
        showGenerationMessage('Nenhuma turma selecionada para compactar.', 'danger');
        return;
    }
    
    if (!state.timetable[currentTurmaId]) return;
    
    let changed = false;
    activeConfig.dias.forEach(dia => {
        const daySchedule = state.timetable[currentTurmaId][dia];
        if (daySchedule && Array.isArray(daySchedule)) {
            // Remove null values and compact them to the beginning of the day
            const compacted = daySchedule.filter(slot => slot !== null);
            while (compacted.length < activeConfig.tempos) {
                compacted.push(null);
            }
            
            // Check if there was any actual change
            if (JSON.stringify(daySchedule) !== JSON.stringify(compacted)) {
                state.timetable[currentTurmaId][dia] = compacted;
                changed = true;
            }
        }
    });
    
    if (changed) {
        renderHorariosGrid();
        showGenerationMessage('Tempos vagos retirados com sucesso! Lembre-se de clicar em "Salvar Horário".', 'warning');
    } else {
        showGenerationMessage('Não há tempos vagos para retirar na turma selecionada.', 'info');
    }
});

document.getElementById('btn-reset-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) return;
    if (confirm('Deseja limpar o horário planejado para a turma atual?')) {
        state.timetable[currentTurmaId] = {};
        activeConfig.dias.forEach(dia => {
            state.timetable[currentTurmaId][dia] = Array(activeConfig.tempos).fill(null);
        });
        renderHorariosGrid();
        showGenerationMessage('Horários da turma limpos em memória. Lembre-se de clicar em "Salvar Horário".', 'warning');
    }
});

function showGenerationMessage(msg, type) {
    const alertEl = document.getElementById('generation-message');
    alertEl.textContent = msg;
    alertEl.className = `info-alert ${type}`;
    alertEl.classList.remove('d-none');
    setTimeout(() => {
        alertEl.classList.add('d-none');
    }, 8000);
}

function generateTimetableFlow() {
    if (state.turmas.length === 0 || state.professores.length === 0) {
        showGenerationMessage('Cadastre turmas, disciplinas e professores antes de gerar o horário.', 'danger');
        return;
    }

    const scheduler = new window.TimetableScheduler(state.turmas, state.professores, state.disciplinas, activeConfig);
    const result = scheduler.generate();

    if (result.success) {
        state.timetable = result.timetable;
        renderHorariosView();
        showGenerationMessage('Grade de horários gerada em memória com sucesso! Clique em "Salvar Horário" para cada turma.', 'success');
    } else if (result.isPartial) {
        state.timetable = result.timetable;
        renderHorariosView();
        showGenerationMessage(`Grade gerada parcialmente em memória! Alocamos ${result.allocated} de ${result.total} aulas. Ajuste e salve por turma!`, 'warning');
    } else {
        showGenerationMessage('Não foi possível gerar um horário de forma automática. Verifique se os professores possuem disponibilidades cadastradas.', 'danger');
    }
}

function renderHorariosView() {
    // Preencher select de turmas
    selectTimetableTurma.innerHTML = '';
    state.turmas.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.nome;
        selectTimetableTurma.appendChild(opt);
    });

    // Preencher select de professores
    selectTimetableProfessor.innerHTML = '';
    state.professores.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        selectTimetableProfessor.appendChild(opt);
    });

    renderHorariosGrid();
}

function renderHorariosGrid() {
    const root = document.getElementById('timetable-grid-root');
    root.innerHTML = '';

    const viewMode = selectViewMode.value;
    const currentTurmaId = selectTimetableTurma.value;
    const currentProfessorId = selectTimetableProfessor.value;

    if (viewMode === 'turma' && !currentTurmaId) {
        root.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma turma selecionada ou cadastrada.</div>';
        return;
    }
    if (viewMode === 'professor' && !currentProfessorId) {
        root.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Nenhum professor selecionado ou cadastrado.</div>';
        return;
    }

    // 1. Renderizar cabeçalho da tabela (Dias da Semana)
    // Célula vazia no canto superior esquerdo
    const headerCorner = document.createElement('div');
    headerCorner.className = 'timetable-header-cell';
    headerCorner.innerHTML = '<i class="fa-solid fa-clock-o"></i> Horário';
    root.appendChild(headerCorner);

    activeConfig.dias.forEach(dia => {
        const headerCell = document.createElement('div');
        headerCell.className = 'timetable-header-cell';
        headerCell.textContent = activeConfig.diasNomes[dia];
        root.appendChild(headerCell);
    });

    // 2. Renderizar linhas por Período/Tempo
    for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
        // Se for o 4º tempo (index 3), insere a linha visual do Intervalo primeiro
        if (tempo === 3) {
            const intervalTimeCell = document.createElement('div');
            intervalTimeCell.className = 'timetable-time-cell';
            intervalTimeCell.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            intervalTimeCell.innerHTML = `<strong>RECREIO</strong><span>09:40 - 10:10</span>`;
            root.appendChild(intervalTimeCell);

            const intervalCell = document.createElement('div');
            intervalCell.style.gridColumn = 'span 5';
            intervalCell.style.display = 'flex';
            intervalCell.style.alignItems = 'center';
            intervalCell.style.justifyContent = 'center';
            intervalCell.style.background = 'rgba(255, 255, 255, 0.01)';
            intervalCell.style.border = '1px dashed var(--border-color)';
            intervalCell.style.borderRadius = 'var(--radius-md)';
            intervalCell.style.color = 'var(--text-muted)';
            intervalCell.style.fontSize = '0.85rem';
            intervalCell.style.fontWeight = '600';
            intervalCell.innerHTML = '<i class="fa-solid fa-coffee" style="margin-right: 6px;"></i> INTERVALO / RECREIO';
            root.appendChild(intervalCell);
        }

        // Primeira célula da linha: Identificação do Tempo
        const timeCell = document.createElement('div');
        timeCell.className = 'timetable-time-cell';
        timeCell.innerHTML = `<strong>${tempo + 1}º Tempo</strong><span>${activeConfig.temposHorarios[tempo]}</span>`;
        root.appendChild(timeCell);

        // Células dos dias letivos
        activeConfig.dias.forEach(dia => {
            const cell = document.createElement('div');
            cell.className = 'timetable-cell';
            cell.setAttribute('data-dia', dia);
            cell.setAttribute('data-tempo', tempo);

            if (viewMode === 'turma') {
                cell.setAttribute('data-turma-id', currentTurmaId);
                setupDropZone(cell);
                
                // Buscar aula agendada para esta turma, dia e tempo
                const agendaTurma = state.timetable[currentTurmaId];
                const aula = agendaTurma && agendaTurma[dia] ? agendaTurma[dia][tempo] : null;

                if (aula) {
                    const disc = state.disciplinas.find(d => d.id === aula.disciplinaId);
                    const prof = state.professores.find(p => p.id === aula.professorId);
                    
                    const card = createLessonCard(aula.disciplinaId, disc ? disc.nome : 'Matéria', aula.professorId, prof ? prof.nome : 'Prof.', currentTurmaId, dia, tempo);
                    cell.appendChild(card);
                }
            } else {
                // Visualização do Professor
                cell.setAttribute('data-professor-id', currentProfessorId);
                
                // Apenas mostrar as aulas que este professor dá nas diferentes turmas
                let aulaEncontrada = null;
                let turmaDaAulaId = null;

                Object.entries(state.timetable).forEach(([tId, tAgenda]) => {
                    const slot = tAgenda[dia] ? tAgenda[dia][tempo] : null;
                    if (slot && slot.professorId === currentProfessorId) {
                        aulaEncontrada = slot;
                        turmaDaAulaId = tId;
                    }
                });

                if (aulaEncontrada) {
                    const disc = state.disciplinas.find(d => d.id === aulaEncontrada.disciplinaId);
                    const turma = state.turmas.find(t => t.id === turmaDaAulaId);
                    
                    const card = document.createElement('div');
                    card.className = 'lesson-card lesson-card-1';
                    card.style.cursor = 'default'; // Não arrastável na visualização do professor
                    card.innerHTML = `
                        <div class="lesson-subject">${disc ? disc.nome : 'Sem Nome'}</div>
                        <div class="lesson-teacher"><i class="fa-solid fa-users"></i> ${turma ? turma.nome : 'Turma'}</div>
                    `;
                    cell.appendChild(card);
                } else {
                    // Verificar se o professor está disponível neste horário
                    const profObj = state.professores.find(p => p.id === currentProfessorId);
                    const isAvailable = profObj && profObj.disponibilidade && profObj.disponibilidade[dia] && profObj.disponibilidade[dia].includes(tempo);
                    
                    if (!isAvailable) {
                        cell.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                        cell.innerHTML = '<span style="color:var(--danger); font-size:0.75rem; font-weight:600;">Indisponível</span>';
                    }
                }
            }

            root.appendChild(cell);
        });
    }
}

// Criar o cartão arrastável
function createLessonCard(disciplinaId, disciplinaNome, professorId, professorNome, turmaId, dia, tempo) {
    const card = document.createElement('div');
    card.className = `lesson-card lesson-card-${(disciplinaId.charCodeAt(1) % 8) + 1}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-disciplina-id', disciplinaId);
    card.setAttribute('data-professor-id', professorId);
    card.setAttribute('data-turma-id', turmaId);
    card.setAttribute('data-from-dia', dia);
    card.setAttribute('data-from-tempo', tempo);

    card.innerHTML = `
        <div class="lesson-subject">${disciplinaNome}</div>
        <div class="lesson-teacher" title="${professorNome}"><i class="fa-solid fa-user-tie"></i> ${professorNome}</div>
    `;

    // Eventos de Drag
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({
            disciplinaId,
            professorId,
            turmaId,
            fromDia: parseInt(dia, 10),
            fromTempo: parseInt(tempo, 10)
        }));
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.timetable-cell').forEach(c => c.classList.remove('drag-over'));
    });

    return card;
}

// Configurar zona de drop
function setupDropZone(cell) {
    cell.addEventListener('dragover', (e) => {
        e.preventDefault();
        cell.classList.add('drag-over');
    });

    cell.addEventListener('dragleave', () => {
        cell.classList.remove('drag-over');
    });

    cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const targetDia = parseInt(cell.getAttribute('data-dia'), 10);
            const targetTempo = parseInt(cell.getAttribute('data-tempo'), 10);
            const targetTurmaId = cell.getAttribute('data-turma-id');

            // Validar e realizar movimentação
            moveLesson(dragData, targetTurmaId, targetDia, targetTempo);
        } catch (err) {
            console.error('Falha ao soltar cartão:', err);
        }
    });
}

// Lógica de movimentação/validação
function moveLesson(dragData, targetTurmaId, targetDia, targetTempo) {
    const { disciplinaId, professorId, turmaId: sourceTurmaId, fromDia, fromTempo } = dragData;
    
    // 1. Garantir que estamos mexendo na mesma turma (por facilidade de regras de negócio,
    // o usuário move aulas dentro da grade da própria turma)
    if (sourceTurmaId !== targetTurmaId) {
        showGenerationMessage('Não é permitido arrastar aulas entre turmas diferentes.', 'danger');
        return;
    }

    const professor = state.professores.find(p => p.id === professorId);
    if (!professor) return;

    // 2. Verificar disponibilidade do professor no slot de destino
    const disponibilidadeProf = professor.disponibilidade && professor.disponibilidade[targetDia];
    if (!disponibilidadeProf || !disponibilidadeProf.includes(targetTempo)) {
        showGenerationMessage(`Conflito: ${professor.nome} não está disponível no ${targetTempo + 1}º tempo de ${activeConfig.diasNomes[targetDia]}!`, 'danger');
        return;
    }

    // 3. Verificar choque de horário (se o professor já leciona para OUTRA turma nesse mesmo horário)
    let choqueTurma = null;
    Object.entries(state.timetable).forEach(([tId, agenda]) => {
        if (tId === targetTurmaId) return; // ignora a própria turma
        const aulaOutraTurma = agenda[targetDia] ? agenda[targetDia][targetTempo] : null;
        if (aulaOutraTurma && aulaOutraTurma.professorId === professorId) {
            choqueTurma = state.turmas.find(t => t.id === tId);
        }
    });

    if (choqueTurma) {
        showGenerationMessage(`Conflito: ${professor.nome} já está alocado na turma ${choqueTurma.nome} neste mesmo tempo!`, 'danger');
        return;
    }

    // Executar a troca/movimentação na matriz de horários
    if (!state.timetable[targetTurmaId]) {
        state.timetable[targetTurmaId] = {};
    }
    if (!state.timetable[targetTurmaId][targetDia]) {
        state.timetable[targetTurmaId][targetDia] = Array(activeConfig.tempos).fill(null);
    }
    if (!state.timetable[targetTurmaId][fromDia]) {
        state.timetable[targetTurmaId][fromDia] = Array(activeConfig.tempos).fill(null);
    }

    // Se o destino tiver alguma matéria, fazemos swap (troca de posições)
    const targetContent = state.timetable[targetTurmaId][targetDia][targetTempo];
    if (targetContent) {
        // Para fazer o swap, precisamos validar também o professor da matéria de destino no slot de origem
        const targetProf = state.professores.find(p => p.id === targetContent.professorId);
        if (targetProf) {
            // Verificar disponibilidade do professor do swap na célula de origem
            const dispTargetProf = targetProf.disponibilidade && targetProf.disponibilidade[fromDia];
            if (!dispTargetProf || !dispTargetProf.includes(fromTempo)) {
                showGenerationMessage(`Conflito de Troca: ${targetProf.nome} não está disponível na origem de volta (${fromTempo + 1}º tempo de ${activeConfig.diasNomes[fromDia]})!`, 'danger');
                return;
            }

            // Verificar se o professor do swap tem aula em outra turma no tempo de origem
            let choqueSwap = null;
            Object.entries(state.timetable).forEach(([tId, agenda]) => {
                if (tId === targetTurmaId) return;
                const aulaOutraTurma = agenda[fromDia] ? agenda[fromDia][fromTempo] : null;
                if (aulaOutraTurma && aulaOutraTurma.professorId === targetProf.id) {
                    choqueSwap = state.turmas.find(t => t.id === tId);
                }
            });
            if (choqueSwap) {
                showGenerationMessage(`Conflito de Troca: ${targetProf.nome} já leciona para a turma ${choqueSwap.nome} no tempo de origem!`, 'danger');
                return;
            }
        }
    }

    // Efetivar troca
    state.timetable[targetTurmaId][targetDia][targetTempo] = { disciplinaId, professorId };
    state.timetable[targetTurmaId][fromDia][fromTempo] = targetContent; // se targetContent for null, apenas limpa a origem

    renderHorariosGrid();
    showGenerationMessage('Horário ajustado na memória! Clique em "Salvar Horário" para confirmar.', 'warning');
}

// ----------------------------------------------------
// MODAL CONTROLS (GLOBAL)
// ----------------------------------------------------

document.querySelectorAll('.modal-close, .btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    });
});

// Fechar modais ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ----------------------------------------------------
// EXPORT TO EXCEL
// ----------------------------------------------------

function exportTimetableToExcel() {
    if (Object.keys(state.timetable).length === 0) {
        showGenerationMessage('Gere a grade de horários antes de exportar.', 'danger');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        const usedSheetNames = new Set();

        const getSafeSheetName = (name, prefix = "") => {
            let clean = (prefix + name)
                .replace(/[:\/\\\?\*\[\]]/g, '') // Remove caracteres inválidos
                .trim();
            
            // Garantir que cabe no limite de 31 caracteres do Excel
            let candidate = clean.substring(0, 31);
            let counter = 1;
            
            while (usedSheetNames.has(candidate.toLowerCase())) {
                const suffix = ` (${counter})`;
                candidate = clean.substring(0, 31 - suffix.length) + suffix;
                counter++;
            }
            usedSheetNames.add(candidate.toLowerCase());
            return candidate;
        };

        // 1. Criar planilha para cada Turma
        state.turmas.forEach(turma => {
            const data = [];
            
            // Cabeçalho
            const headers = ["Horário", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
            data.push(headers);

            // Linhas por Tempo
            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                const row = [`${tempo + 1}º Tempo (${activeConfig.temposHorarios[tempo]})`];
                
                activeConfig.dias.forEach(dia => {
                    const agendaTurma = state.timetable[turma.id];
                    const aula = agendaTurma && agendaTurma[dia] ? agendaTurma[dia][tempo] : null;
                    if (aula) {
                        const disc = state.disciplinas.find(d => d.id === aula.disciplinaId);
                        const prof = state.professores.find(p => p.id === aula.professorId);
                        row.push(`${disc ? disc.nome : 'Sem Nome'} (${prof ? prof.nome : 'Sem Prof'})`);
                    } else {
                        row.push("-");
                    }
                });
                data.push(row);
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
            
            const sheetName = getSafeSheetName(turma.nome, "Turma - ");
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // 2. Criar planilha para cada Professor
        state.professores.forEach(prof => {
            const data = [];
            
            const headers = ["Horário", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
            data.push(headers);

            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                const row = [`${tempo + 1}º Tempo (${activeConfig.temposHorarios[tempo]})`];
                
                activeConfig.dias.forEach(dia => {
                    let aulaEncontrada = null;
                    let turmaDaAula = null;

                    Object.entries(state.timetable).forEach(([tId, tAgenda]) => {
                        const slot = tAgenda[dia] ? tAgenda[dia][tempo] : null;
                        if (slot && slot.professorId === prof.id) {
                            aulaEncontrada = slot;
                            turmaDaAula = state.turmas.find(t => t.id === tId);
                        }
                    });

                    if (aulaEncontrada) {
                        const disc = state.disciplinas.find(d => d.id === aulaEncontrada.disciplinaId);
                        row.push(`${disc ? disc.nome : 'Sem Nome'} (${turmaDaAula ? turmaDaAula.nome : 'Turma'})`);
                    } else {
                        const isAvailable = prof.disponibilidade && prof.disponibilidade[dia] && prof.disponibilidade[dia].includes(tempo);
                        row.push(isAvailable ? "-" : "Indisponível");
                    }
                });
                data.push(row);
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
            
            const cleanProfName = prof.nome.replace(/Profª?\.\s*/i, ''); // Remove prefixo "Prof." ou "Profª." do nome da aba
            const sheetName = getSafeSheetName(cleanProfName, "Prof - ");
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // Salvar arquivo
        XLSX.writeFile(wb, "Chronos_Horarios_Escolares.xlsx");
        showGenerationMessage('Grade de horários exportada para o Excel com sucesso!', 'success');
    } catch (err) {
        console.error(err);
        showGenerationMessage('Falha ao gerar e salvar arquivo do Excel.', 'danger');
    }
}

// ----------------------------------------------------
// IMPORT RAG DATA
// ----------------------------------------------------

function handleRAGImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar dados mínimos
            if (!importedData.disciplinas || !importedData.professores || !importedData.turmas || !importedData.timetable) {
                showGenerationMessage('Arquivo RAG inválido! O JSON deve conter disciplinas, professores, turmas e timetable.', 'danger');
                return;
            }

            // Atualizar Configuração se existir
            if (importedData.config) {
                activeConfig = importedData.config;
                localStorage.setItem('chronos_config', JSON.stringify(activeConfig));
            }

            // Atualizar Estado
            state.disciplinas = importedData.disciplinas;
            state.professores = importedData.professores;
            state.turmas = importedData.turmas;
            state.timetable = importedData.timetable;

            // Salvar no localStorage e atualizar a tela
            saveToStorage();
            
            // Recarregar visualização
            renderDisciplinas();
            renderProfessores();
            renderTurmas();
            renderHorariosView();

            showGenerationMessage('Dados do RAG importados e aplicados com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showGenerationMessage('Erro ao ler arquivo RAG. Certifique-se de que é um JSON válido.', 'danger');
        }
    };
    reader.readAsText(file);
}

// Inicialização Geral
window.addEventListener('DOMContentLoaded', () => {
    initData();
    renderDisciplinas();
    renderProfessores();
    renderTurmas();
    renderHorariosView();

    // Evento de Exportação
    document.getElementById('btn-export-excel').addEventListener('click', exportTimetableToExcel);

    // Eventos de Importação RAG
    const importTrigger = document.getElementById('btn-import-rag-trigger');
    const importInput = document.getElementById('input-import-rag');
    
    if (importTrigger && importInput) {
        importTrigger.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', handleRAGImport);
    }
});
