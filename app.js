// ----------------------------------------------------
// MULTI-TENANT AUTHENTICATION & SESSION MANAGEMENT
// ----------------------------------------------------

const AuthManager = {
    STORAGE_USERS: 'chronos_auth_users',
    STORAGE_SESSION: 'chronos_auth_session',
    STORAGE_IMPERSONATION: 'chronos_auth_impersonation',

    init() {
        let users = this.getUsers();
        
        // 1. Garantir que a conta mestre do Super Administrador 'admin' existe
        let adminUser = users.find(u => u.username === 'admin');
        if (!adminUser) {
            adminUser = {
                id: 'superadmin_master',
                username: 'admin',
                password: 'admin',
                name: 'Administrador Geral',
                role: 'superadmin',
                createdAt: new Date().toISOString()
            };
            users.unshift(adminUser);
            this.saveUsers(users);
        } else if (adminUser.role !== 'superadmin') {
            adminUser.role = 'superadmin';
            adminUser.name = 'Administrador Geral';
            this.saveUsers(users);
        }

        // 2. Garantir que a Escola Modelo EMT existe com login 'demo' / 'demo' (ou preservando seu histórico)
        let demoSchool = users.find(u => u.id === 'school_demo_emt' || u.username === 'demo');
        if (!demoSchool) {
            users.push({
                id: 'school_demo_emt',
                username: 'demo',
                password: 'demo',
                name: 'Escola EMT (Modelo)',
                role: 'school',
                isDemo: true,
                createdAt: new Date().toISOString()
            });
            this.saveUsers(users);
        }
    },

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_USERS)) || [];
        } catch (e) {
            return [];
        }
    },

    getSchools() {
        return this.getUsers().filter(u => u.role !== 'superadmin');
    },

    saveUsers(users) {
        localStorage.setItem(this.STORAGE_USERS, JSON.stringify(users));
    },

    getRealUser() {
        try {
            const session = JSON.parse(localStorage.getItem(this.STORAGE_SESSION));
            if (!session || !session.userId) return null;
            const users = this.getUsers();
            return users.find(u => u.id === session.userId) || null;
        } catch (e) {
            return null;
        }
    },

    getCurrentUser() {
        const realUser = this.getRealUser();
        if (!realUser) return null;

        // Se for superadmin e houver uma escola selecionada para suporte/visualização:
        if (realUser.role === 'superadmin') {
            const impId = localStorage.getItem(this.STORAGE_IMPERSONATION);
            if (impId) {
                const impSchool = this.getUsers().find(u => u.id === impId);
                if (impSchool) {
                    return impSchool;
                }
            }
        }
        return realUser;
    },

    isImpersonating() {
        const realUser = this.getRealUser();
        if (realUser && realUser.role === 'superadmin') {
            const impId = localStorage.getItem(this.STORAGE_IMPERSONATION);
            return !!impId;
        }
        return false;
    },

    login(username, password) {
        this.init();
        const users = this.getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
        if (!user) {
            return { success: false, message: 'Usuário ou senha incorretos.' };
        }
        localStorage.removeItem(this.STORAGE_IMPERSONATION);
        localStorage.setItem(this.STORAGE_SESSION, JSON.stringify({ userId: user.id, loggedAt: new Date().toISOString() }));
        return { success: true, user };
    },

    createSchool(name, username, password) {
        this.init();
        username = username.trim().toLowerCase();
        name = name.trim();
        if (!name || !username || !password) {
            return { success: false, message: 'Preencha todos os campos do formulário.' };
        }
        const users = this.getUsers();
        if (users.some(u => u.username.toLowerCase() === username)) {
            return { success: false, message: 'Este nome de usuário já está em uso por outra escola.' };
        }
        const newSchool = {
            id: 'school_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            username: username,
            password: password,
            name: name,
            role: 'school',
            isDemo: false,
            createdAt: new Date().toISOString()
        };
        users.push(newSchool);
        this.saveUsers(users);

        // Inicializar armazenamento da escola vazio
        localStorage.setItem(`chronos_${newSchool.id}_disciplinas`, JSON.stringify([]));
        localStorage.setItem(`chronos_${newSchool.id}_professores`, JSON.stringify([]));
        localStorage.setItem(`chronos_${newSchool.id}_turmas`, JSON.stringify([]));
        localStorage.setItem(`chronos_${newSchool.id}_config`, JSON.stringify(DEFAULT_CONFIG));

        return { success: true, school: newSchool };
    },

    updateSchoolPassword(schoolId, newPassword) {
        if (!newPassword || newPassword.trim().length === 0) {
            return { success: false, message: 'A nova senha não pode ser vazia.' };
        }
        const users = this.getUsers();
        const school = users.find(u => u.id === schoolId);
        if (!school) {
            return { success: false, message: 'Escola não encontrada.' };
        }
        school.password = newPassword.trim();
        this.saveUsers(users);
        return { success: true, school };
    },

    deleteSchool(schoolId) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== schoolId);
        this.saveUsers(users);

        // Limpar todas as chaves do localStorage pertencentes a essa escola
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(`chronos_${schoolId}_`)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        return { success: true };
    },

    impersonate(schoolId) {
        localStorage.setItem(this.STORAGE_IMPERSONATION, schoolId);
    },

    exitImpersonation() {
        localStorage.removeItem(this.STORAGE_IMPERSONATION);
    },

    logout() {
        localStorage.removeItem(this.STORAGE_SESSION);
        localStorage.removeItem(this.STORAGE_IMPERSONATION);
    }
};

// Obter chave de armazenamento isolada por escola ativa
function getSchoolKey(key) {
    const user = AuthManager.getCurrentUser();
    const schoolId = user ? user.id : 'default';
    return `chronos_${schoolId}_${key}`;
}

// ----------------------------------------------------
// STATE MANAGEMENT & DATA LOADING
// ----------------------------------------------------

const STORAGE_KEYS = {
    DISCIPLINAS: 'chronos_disciplinas',
    PROFESSORES: 'chronos_professores',
    TURMAS: 'chronos_turmas',
    TIMETABLE: 'chronos_timetable'
};

const DEFAULT_CONFIG = {
    dias: [2, 3, 4, 5, 6],
    diasNomes: { 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta' },
    tempos: 8,
    temposHorarios: ["07:10 - 08:00", "08:00 - 08:50", "08:50 - 09:40", "10:10 - 11:00", "11:00 - 11:50", "11:50 - 12:40", "12:40 - 13:30", "13:30 - 14:20"]
};

let activeConfig = DEFAULT_CONFIG;

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

// Carregar dados da escola ativa
function initData() {
    const user = AuthManager.getCurrentUser();
    activeConfig = JSON.parse(localStorage.getItem(getSchoolKey('config'))) || DEFAULT_CONFIG;

    if (user && user.isDemo) {
        // Conta de Demonstração (Modelo EMT): migra do armazenamento legado ou usa os mocks integrados
        state.disciplinas = JSON.parse(localStorage.getItem(getSchoolKey('disciplinas'))) 
            || JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCIPLINAS)) 
            || MOCK_DISCIPLINAS;
        state.professores = JSON.parse(localStorage.getItem(getSchoolKey('professores'))) 
            || JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFESSORES)) 
            || MOCK_PROFESSORES;
        state.turmas = JSON.parse(localStorage.getItem(getSchoolKey('turmas'))) 
            || JSON.parse(localStorage.getItem(STORAGE_KEYS.TURMAS)) 
            || MOCK_TURMAS;
        
        state.timetable = {};
        state.turmas.forEach(t => {
            const saved = localStorage.getItem(getSchoolKey(`timetable_${t.id}`)) 
                || localStorage.getItem(`chronos_timetable_${t.id}`);
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
    } else {
        // Nova Escola Cadastrada: inicia com ambiente 100% limpo e isolado
        state.disciplinas = JSON.parse(localStorage.getItem(getSchoolKey('disciplinas'))) || [];
        state.professores = JSON.parse(localStorage.getItem(getSchoolKey('professores'))) || [];
        state.turmas = JSON.parse(localStorage.getItem(getSchoolKey('turmas'))) || [];

        state.timetable = {};
        state.turmas.forEach(t => {
            const saved = localStorage.getItem(getSchoolKey(`timetable_${t.id}`));
            if (saved) {
                state.timetable[t.id] = JSON.parse(saved);
            } else {
                state.timetable[t.id] = {};
                activeConfig.dias.forEach(dia => {
                    state.timetable[t.id][dia] = Array(activeConfig.tempos).fill(null);
                });
            }
        });
    }
    
    // Garantir tempos definidos para disciplinas
    state.disciplinas.forEach(d => {
        if (d.tempos === undefined) {
            d.tempos = 4;
        }
    });

    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem(getSchoolKey('disciplinas'), JSON.stringify(state.disciplinas));
    localStorage.setItem(getSchoolKey('professores'), JSON.stringify(state.professores));
    localStorage.setItem(getSchoolKey('turmas'), JSON.stringify(state.turmas));
    localStorage.setItem(getSchoolKey('config'), JSON.stringify(activeConfig));
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
            'admin-schools': { title: 'Gestão de Escolas', subtitle: 'Painel administrativo central de instituições e acessos' },
            dashboard: { title: 'Dashboard', subtitle: 'Visão geral do planejamento escolar' },
            disciplinas: { title: 'Disciplinas', subtitle: 'Gerenciamento das matérias ofertadas' },
            professores: { title: 'Professores', subtitle: 'Cadastro de docentes e disponibilidades' },
            turmas: { title: 'Turmas', subtitle: 'Configuração de turmas e carga horária semanal' },
            horarios: { title: 'Grade de Horários', subtitle: 'Geração inteligente e ajuste interativo por drag-and-drop' }
        };
        if (titles[target]) {
            document.getElementById('current-page-title').textContent = titles[target].title;
            document.getElementById('current-page-subtitle').textContent = titles[target].subtitle;
        }

        // Renderizar conteúdo específico se necessário
        if (target === 'admin-schools') renderAdminSchoolsPanel();
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
    const elTurmas = document.getElementById('stat-turmas');
    const elProfs = document.getElementById('stat-professores');
    const elDiscs = document.getElementById('stat-disciplinas');
    const statusEl = document.getElementById('stat-status');
    
    if (elTurmas) elTurmas.textContent = state.turmas.length;
    if (elProfs) elProfs.textContent = state.professores.length;
    if (elDiscs) elDiscs.textContent = state.disciplinas.length;
    
    if (statusEl) {
        const hasTimetable = Object.keys(state.timetable).length > 0;
        if (hasTimetable) {
            statusEl.textContent = 'Gerado';
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.textContent = 'Não Gerado';
            statusEl.style.color = 'var(--warning)';
        }
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
    if (!tbody) return;
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

        // Desalocar apenas os slots desta disciplina na grade de horários
        Object.keys(state.timetable).forEach(tId => {
            const agenda = state.timetable[tId];
            if (agenda) {
                activeConfig.dias.forEach(dia => {
                    if (agenda[dia]) {
                        agenda[dia] = agenda[dia].map(slot => (slot && slot.disciplinaId === id ? null : slot));
                    }
                });
                localStorage.setItem(getSchoolKey(`timetable_${tId}`), JSON.stringify(agenda));
            }
        });

        saveToStorage();
        renderDisciplinas();
        renderHorariosGrid();
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
    if (!tbody) return;
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

    // Atualizar checkboxes de dia da semana no cabeçalho
    activeConfig.dias.forEach(dia => {
        const headerCheckbox = document.querySelector(`#availability-table-editor thead .toggle-day-avail[data-day="${dia}"]`);
        if (headerCheckbox) {
            let allChecked = true;
            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                let isChecked = true;
                if (profDisponibilidade && profDisponibilidade[dia]) {
                    isChecked = profDisponibilidade[dia].includes(tempo);
                }
                if (!isChecked) {
                    allChecked = false;
                    break;
                }
            }
            headerCheckbox.checked = allChecked;
        }
    });
}

// Helpers do Editor de Disponibilidade
const btnSelectAllAvail = document.getElementById('btn-select-all-avail');
if (btnSelectAllAvail) {
    btnSelectAllAvail.addEventListener('click', () => {
        document.querySelectorAll('.avail-cell-select').forEach(cb => cb.checked = true);
        document.querySelectorAll('.toggle-day-avail').forEach(cb => cb.checked = true);
    });
}

const btnClearAllAvail = document.getElementById('btn-clear-all-avail');
if (btnClearAllAvail) {
    btnClearAllAvail.addEventListener('click', () => {
        document.querySelectorAll('.avail-cell-select').forEach(cb => cb.checked = false);
        document.querySelectorAll('.toggle-day-avail').forEach(cb => cb.checked = false);
    });
}

// Listener para marcar/desmarcar todos de um dia da semana (coluna)
const availTableEditor = document.querySelector('#availability-table-editor');
if (availTableEditor) {
    availTableEditor.addEventListener('change', (e) => {
        if (e.target.classList.contains('toggle-day-avail')) {
            const dia = e.target.getAttribute('data-day');
            const checked = e.target.checked;
            document.querySelectorAll(`#availability-table-editor tbody .avail-cell-select[data-dia="${dia}"]`).forEach(cb => {
                cb.checked = checked;
            });
        }
        
        // Atualizar checkbox de dia se o usuário marcar/desmarcar individualmente
        if (e.target.classList.contains('avail-cell-select')) {
            const dia = e.target.getAttribute('data-dia');
            const headerCheckbox = document.querySelector(`#availability-table-editor thead .toggle-day-avail[data-day="${dia}"]`);
            if (headerCheckbox) {
                const allCells = document.querySelectorAll(`#availability-table-editor tbody .avail-cell-select[data-dia="${dia}"]`);
                const allChecked = Array.from(allCells).every(cb => cb.checked);
                headerCheckbox.checked = allChecked;
            }
        }
    });
}

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
    if (confirm('Deseja realmente remover este professor? Suas aulas agendadas ficarão vagas.')) {
        state.professores = state.professores.filter(p => p.id !== id);
        
        // Desalocar apenas os slots lecionados por este professor na grade
        Object.keys(state.timetable).forEach(tId => {
            const agenda = state.timetable[tId];
            if (agenda) {
                activeConfig.dias.forEach(dia => {
                    if (agenda[dia]) {
                        agenda[dia] = agenda[dia].map(slot => (slot && slot.professorId === id ? null : slot));
                    }
                });
                localStorage.setItem(getSchoolKey(`timetable_${tId}`), JSON.stringify(agenda));
            }
        });

        saveToStorage();
        renderProfessores();
        renderHorariosGrid();
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
    if (!tbody) return;
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
    if (confirm('Deseja realmente remover esta turma e sua respectiva grade de horários?')) {
        state.turmas = state.turmas.filter(t => t.id !== id);
        
        // Limpar grade da turma da memória e do localStorage
        if (state.timetable[id]) {
            delete state.timetable[id];
        }
        localStorage.removeItem(getSchoolKey(`timetable_${id}`));

        saveToStorage();
        renderTurmas();
        renderHorariosView();
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
    // Mudar para seção de horários (apenas navega, sem gerar automaticamente)
    document.querySelector('.nav-link[data-target="horarios"]').click();
});

// Salvar Horário da Turma Atual
document.getElementById('btn-save-current-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) {
        showGenerationMessage('Nenhuma turma selecionada para salvar.', 'danger');
        return;
    }
    localStorage.setItem(getSchoolKey(`timetable_${currentTurmaId}`), JSON.stringify(state.timetable[currentTurmaId] || {}));
    showGenerationMessage('Horário da turma atual salvo com sucesso!', 'success');
});

// Retirar Tempos Vagos da Turma Atual (Compactar com validação de choques e disponibilidade)
document.getElementById('btn-compact-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) {
        showGenerationMessage('Nenhuma turma selecionada para compactar.', 'danger');
        return;
    }
    
    if (!state.timetable[currentTurmaId]) return;
    
    let changed = false;
    let conflictsSkipped = 0;

    activeConfig.dias.forEach(dia => {
        const daySchedule = state.timetable[currentTurmaId][dia];
        if (daySchedule && Array.isArray(daySchedule)) {
            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                if (daySchedule[tempo] === null) {
                    for (let nextTempo = tempo + 1; nextTempo < activeConfig.tempos; nextTempo++) {
                        const candidateLesson = daySchedule[nextTempo];
                        if (candidateLesson) {
                            const prof = state.professores.find(p => p.id === candidateLesson.professorId);
                            
                            // 1. Validar disponibilidade do professor no tempo antecipado
                            let isAvailable = true;
                            if (prof && prof.disponibilidade && prof.disponibilidade[dia]) {
                                isAvailable = prof.disponibilidade[dia].includes(tempo);
                            }

                            // 2. Validar se o professor já leciona para outra turma neste tempo
                            let hasClash = false;
                            if (isAvailable && prof) {
                                hasClash = Object.entries(state.timetable).some(([otherId, otherAgenda]) => {
                                    if (otherId === currentTurmaId) return false;
                                    const otherSlot = otherAgenda[dia] ? otherAgenda[dia][tempo] : null;
                                    return otherSlot && otherSlot.professorId === prof.id;
                                });
                            }

                            if (isAvailable && !hasClash) {
                                daySchedule[tempo] = candidateLesson;
                                daySchedule[nextTempo] = null;
                                changed = true;
                            } else {
                                conflictsSkipped++;
                            }
                            break;
                        }
                    }
                }
            }
        }
    });
    
    if (changed) {
        renderHorariosGrid();
        if (conflictsSkipped > 0) {
            showGenerationMessage(`Tempos vagos compactados! (${conflictsSkipped} aulas mantidas para evitar choques ou respeitar disponibilidades). Clique em "Salvar Horário".`, 'warning');
        } else {
            showGenerationMessage('Tempos vagos retirados com sucesso! Lembre-se de clicar em "Salvar Horário".', 'warning');
        }
    } else {
        if (conflictsSkipped > 0) {
            showGenerationMessage('Não foi possível adiantar as aulas devido a choques com outras turmas ou indisponibilidade dos docentes.', 'danger');
        } else {
            showGenerationMessage('Não há tempos vagos para retirar na turma selecionada.', 'info');
        }
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

    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) {
        showGenerationMessage('Nenhuma turma selecionada para gerar o horário.', 'danger');
        return;
    }

    // Verificar se já existe um horário salvo para esta turma no localStorage
    const saved = localStorage.getItem(getSchoolKey(`timetable_${currentTurmaId}`));
    if (saved) {
        const parsed = JSON.parse(saved);
        let hasSavedLessons = false;
        activeConfig.dias.forEach(dia => {
            if (parsed[dia] && parsed[dia].some(slot => slot !== null)) {
                hasSavedLessons = true;
            }
        });
        
        if (hasSavedLessons) {
            if (!confirm('Esta turma já possui um horário salvo. Deseja realmente gerar um novo horário e substituir a versão atual? (Observação: Para confirmar a substituição no banco de dados, você precisará clicar em "Salvar Horário" depois)')) {
                return;
            }
        }
    }

    const scheduler = new window.TimetableScheduler(state.turmas, state.professores, state.disciplinas, activeConfig);
    const result = scheduler.generate(currentTurmaId, state.timetable);

    if (result.success && result.timetable && result.timetable[currentTurmaId]) {
        state.timetable[currentTurmaId] = result.timetable[currentTurmaId];
        renderHorariosGrid();
        showGenerationMessage('Grade de horários gerada em memória para a turma atual! Lembre-se de clicar em "Salvar Horário".', 'success');
    } else if (result.isPartial && result.allocated > 0 && result.timetable && result.timetable[currentTurmaId]) {
        state.timetable[currentTurmaId] = result.timetable[currentTurmaId];
        renderHorariosGrid();
        showGenerationMessage(`Grade gerada parcialmente em memória! Alocamos ${result.allocated} de ${result.total} aulas. Ajuste e clique em "Salvar Horário"!`, 'warning');
    } else {
        showGenerationMessage('Não foi possível gerar horários de forma automática para esta turma. Verifique se os professores possuem disponibilidades cadastradas ou se há conflitos com outras turmas.', 'danger');
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
    if (!root) return;
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
    
    // Se soltar na mesma célula de origem, nenhuma alteração é necessária
    if (fromDia === targetDia && fromTempo === targetTempo) {
        return;
    }

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
        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
        <x:ExcelWorkbook>
        <x:ExcelWorksheets>
        <x:ExcelWorksheet>
        <x:Name>Grade de Horários</x:Name>
        <x:WorksheetOptions>
        <x:DisplayGridlines/>
        </x:WorksheetOptions>
        </x:ExcelWorksheet>
        </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body {
            background-color: #090d16;
            color: #f8fafc;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            padding: 24px;
          }
          .title-header {
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            padding-bottom: 8px;
            border-bottom: 2px solid #3b82f6;
            margin-bottom: 24px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #3b82f6;
            margin-top: 36px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          h3 {
            color: #f8fafc;
            font-size: 14px;
            font-weight: 700;
            margin-top: 20px;
            margin-bottom: 8px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 32px;
            background-color: #131929;
          }
          th {
            background-color: #0f1422;
            color: #94a3b8;
            font-weight: 700;
            border: 1px solid #1e293b;
            padding: 12px;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          td {
            border: 1px solid #1e293b;
            padding: 12px;
            font-size: 12px;
            color: #f8fafc;
            text-align: center;
            background-color: #131929;
            width: 180px;
            height: 54px;
          }
          .time-cell {
            background-color: #0f1422;
            color: #94a3b8;
            font-weight: 700;
            width: 140px;
          }
          .recreio-cell {
            background-color: #0f1422;
            color: #475569;
            font-style: italic;
            font-weight: 700;
            text-align: center;
          }
          /* Cores de bordas idênticas às disciplinas no app */
          .lesson-1 { border-left: 4px solid #ef4444; background-color: #1b161c; }
          .lesson-2 { border-left: 4px solid #3b82f6; background-color: #141b2e; }
          .lesson-3 { border-left: 4px solid #10b981; background-color: #112320; }
          .lesson-4 { border-left: 4px solid #f59e0b; background-color: #262117; }
          .lesson-5 { border-left: 4px solid #8b5cf6; background-color: #1d172e; }
          .lesson-6 { border-left: 4px solid #ec4899; background-color: #271424; }
          .lesson-7 { border-left: 4px solid #14b8a6; background-color: #102324; }
          .lesson-8 { border-left: 4px solid #f97316; background-color: #271b17; }
          .lesson-9 { border-left: 4px solid #6366f1; background-color: #16182e; }
          .lesson-10 { border-left: 4px solid #d946ef; background-color: #25142e; }
        </style>
        </head>
        <body>
          <div class="title-header">Chronos - Grade de Horários Escolares</div>
        `;

        // 1. Planilhas de Turmas
        html += `<div class="section-title">Horários por Turma</div>`;
        state.turmas.forEach(turma => {
            html += `<h3>Turma: ${turma.nome}</h3>`;
            html += `<table>`;
            html += `<thead><tr><th>Horário</th><th>Segunda</th><th>Terça</th><th>Quarta</th><th>Quinta</th><th>Sexta</th></tr></thead>`;
            html += `<tbody>`;

            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                if (tempo === 3) {
                    html += `<tr><td class="time-cell">09:40 - 10:10</td><td colspan="5" class="recreio-cell">☕ INTERVALO / RECREIO</td></tr>`;
                }

                html += `<tr>`;
                html += `<td class="time-cell">${tempo + 1}º Tempo<br>${activeConfig.temposHorarios[tempo]}</td>`;

                activeConfig.dias.forEach(dia => {
                    const agendaTurma = state.timetable[turma.id];
                    const aula = agendaTurma && agendaTurma[dia] ? agendaTurma[dia][tempo] : null;
                    if (aula) {
                        const disc = state.disciplinas.find(d => d.id === aula.disciplinaId);
                        const prof = state.professores.find(p => p.id === aula.professorId);
                        const styleClass = `lesson-${(aula.disciplinaId.charCodeAt(1) % 10) + 1}`;
                        html += `<td class="${styleClass}"><strong>${disc ? disc.nome : 'Sem Nome'}</strong><br>${prof ? prof.nome : 'Sem Prof'}</td>`;
                    } else {
                        html += `<td>-</td>`;
                    }
                });

                html += `</tr>`;
            }
            html += `</tbody></table>`;
        });

        // 2. Planilhas de Professores
        html += `<div class="section-title">Horários por Professor</div>`;
        state.professores.forEach(prof => {
            html += `<h3>Professor: ${prof.nome}</h3>`;
            html += `<table>`;
            html += `<thead><tr><th>Horário</th><th>Segunda</th><th>Terça</th><th>Quarta</th><th>Quinta</th><th>Sexta</th></tr></thead>`;
            html += `<tbody>`;

            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                if (tempo === 3) {
                    html += `<tr><td class="time-cell">09:40 - 10:10</td><td colspan="5" class="recreio-cell">☕ INTERVALO / RECREIO</td></tr>`;
                }

                html += `<tr>`;
                html += `<td class="time-cell">${tempo + 1}º Tempo<br>${activeConfig.temposHorarios[tempo]}</td>`;

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
                        const styleClass = `lesson-${(aulaEncontrada.disciplinaId.charCodeAt(1) % 10) + 1}`;
                        html += `<td class="${styleClass}"><strong>${disc ? disc.nome : 'Sem Nome'}</strong><br>${turmaDaAula ? turmaDaAula.nome : 'Turma'}</td>`;
                    } else {
                        const isAvailable = prof.disponibilidade && prof.disponibilidade[dia] && prof.disponibilidade[dia].includes(tempo);
                        html += isAvailable ? `<td>-</td>` : `<td style="color:#ef4444; background-color:#1c131a;">Indisponível</td>`;
                    }
                });

                html += `</tr>`;
            }
            html += `</tbody></table>`;
        });

        html += `</body></html>`;

        // Gerar o download
        const blob = new Blob(["\ufeff" + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Chronos_Horarios_Escolares.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showGenerationMessage('Grade de horários exportada com visual premium para o Excel!', 'success');
    } catch (err) {
        console.error(err);
        showGenerationMessage('Falha ao exportar grade de horários.', 'danger');
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

// ----------------------------------------------------
// AUTHENTICATION UI & VIEW CONTROLLERS
// ----------------------------------------------------

// ----------------------------------------------------
// AUTHENTICATION UI & VIEW CONTROLLERS
// ----------------------------------------------------

function showAuthScreen() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-main-container');
    const impBanner = document.getElementById('admin-impersonation-banner');
    if (authScreen) authScreen.classList.remove('d-none');
    if (appContainer) appContainer.classList.add('d-none');
    if (impBanner) impBanner.classList.add('d-none');
    
    const alertEl = document.getElementById('auth-alert');
    if (alertEl) {
        alertEl.textContent = '';
        alertEl.className = 'info-alert d-none';
    }
    const formLogin = document.getElementById('form-login');
    if (formLogin) formLogin.reset();
}

function showAppScreen(user) {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-main-container');
    const impBanner = document.getElementById('admin-impersonation-banner');
    const navAdminSchools = document.getElementById('nav-link-admin-schools');
    
    if (authScreen) authScreen.classList.add('d-none');
    if (appContainer) appContainer.classList.remove('d-none');

    const realUser = AuthManager.getRealUser();
    const isImpersonating = AuthManager.isImpersonating();
    const isSuperAdmin = realUser && realUser.role === 'superadmin';

    // Gerenciar Banner de Impersonation
    if (isSuperAdmin && isImpersonating) {
        if (impBanner) impBanner.classList.remove('d-none');
        const impNameEl = document.getElementById('impersonation-school-name');
        if (impNameEl) impNameEl.textContent = user.name;
    } else {
        if (impBanner) impBanner.classList.add('d-none');
    }

    // Visibilidade do Link de Gestão de Escolas na Sidebar
    if (navAdminSchools) {
        if (isSuperAdmin && !isImpersonating) {
            navAdminSchools.classList.remove('d-none');
        } else {
            navAdminSchools.classList.add('d-none');
        }
    }

    // Badges de Usuário e Escola no Header e Sidebar
    const badgeName = document.getElementById('school-badge-name');
    const sideSchoolName = document.getElementById('sidebar-school-name');
    
    if (isSuperAdmin && !isImpersonating) {
        if (badgeName) badgeName.innerHTML = `<span class="admin-badge-role badge-role-admin">Admin</span> ${realUser.name}`;
        if (sideSchoolName) sideSchoolName.textContent = realUser.name;
        
        // Ativar aba de Gestão de Escolas por padrão
        const adminLink = document.querySelector('.nav-link[data-target="admin-schools"]');
        if (adminLink) adminLink.click();
        renderAdminSchoolsPanel();
    } else {
        const roleLabel = isImpersonating ? 'Admin > ' : '';
        if (badgeName) badgeName.innerHTML = `<span class="admin-badge-role badge-role-school">Escola</span> ${roleLabel}${user.name}`;
        if (sideSchoolName) sideSchoolName.textContent = user.name;

        // Inicializar e renderizar dados da escola
        initData();
        renderDisciplinas();
        renderProfessores();
        renderTurmas();
        renderHorariosView();

        // Ativar dashboard por padrão
        const dashLink = document.querySelector('.nav-link[data-target="dashboard"]');
        if (dashLink) dashLink.click();
    }
}

function checkAuthAndInit() {
    AuthManager.init();
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) {
        showAuthScreen();
    } else {
        showAppScreen(currentUser);
    }
}

// Renderizar Tabela e Métricas do Painel de Escolas (Super Admin)
function renderAdminSchoolsPanel() {
    const schools = AuthManager.getSchools();
    
    let totalTurmas = 0;
    let totalProfs = 0;
    let totalDiscs = 0;

    const schoolRows = schools.map(sch => {
        let discs = [];
        let profs = [];
        let turmas = [];

        try {
            discs = JSON.parse(localStorage.getItem(`chronos_${sch.id}_disciplinas`)) || [];
            profs = JSON.parse(localStorage.getItem(`chronos_${sch.id}_professores`)) || [];
            turmas = JSON.parse(localStorage.getItem(`chronos_${sch.id}_turmas`)) || [];
        } catch (e) {}

        if (sch.isDemo && discs.length === 0) {
            discs = MOCK_DISCIPLINAS;
            profs = MOCK_PROFESSORES;
            turmas = MOCK_TURMAS;
        }

        totalDiscs += discs.length;
        totalProfs += profs.length;
        totalTurmas += turmas.length;

        return {
            ...sch,
            discCount: discs.length,
            profCount: profs.length,
            turmaCount: turmas.length
        };
    });

    const elTotalSchools = document.getElementById('stat-admin-total-schools');
    const elTotalTurmas = document.getElementById('stat-admin-total-turmas');
    const elTotalProfs = document.getElementById('stat-admin-total-profs');
    const elTotalDiscs = document.getElementById('stat-admin-total-discs');

    if (elTotalSchools) elTotalSchools.textContent = schools.length;
    if (elTotalTurmas) elTotalTurmas.textContent = totalTurmas;
    if (elTotalProfs) elTotalProfs.textContent = totalProfs;
    if (elTotalDiscs) elTotalDiscs.textContent = totalDiscs;

    const tbody = document.querySelector('#table-admin-schools tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (schools.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:30px;">Nenhuma escola cadastrada ainda.</td></tr>`;
        return;
    }

    schoolRows.forEach(sch => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${sch.name}</div>
                ${sch.isDemo ? '<span class="badge badge-secondary" style="font-size:0.65rem; margin-top:2px; display:inline-block;">Modelo Demo EMT</span>' : ''}
            </td>
            <td><code>${sch.username}</code></td>
            <td><span class="badge badge-primary">${sch.turmaCount} turmas</span></td>
            <td><span class="badge badge-secondary">${sch.profCount} docentes</span></td>
            <td><span class="badge badge-secondary">${sch.discCount} matérias</span></td>
            <td><span class="badge badge-success">Ativa</span></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                    <button class="btn-action-view" onclick="adminAccessSchool('${sch.id}')" title="Acessar ambiente desta escola">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Acessar
                    </button>
                    <button class="btn-action-pwd" onclick="adminOpenResetPassword('${sch.id}', '${sch.name.replace(/'/g, "\\'")}')" title="Redefinir senha da escola">
                        <i class="fa-solid fa-key"></i> Senha
                    </button>
                    ${!sch.isDemo ? `
                    <button class="btn-icon btn-delete" onclick="adminDeleteSchool('${sch.id}', '${sch.name.replace(/'/g, "\\'")}')" title="Excluir escola">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Ações Globais do Super Admin
window.adminAccessSchool = function(schoolId) {
    AuthManager.impersonate(schoolId);
    showAppScreen(AuthManager.getCurrentUser());
};

window.adminOpenResetPassword = function(schoolId, schoolName) {
    const inputId = document.getElementById('reset-school-id');
    const nameDisplay = document.getElementById('reset-school-name-display');
    const inputPwd = document.getElementById('input-new-school-password');
    const modal = document.getElementById('modal-school-password');
    
    if (inputId) inputId.value = schoolId;
    if (nameDisplay) nameDisplay.textContent = schoolName;
    if (inputPwd) inputPwd.value = '';
    if (modal) modal.classList.add('active');
};

window.adminDeleteSchool = function(schoolId, schoolName) {
    if (confirm(`ATENÇÃO: Deseja realmente excluir a escola "${schoolName}" e TODOS os seus horários e cadastros? Essa ação é permanente.`)) {
        AuthManager.deleteSchool(schoolId);
        renderAdminSchoolsPanel();
    }
};

function initAuthUI() {
    const formLogin = document.getElementById('form-login');
    const authAlert = document.getElementById('auth-alert');

    function setAuthAlert(msg, type) {
        if (!authAlert) return;
        authAlert.textContent = msg;
        authAlert.className = `info-alert ${type}`;
        authAlert.classList.remove('d-none');
    }

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            const username = usernameInput ? usernameInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            const res = AuthManager.login(username, password);
            if (res.success) {
                showAppScreen(res.user);
            } else {
                setAuthAlert(res.message, 'danger');
            }
        });
    }

    // Botão Voltar ao Painel Admin (quando em modo Impersonation)
    const btnExitImp = document.getElementById('btn-exit-impersonation');
    if (btnExitImp) {
        btnExitImp.addEventListener('click', () => {
            AuthManager.exitImpersonation();
            showAppScreen(AuthManager.getRealUser());
        });
    }

    // Modal Cadastrar Nova Escola (Super Admin)
    const btnOpenModalSchool = document.getElementById('btn-open-modal-school');
    const modalSchool = document.getElementById('modal-school');
    const formSchool = document.getElementById('form-school');

    if (btnOpenModalSchool && modalSchool) {
        btnOpenModalSchool.addEventListener('click', () => {
            if (formSchool) formSchool.reset();
            modalSchool.classList.add('active');
        });
    }

    if (formSchool) {
        formSchool.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('input-school-name');
            const usernameInput = document.getElementById('input-school-username');
            const passwordInput = document.getElementById('input-school-password');

            const name = nameInput ? nameInput.value : '';
            const username = usernameInput ? usernameInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            const res = AuthManager.createSchool(name, username, password);
            if (res.success) {
                if (modalSchool) modalSchool.classList.remove('active');
                renderAdminSchoolsPanel();
                alert(`Escola "${res.school.name}" cadastrada com sucesso!\nUsuário: ${res.school.username}\nSenha: ${res.school.password}`);
            } else {
                alert('Erro ao cadastrar escola: ' + res.message);
            }
        });
    }

    // Modal Redefinir Senha da Escola (Super Admin)
    const modalSchoolPwd = document.getElementById('modal-school-password');
    const formSchoolPwd = document.getElementById('form-school-password');

    if (formSchoolPwd) {
        formSchoolPwd.addEventListener('submit', (e) => {
            e.preventDefault();
            const idInput = document.getElementById('reset-school-id');
            const pwdInput = document.getElementById('input-new-school-password');

            const schoolId = idInput ? idInput.value : '';
            const newPassword = pwdInput ? pwdInput.value : '';

            const res = AuthManager.updateSchoolPassword(schoolId, newPassword);
            if (res.success) {
                if (modalSchoolPwd) modalSchoolPwd.classList.remove('active');
                alert(`Senha da escola "${res.school.name}" atualizada com sucesso!`);
            } else {
                alert('Erro ao atualizar senha: ' + res.message);
            }
        });
    }

    // Botão Sair (Logout)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            const user = AuthManager.getCurrentUser();
            const schoolName = user ? user.name : 'sua conta';
            if (confirm(`Deseja realmente sair de "${schoolName}"?`)) {
                AuthManager.logout();
                state = { disciplinas: [], professores: [], turmas: [], timetable: {} };
                showAuthScreen();
            }
        });
    }
}

// Inicialização Geral
window.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    checkAuthAndInit();

    // Evento de Exportação
    document.getElementById('btn-export-excel').addEventListener('click', exportTimetableToExcel);

    // Botão de Tema
    const themeBtn = document.getElementById('btn-toggle-theme');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = themeBtn.querySelector('i');
        icon.classList.toggle('fa-sun');
        icon.classList.toggle('fa-moon');
    });

    // Eventos de Exportação/Importação de Dados
    document.getElementById('btn-export-data').addEventListener('click', exportData);
    document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('import-data-file').click());
    document.getElementById('import-data-file').addEventListener('change', importData);

    // Eventos de Importação RAG
    const importTrigger = document.getElementById('btn-import-rag-trigger');
    const importInput = document.getElementById('input-import-rag');
    
    if (importTrigger && importInput) {
        importTrigger.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', handleRAGImport);
    }
});

// Funções de Persistência Manual (Exportação e Importação de Backup Completo por Escola)
function exportData() {
    const user = AuthManager.getCurrentUser();
    const fullTimetable = {};
    state.turmas.forEach(t => {
        const saved = localStorage.getItem(getSchoolKey(`timetable_${t.id}`));
        if (saved) {
            try {
                fullTimetable[t.id] = JSON.parse(saved);
            } catch (e) {
                fullTimetable[t.id] = state.timetable[t.id] || null;
            }
        } else if (state.timetable[t.id]) {
            fullTimetable[t.id] = state.timetable[t.id];
        }
    });

    const exportObject = {
        version: "3.0",
        exportDate: new Date().toISOString(),
        school: user ? { id: user.id, name: user.name, username: user.username } : null,
        config: activeConfig,
        disciplinas: state.disciplinas,
        professores: state.professores,
        turmas: state.turmas,
        timetable: fullTimetable
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeSchoolName = user ? user.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'escola';
    a.download = `backup_${safeSchoolName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showGenerationMessage('Backup da escola exportado com sucesso!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const rawData = JSON.parse(e.target.result);

            const parseIfNeeded = (val) => {
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (err) { return null; }
                }
                return val;
            };

            const disciplinas = parseIfNeeded(rawData.disciplinas);
            const professores = parseIfNeeded(rawData.professores);
            const turmas = parseIfNeeded(rawData.turmas);
            const timetable = parseIfNeeded(rawData.timetable);
            const config = parseIfNeeded(rawData.config);

            if (!Array.isArray(disciplinas) || !Array.isArray(professores) || !Array.isArray(turmas)) {
                alert('Erro ao importar: o arquivo JSON deve conter as listas de disciplinas, professores e turmas.');
                return;
            }

            if (config && config.dias && config.tempos) {
                activeConfig = config;
                localStorage.setItem(getSchoolKey('config'), JSON.stringify(activeConfig));
            }

            state.disciplinas = disciplinas;
            state.professores = professores;
            state.turmas = turmas;
            saveToStorage();

            if (timetable && typeof timetable === 'object') {
                state.timetable = timetable;
                state.turmas.forEach(t => {
                    if (timetable[t.id]) {
                        localStorage.setItem(getSchoolKey(`timetable_${t.id}`), JSON.stringify(timetable[t.id]));
                    }
                });
            }

            alert('Backup importado com sucesso para esta escola! A página será recarregada.');
            location.reload();
        } catch (err) {
            console.error('Erro ao importar backup:', err);
            alert('Erro ao importar arquivo: formato JSON inválido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
