// ----------------------------------------------------
// SYSTEM CONFIGURATIONS
// ----------------------------------------------------

const DEFAULT_CONFIG = {
    dias: [2, 3, 4, 5, 6],
    diasNomes: { 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' },
    tempos: 8,
    temposHorarios: ["07:10 - 08:00", "08:00 - 08:50", "08:50 - 09:40", "10:10 - 11:00", "11:00 - 11:50", "11:50 - 12:40", "12:40 - 13:30", "13:30 - 14:20"],
    segmentos: [
        { id: "seg_default_1", nome: "Ensino Médio", turno: "Matutino" },
        { id: "seg_default_2", nome: "Ensino Fundamental II", turno: "Vespertino" }
    ]
};

const JOAO_DE_DEUS_CONFIG = {
    dias: [2, 3, 4, 5, 6],
    diasNomes: { 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' },
    tempos: 6,
    temposHorarios: ["07:15 - 08:05", "08:05 - 08:55", "08:55 - 09:45", "09:45 - 10:35", "10:55 - 11:45", "11:45 - 12:35"],
    segmentos: [
        {
            id: "seg_fund2_6_7",
            nome: "Fundamental 2 (6º e 7º Ano)",
            turno: "Matutino",
            merendaAposTempo: 2, // Após o 2º tempo (08:55 às 09:15)
            horarioMerenda: "08:55 às 09:15",
            temposPorDia: { 2: 5, 3: 5, 4: 5, 5: 5, 6: 6 }, // 4 dias com 5 tempos, Sexta com 6 tempos
            temposHorarios: [
                "07:15 - 08:05",
                "08:05 - 08:55",
                "09:15 - 10:05",
                "10:05 - 10:55",
                "10:55 - 11:45",
                "11:45 - 12:35"
            ]
        },
        {
            id: "seg_fund2_8_9",
            nome: "Fundamental 2 (8º e 9º Ano)",
            turno: "Matutino",
            merendaAposTempo: 3, // Após o 3º tempo (09:45 às 10:05)
            horarioMerenda: "09:45 às 10:05",
            temposPorDia: { 2: 5, 3: 5, 4: 5, 5: 5, 6: 6 }, // 4 dias com 5 tempos, Sexta com 6 tempos
            temposHorarios: [
                "07:15 - 08:05",
                "08:05 - 08:55",
                "08:55 - 09:45",
                "10:05 - 10:55",
                "10:55 - 11:45",
                "11:45 - 12:35"
            ]
        },
        {
            id: "seg_medio",
            nome: "Ensino Médio",
            turno: "Matutino",
            merendaAposTempo: 4, // Após o 4º tempo (10:35 às 10:55)
            horarioMerenda: "10:35 às 10:55",
            temposPorDia: { 2: 6, 3: 6, 4: 6, 5: 6, 6: 6 }, // 6 tempos todos os dias
            temposHorarios: [
                "07:15 - 08:05",
                "08:05 - 08:55",
                "08:55 - 09:45",
                "09:45 - 10:35",
                "10:55 - 11:45",
                "11:45 - 12:35"
            ]
        }
    ]
};

let activeConfig = DEFAULT_CONFIG;

// ----------------------------------------------------
// MULTI-TENANT AUTHENTICATION & SESSION MANAGEMENT
// ----------------------------------------------------

const AuthManager = {
    STORAGE_USERS: 'chronos_auth_users',
    STORAGE_SESSION: 'chronos_auth_session',
    STORAGE_IMPERSONATION: 'chronos_auth_impersonation',

    init() {
        let users = this.getUsers();
        
        // 1. Garantir que a conta mestre do Super Administrador 'admin' existe com a nova senha de segurança
        let adminUser = users.find(u => u.username === 'admin');
        if (!adminUser) {
            adminUser = {
                id: 'superadmin_master',
                username: 'admin',
                password: 'Lp161176@',
                name: 'Administrador Geral',
                role: 'superadmin',
                createdAt: new Date().toISOString()
            };
            users.unshift(adminUser);
            this.saveUsers(users);
        } else {
            let updated = false;
            if (adminUser.password === 'admin' || !adminUser.password) {
                adminUser.password = 'Lp161176@';
                updated = true;
            }
            if (adminUser.role !== 'superadmin') {
                adminUser.role = 'superadmin';
                updated = true;
            }
            if (adminUser.name !== 'Administrador Geral') {
                adminUser.name = 'Administrador Geral';
                updated = true;
            }
            if (updated) {
                this.saveUsers(users);
            }
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

        // 3. Garantir que a Escola João de Deus está configurada com a estrutura especial e senha oficial
        let joaoSchool = users.find(u => 
            u.username === 'joaodedeus' || 
            (u.name && u.name.toLowerCase().includes('joão de deus')) ||
            (u.name && u.name.toLowerCase().includes('joao de deus'))
        );
        if (!joaoSchool) {
            joaoSchool = {
                id: 'school_joao_de_deus',
                username: 'joaodedeus',
                password: 'Anapaula@',
                name: 'Escola João de Deus',
                role: 'school',
                isDemo: false,
                createdAt: new Date().toISOString()
            };
            users.push(joaoSchool);
            this.saveUsers(users);
        } else {
            // Sincronizar a senha oficial 'Anapaula@' caso o navegador ainda tenha a antiga (joao123)
            if (joaoSchool.password !== 'Anapaula@') {
                joaoSchool.password = 'Anapaula@';
                this.saveUsers(users);
            }
        }

        // Aplicar a configuração específica solicitada para a Escola João de Deus
        if (joaoSchool) {
            const currentJoaoConfig = localStorage.getItem(`chronos_${joaoSchool.id}_config`);
            if (!currentJoaoConfig || !currentJoaoConfig.includes('seg_fund2_6_7')) {
                localStorage.setItem(`chronos_${joaoSchool.id}_config`, JSON.stringify(JOAO_DE_DEUS_CONFIG));
            }

            // Garantir disciplina 'Inglês/Bilíngue' (5 tempos, 1 aula/dia) para o Fundamental II
            let joaoDiscs = [];
            try {
                joaoDiscs = JSON.parse(localStorage.getItem(`chronos_${joaoSchool.id}_disciplinas`)) || [];
            } catch (e) {
                joaoDiscs = [];
            }

            let bilingueDisc = joaoDiscs.find(d => 
                d.nome.toLowerCase().includes('bilíngue') || 
                d.nome.toLowerCase().includes('bilingue') ||
                d.id === 'd_ingles_bilingue'
            );

            if (!bilingueDisc) {
                bilingueDisc = {
                    id: 'd_ingles_bilingue',
                    nome: 'Inglês/Bilíngue',
                    tempos: 5,
                    maxAulasPorDia: 1
                };
                joaoDiscs.push(bilingueDisc);
                localStorage.setItem(`chronos_${joaoSchool.id}_disciplinas`, JSON.stringify(joaoDiscs));
            } else {
                bilingueDisc.nome = 'Inglês/Bilíngue';
                bilingueDisc.tempos = 5;
                bilingueDisc.maxAulasPorDia = 1;
                localStorage.setItem(`chronos_${joaoSchool.id}_disciplinas`, JSON.stringify(joaoDiscs));
            }
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
        const cleanUser = (username || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();
        const users = this.getUsers();
        const user = users.find(u => 
            u.username.toLowerCase() === cleanUser && 
            (u.password === password || u.password === cleanPass)
        );
        if (!user) {
            return { success: false, message: 'Usuário ou senha incorretos.' };
        }
        localStorage.removeItem(this.STORAGE_IMPERSONATION);
        localStorage.setItem(this.STORAGE_SESSION, JSON.stringify({ userId: user.id, loggedAt: new Date().toISOString() }));
        return { success: true, user };
    },

    createSchool(name, username, password) {
        this.init();
        name = (name || '').trim();
        username = (username || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9_.-]/g, '');

        if (!name || !username || !password) {
            return { success: false, message: 'Preencha todos os campos do formulário (Nome, Usuário e Senha).' };
        }

        if (username === 'admin') {
            return { 
                success: false, 
                message: "O usuário 'admin' é exclusivo do Administrador Geral. Por favor, escolha outro usuário no campo 'Usuário de Acesso' (ex: 'colegionovo')." 
            };
        }

        const users = this.getUsers();
        const existingSchool = users.find(u => u.username.toLowerCase() === username);
        if (existingSchool) {
            return { 
                success: false, 
                message: `O Usuário de Acesso '${username}' já está em uso pela escola "${existingSchool.name}". Por favor, altere o campo "Usuário de Acesso" para outro identificador (ex: '${username}2').` 
            };
        }

        const newSchool = {
            id: 'school_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            username: username,
            password: password.trim(),
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

    // Se for Escola João de Deus, assegurar Inglês/Bilíngue com 5 tempos e 1 aula/dia
    if (user && (user.id === 'school_joao_de_deus' || user.username === 'joaodedeus')) {
        let bilingue = state.disciplinas.find(d => 
            d.nome.toLowerCase().includes('bilíngue') || 
            d.nome.toLowerCase().includes('bilingue') || 
            d.id === 'd_ingles_bilingue'
        );
        if (!bilingue) {
            bilingue = {
                id: 'd_ingles_bilingue',
                nome: 'Inglês/Bilíngue',
                tempos: 5,
                maxAulasPorDia: 1
            };
            state.disciplinas.push(bilingue);
        } else {
            bilingue.nome = 'Inglês/Bilíngue';
            bilingue.tempos = 5;
            bilingue.maxAulasPorDia = 1;
        }
    }

    // Verificação preventiva e auto-correção de choques/tempos vagos ao carregar os dados
    if (state.turmas && state.turmas.length > 0 && Object.keys(state.timetable).length > 0) {
        const initialClashes = detectAllClashes();
        const initialGaps = countTurmaGaps();
        if (initialClashes.length > 0 || initialGaps > 0) {
            smartCompactAndResolveTimetable(null);
        }
    }

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
            horarios: { title: 'Grade de Horários', subtitle: 'Geração inteligente e ajuste interativo por drag-and-drop' },
            config: { title: 'Configurações da Escola', subtitle: 'Personalização de dias letivos, tempos de aula e segmentos de ensino' }
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
        if (target === 'config') renderConfigView();
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
    const selMax = document.getElementById('select-disciplina-max-diario');
    if (selMax) selMax.value = '2';
    modalDisciplina.classList.add('active');
});

formDisciplina.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-disciplina-id').value;
    const nome = document.getElementById('input-disciplina-nome').value;
    const tempos = parseInt(document.getElementById('input-disciplina-tempos').value, 10) || 4;
    const selMax = document.getElementById('select-disciplina-max-diario');
    const maxAulasPorDia = selMax ? (parseInt(selMax.value, 10) || 2) : 2;

    if (id) {
        // Editar
        const disc = state.disciplinas.find(d => d.id === id);
        if (disc) {
            disc.nome = nome;
            disc.tempos = tempos;
            disc.maxAulasPorDia = maxAulasPorDia;
        }
    } else {
        // Novo
        state.disciplinas.push({
            id: 'd_' + Date.now(),
            nome: nome,
            tempos: tempos,
            maxAulasPorDia: maxAulasPorDia
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
        const badgeMaxDiario = (disc.maxAulasPorDia === 1)
            ? `<span class="badge" style="background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); margin-left: 6px; font-size: 0.72rem;"><i class="fa-solid fa-calendar-day"></i> 1 aula/dia</span>`
            : '';

        tr.innerHTML = `
            <td style="font-weight: 600;">${disc.nome} ${badgeMaxDiario}</td>
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
    const selMax = document.getElementById('select-disciplina-max-diario');
    if (selMax) selMax.value = (disc.maxAulasPorDia !== undefined) ? String(disc.maxAulasPorDia) : '2';
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
    const thead = document.querySelector('#availability-table-editor thead');
    const tbody = document.querySelector('#availability-table-editor tbody');
    if (!tbody) return;

    if (thead) {
        let theadHtml = '<tr><th>Período / Aula</th>';
        activeConfig.dias.forEach(dia => {
            const diaNomeCurto = (activeConfig.diasNomes[dia] || 'Dia').slice(0, 3);
            theadHtml += `<th><label style="cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700;"><input type="checkbox" class="toggle-day-avail" data-day="${dia}"> ${diaNomeCurto}</label></th>`;
        });
        theadHtml += '</tr>';
        thead.innerHTML = theadHtml;
    }

    tbody.innerHTML = '';

    for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
        const tr = document.createElement('tr');
        const horarioTxt = (activeConfig.temposHorarios && activeConfig.temposHorarios[tempo]) ? activeConfig.temposHorarios[tempo] : '';
        tr.innerHTML = `<td><strong>${tempo + 1}º Tempo</strong><br><span style="font-size:0.75rem; color: var(--text-muted);">${horarioTxt}</span></td>`;
        
        activeConfig.dias.forEach(dia => {
            let isChecked = true; // Por padrão, ativo para novos cadastros
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
    const selectDia6 = document.getElementById('select-turma-dia-6-tempos');
    if (selectDia6) selectDia6.value = 'auto';
    populateSegmentosSelect();
    renderTurmaCargaInputs({});
    modalTurma.classList.add('active');
});

formTurma.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-turma-id').value;
    const nome = document.getElementById('input-turma-nome').value;
    const selectSeg = document.getElementById('input-turma-segmento');
    const segmentoId = selectSeg ? selectSeg.value : '';
    const selectDia6 = document.getElementById('select-turma-dia-6-tempos');
    const diaCom6Tempos = selectDia6 ? selectDia6.value : 'auto';

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
            turma.segmentoId = segmentoId || null;
            turma.diaCom6Tempos = diaCom6Tempos;
            turma.cargaHoraria = cargaHoraria;
        }
    } else {
        // Novo
        state.turmas.push({
            id: 't_' + Date.now(),
            nome: nome,
            segmentoId: segmentoId || null,
            diaCom6Tempos: diaCom6Tempos,
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

    const mapDiaNome = { 'auto': 'Auto', '2': 'Seg', '3': 'Ter', '4': 'Qua', '5': 'Qui', '6': 'Sex' };

    state.turmas.forEach(turma => {
        let listCargaText = [];
        Object.entries(turma.cargaHoraria || {}).forEach(([dId, horas]) => {
            const d = state.disciplinas.find(disc => disc.id === dId);
            if (d) {
                listCargaText.push(`${d.nome}: ${horas}h`);
            }
        });

        const seg = (activeConfig.segmentos || []).find(s => s.id === turma.segmentoId);
        const segBadge = seg ? `<span class="badge badge-secondary" style="font-size:0.75rem; margin-left: 8px;"><i class="fa-solid fa-graduation-cap"></i> ${seg.nome} (${seg.turno})</span>` : '';
        
        let dia6Badge = '';
        if (seg && (seg.id.includes('fund2') || seg.nome.toLowerCase().includes('fundamental'))) {
            const diaEscolhido = turma.diaCom6Tempos || turma.diaCom6TemposEfetivo || 'auto';
            const nomeDia = mapDiaNome[diaEscolhido] || diaEscolhido;
            dia6Badge = `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 0.72rem; margin-left: 6px;"><i class="fa-solid fa-clock"></i> 6 tempos: ${nomeDia}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${turma.nome} ${segBadge} ${dia6Badge}</td>
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
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Nenhuma disciplina cadastrada. Cadastre disciplinas primeiro.</p>';
        return;
    }

    state.disciplinas.forEach(d => {
        const row = document.createElement('div');
        row.className = 'workload-input-row';
        const val = cargaExistente[d.id] !== undefined ? cargaExistente[d.id] : d.tempos;
        row.innerHTML = `
            <span>${d.nome}</span>
            <input type="number" min="0" max="20" class="form-control workload-input" data-disciplina-id="${d.id}" value="${val}">
        `;
        container.appendChild(row);
    });
}

window.editTurma = function(id) {
    const turma = state.turmas.find(t => t.id === id);
    if (!turma) return;

    populateSegmentosSelect();
    document.getElementById('modal-turma-title').textContent = 'Editar Turma';
    document.getElementById('edit-turma-id').value = turma.id;
    document.getElementById('input-turma-nome').value = turma.nome;
    const selectSeg = document.getElementById('input-turma-segmento');
    if (selectSeg) selectSeg.value = turma.segmentoId || '';
    const selectDia6 = document.getElementById('select-turma-dia-6-tempos');
    if (selectDia6) selectDia6.value = turma.diaCom6Tempos || 'auto';

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
const btnGenerateAll = document.getElementById('btn-generate-all-timetables');
if (btnGenerateAll) {
    btnGenerateAll.addEventListener('click', generateAllTimetablesFlow);
}

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

// ====================================================
// AUDITORIA E RESOLUÇÃO COORDENADA DE CHOQUES & TEMPOS VAGOS
// ====================================================

// 1. Detectar choques de horário em todas as turmas
function detectAllClashes(timetableMap = state.timetable, turmasList = state.turmas, profsList = state.professores) {
    const clashes = [];
    const profMap = new Map(profsList.map(p => [p.id, p]));
    activeConfig.dias.forEach(dia => {
        for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
            const profOccupancy = {};
            turmasList.forEach(turma => {
                const agenda = timetableMap[turma.id];
                const slot = agenda && agenda[dia] ? agenda[dia][tempo] : null;
                if (slot && slot.professorId) {
                    if (!profOccupancy[slot.professorId]) profOccupancy[slot.professorId] = [];
                    const disc = state.disciplinas.find(d => d.id === slot.disciplinaId);
                    profOccupancy[slot.professorId].push({
                        turmaId: turma.id,
                        turmaNome: turma.nome,
                        disciplinaId: slot.disciplinaId,
                        disciplinaNome: disc ? disc.nome : 'Disciplina',
                        slot
                    });
                }
            });
            Object.entries(profOccupancy).forEach(([profId, list]) => {
                if (list.length > 1) {
                    const prof = profMap.get(profId);
                    clashes.push({
                        dia,
                        tempo,
                        professorId: profId,
                        professorNome: prof ? prof.nome : 'Professor',
                        turmas: list
                    });
                }
            });
        }
    });
    return clashes;
}

// 2. Contar tempos vagos (gaps) dentro da jornada de cada turma
function countTurmaGaps(timetableMap = state.timetable, turmasList = state.turmas) {
    let gaps = 0;
    turmasList.forEach(turma => {
        activeConfig.dias.forEach(dia => {
            const daySlots = timetableMap[turma.id] ? timetableMap[turma.id][dia] : null;
            if (!daySlots) return;
            let lastLesson = -1;
            for (let t = 0; t < activeConfig.tempos; t++) {
                if (daySlots[t] !== null) lastLesson = t;
            }
            if (lastLesson > 0) {
                for (let t = 0; t < lastLesson; t++) {
                    if (daySlots[t] === null) gaps++;
                }
            }
        });
    });
    return gaps;
}

// 3. Auditoria visual: ativa/desativa o banner de choques
function auditAndHighlightClashes() {
    const banner = document.getElementById('clash-alert-banner');
    if (!banner) return;

    const clashes = detectAllClashes();
    if (clashes.length > 0) {
        banner.classList.remove('d-none');
        const titleEl = document.getElementById('clash-alert-title');
        const subEl = document.getElementById('clash-alert-subtitle');
        if (titleEl) {
            titleEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Atenção: ${clashes.length} Choque(s) de Horário Detectado(s)!`;
        }
        if (subEl) {
            const details = clashes.slice(0, 3).map(c => 
                `<strong>${c.professorNome}</strong> (${activeConfig.diasNomes[c.dia]} ${c.tempo + 1}ºT: ${c.turmas.map(t => t.turmaNome).join(' e ')})`
            ).join('; ');
            const moreText = clashes.length > 3 ? ` (+${clashes.length - 3} outros)` : '';
            subEl.innerHTML = `Conflitos ativos: ${details}${moreText}. Clique ao lado para corrigir automaticamente.`;
        }
    } else {
        banner.classList.add('d-none');
    }
}

// 4. Motor Coordenado de Compactação e Resolução de Choques
function smartCompactAndResolveTimetable(targetTurmaId = null) {
    const profMap = new Map(state.professores.map(p => [p.id, p]));
    const discMap = new Map(state.disciplinas.map(d => [d.id, d]));
    const affectedTurmas = new Set();
    let totalGapsClosed = 0;
    let totalClashesResolved = 0;

    function isProfAvailable(pId, dia, tempo) {
        const prof = profMap.get(pId);
        if (!prof) return false;
        if (prof.disponibilidade && prof.disponibilidade[dia]) {
            return prof.disponibilidade[dia].includes(tempo);
        }
        return true;
    }

    function isProfFreeInOtherTurmas(pId, dia, tempo, excludeTurmaId) {
        for (let otherT of state.turmas) {
            if (otherT.id === excludeTurmaId) continue;
            const slot = state.timetable[otherT.id] && state.timetable[otherT.id][dia] ? state.timetable[otherT.id][dia][tempo] : null;
            if (slot && slot.professorId === pId) return false;
        }
        return true;
    }

    function isSlotDisabled(turma, dia, tempo) {
        if (!turma) return false;
        let totalCarga = 0;
        if (turma.cargaHoraria) {
            totalCarga = Object.values(turma.cargaHoraria).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
        }
        const seg = turma.segmentoId ? (activeConfig.segmentos || []).find(s => s.id === turma.segmentoId) : null;
        const isFund2 = (seg && (seg.id.includes('fund2') || seg.nome.toLowerCase().includes('fundamental'))) || totalCarga === 26;

        if (isFund2) {
            if (turma.diaCom6Tempos && turma.diaCom6Tempos !== 'auto') {
                const dia6 = parseInt(turma.diaCom6Tempos, 10);
                return dia === dia6 ? tempo >= 6 : tempo >= 5;
            }
            if (turma.diaCom6TemposEfetivo) {
                const dia6 = parseInt(turma.diaCom6TemposEfetivo, 10);
                return dia === dia6 ? tempo >= 6 : tempo >= 5;
            }
            if (tempo >= 6) return true;
            // Se não fixou dia6, buscar na grade existente
            const agenda = state.timetable[turma.id];
            let dia6 = 6;
            if (agenda) {
                activeConfig.dias.forEach(d => {
                    if (agenda[d] && agenda[d][5] !== null) dia6 = d;
                });
            }
            return dia === dia6 ? tempo >= 6 : tempo >= 5;
        }

        if (seg && seg.temposPorDia && !isFund2) {
            const maxTemposNoDia = seg.temposPorDia[dia] !== undefined ? seg.temposPorDia[dia] : activeConfig.tempos;
            return tempo >= maxTemposNoDia;
        }

        return tempo >= activeConfig.tempos;
    }

    // FASE 1: RESOLUÇÃO DIRETA DE CHOQUES PRÉ-EXISTENTES
    let clashPasses = 0;
    while (clashPasses < 30) {
        clashPasses++;
        const currentClashes = detectAllClashes();
        if (currentClashes.length === 0) break;

        let passChanged = false;
        for (let clash of currentClashes) {
            const { dia, tempo, professorId, turmas: clashTurmas } = clash;

            for (let i = 1; i < clashTurmas.length; i++) {
                const confTurma = state.turmas.find(t => t.id === clashTurmas[i].turmaId);
                if (!confTurma) continue;

                const daySlots = state.timetable[confTurma.id][dia];
                if (!daySlots) continue;
                const lessonToMove = daySlots[tempo];
                if (!lessonToMove) continue;

                let resolved = false;

                // Opção 1A: Mover para um tempo vazio da mesma turma onde o prof está livre
                for (let t2 = 0; t2 < activeConfig.tempos; t2++) {
                    if (t2 === tempo || isSlotDisabled(confTurma, dia, t2)) continue;
                    if (daySlots[t2] === null && isProfAvailable(professorId, dia, t2) && isProfFreeInOtherTurmas(professorId, dia, t2, confTurma.id)) {
                        daySlots[t2] = lessonToMove;
                        daySlots[tempo] = null;
                        affectedTurmas.add(confTurma.id);
                        totalClashesResolved++;
                        passChanged = true;
                        resolved = true;
                        break;
                    }
                }
                if (resolved) break;

                // Opção 1B: Troca intra-dia na mesma turma com outra aula
                for (let t2 = 0; t2 < activeConfig.tempos; t2++) {
                    if (t2 === tempo || isSlotDisabled(confTurma, dia, t2)) continue;
                    const otherLesson = daySlots[t2];
                    if (otherLesson && otherLesson.professorId !== professorId) {
                        if (isProfAvailable(otherLesson.professorId, dia, tempo) &&
                            isProfFreeInOtherTurmas(otherLesson.professorId, dia, tempo, confTurma.id) &&
                            isProfAvailable(professorId, dia, t2) &&
                            isProfFreeInOtherTurmas(professorId, dia, t2, confTurma.id)) {
                            
                            daySlots[tempo] = otherLesson;
                            daySlots[t2] = lessonToMove;
                            affectedTurmas.add(confTurma.id);
                            totalClashesResolved++;
                            passChanged = true;
                            resolved = true;
                            break;
                        }
                    }
                }
                if (resolved) break;
            }
            if (passChanged) break;
        }
        if (!passChanged) break;
    }

    // FASE 2: COMPACTAÇÃO COORDENADA COM AJUSTE DE OUTRAS TURMAS
    const orderedTurmas = targetTurmaId 
        ? [state.turmas.find(t => t.id === targetTurmaId), ...state.turmas.filter(t => t.id !== targetTurmaId)].filter(Boolean)
        : state.turmas;

    let compactPasses = 0;
    let compactChanged = true;

    while (compactChanged && compactPasses < 35) {
        compactChanged = false;
        compactPasses++;

        for (let turma of orderedTurmas) {
            for (let dia of activeConfig.dias) {
                const daySlots = state.timetable[turma.id] ? state.timetable[turma.id][dia] : null;
                if (!daySlots) continue;

                for (let emptyTempo = 0; emptyTempo < activeConfig.tempos; emptyTempo++) {
                    if (isSlotDisabled(turma, dia, emptyTempo)) continue;

                    if (daySlots[emptyTempo] === null) {
                        for (let nextTempo = emptyTempo + 1; nextTempo < activeConfig.tempos; nextTempo++) {
                            const lesson = daySlots[nextTempo];
                            if (!lesson) continue;

                            const prof = profMap.get(lesson.professorId);
                            if (!prof) continue;

                            if (!isProfAvailable(prof.id, dia, emptyTempo)) continue;

                            // Verificar turmas com choque neste tempo
                            const conflictingTurmas = [];
                            state.turmas.forEach(otherT => {
                                if (otherT.id === turma.id) return;
                                const otherSlot = state.timetable[otherT.id] && state.timetable[otherT.id][dia] ? state.timetable[otherT.id][dia][emptyTempo] : null;
                                if (otherSlot && otherSlot.professorId === prof.id) {
                                    conflictingTurmas.push(otherT);
                                }
                            });

                            // Caso 1: Sem choque -> Mover direto!
                            if (conflictingTurmas.length === 0) {
                                daySlots[emptyTempo] = lesson;
                                daySlots[nextTempo] = null;
                                affectedTurmas.add(turma.id);
                                totalGapsClosed++;
                                compactChanged = true;
                                break;
                            }

                            // Caso 2: Com choque -> Ajustar a outra turma coordenadamente!
                            let resolvedOther = false;
                            for (let otherTurma of conflictingTurmas) {
                                const otherDaySlots = state.timetable[otherTurma.id][dia];
                                if (!otherDaySlots) continue;

                                // Opção 2A: Outra turma tem nextTempo livre (e nextTempo não é desabilitado)
                                if (otherDaySlots[nextTempo] === null && !isSlotDisabled(otherTurma, dia, nextTempo) && isProfAvailable(prof.id, dia, nextTempo)) {
                                    otherDaySlots[nextTempo] = otherDaySlots[emptyTempo];
                                    otherDaySlots[emptyTempo] = null;

                                    daySlots[emptyTempo] = lesson;
                                    daySlots[nextTempo] = null;

                                    affectedTurmas.add(turma.id);
                                    affectedTurmas.add(otherTurma.id);
                                    totalGapsClosed++;
                                    compactChanged = true;
                                    resolvedOther = true;
                                    break;
                                }

                                // Opção 2B: Outra turma pode trocar intra-dia com outro docente
                                for (let t2 = 0; t2 < activeConfig.tempos; t2++) {
                                    if (t2 === emptyTempo || isSlotDisabled(otherTurma, dia, t2)) continue;
                                    const otherLesson2 = otherDaySlots[t2];
                                    if (otherLesson2 && otherLesson2.professorId !== prof.id) {
                                        const prof2 = profMap.get(otherLesson2.professorId);
                                        if (prof2 && isProfAvailable(prof2.id, dia, emptyTempo) &&
                                            isProfFreeInOtherTurmas(prof2.id, dia, emptyTempo, otherTurma.id) &&
                                            isProfAvailable(prof.id, dia, t2) &&
                                            isProfFreeInOtherTurmas(prof.id, dia, t2, otherTurma.id)) {
                                            
                                            otherDaySlots[emptyTempo] = otherLesson2;
                                            otherDaySlots[t2] = { disciplinaId: otherDaySlots[emptyTempo].disciplinaId, professorId: prof.id };

                                            daySlots[emptyTempo] = lesson;
                                            daySlots[nextTempo] = null;

                                            affectedTurmas.add(turma.id);
                                            affectedTurmas.add(otherTurma.id);
                                            totalGapsClosed++;
                                            compactChanged = true;
                                            resolvedOther = true;
                                            break;
                                        }
                                    }
                                }
                                if (resolvedOther) break;

                                // Opção 2C: Adiantar outra aula posterior da turma atual
                                for (let altTempo = nextTempo + 1; altTempo < activeConfig.tempos; altTempo++) {
                                    const altLesson = daySlots[altTempo];
                                    if (altLesson && isProfAvailable(altLesson.professorId, dia, emptyTempo) &&
                                        isProfFreeInOtherTurmas(altLesson.professorId, dia, emptyTempo, turma.id)) {
                                        
                                        daySlots[emptyTempo] = altLesson;
                                        daySlots[altTempo] = null;

                                        affectedTurmas.add(turma.id);
                                        totalGapsClosed++;
                                        compactChanged = true;
                                        resolvedOther = true;
                                        break;
                                    }
                                }
                                if (resolvedOther) break;
                            }

                            if (resolvedOther) break;
                        }
                    }
                }
            }
        }
    }

    // FASE 3: COMPACTAÇÃO DE CONTIGUIDADE ESTRITA (Zero Janelas Garantido)
    activeConfig.dias.forEach(dia => {
        orderedTurmas.forEach(turma => {
            const daySlots = state.timetable[turma.id] ? state.timetable[turma.id][dia] : null;
            if (!daySlots) return;

            const lessons = daySlots.filter(s => s !== null);
            const k = lessons.length;
            
            let hasInternalGap = false;
            for (let t = 0; t < k; t++) {
                if (daySlots[t] === null) hasInternalGap = true;
            }

            if (hasInternalGap) {
                for (let t = 0; t < activeConfig.tempos; t++) {
                    if (t < k && !isSlotDisabled(turma, dia, t)) {
                        daySlots[t] = lessons[t];
                    } else {
                        daySlots[t] = null;
                    }
                }
                affectedTurmas.add(turma.id);
                totalGapsClosed++;
            }
        });
    });

    // Revalidar se a contiguidade estrita gerou algum choque e resolvê-lo mantendo contiguidade
    let postClashes = detectAllClashes();
    let postPasses = 0;
    while (postClashes.length > 0 && postPasses < 40) {
        postPasses++;
        let improved = false;
        for (let clash of postClashes) {
            const { dia, tempo, professorId, turmas: clashTurmas } = clash;
            for (let item of clashTurmas) {
                const turma = state.turmas.find(t => t.id === item.turmaId);
                if (!turma) continue;
                const daySlots = state.timetable[turma.id][dia];
                const k = daySlots.filter(s => s !== null).length;

                for (let t2 = 0; t2 < k; t2++) {
                    if (t2 === tempo || isSlotDisabled(turma, dia, t2)) continue;
                    const lA = daySlots[tempo];
                    const lB = daySlots[t2];
                    if (!isProfAvailable(lA.professorId, dia, t2)) continue;
                    if (lB && !isProfAvailable(lB.professorId, dia, tempo)) continue;

                    daySlots[tempo] = lB;
                    daySlots[t2] = lA;
                    const newClashCount = detectAllClashes().length;
                    if (newClashCount < postClashes.length) {
                        affectedTurmas.add(turma.id);
                        improved = true;
                        break;
                    } else {
                        daySlots[tempo] = lA;
                        daySlots[t2] = lB;
                    }
                }
                if (improved) break;
            }
            if (improved) break;
        }
        if (!improved) break;
        postClashes = detectAllClashes();
    }

    // FASE 3.5: CROSS-DAY REPAIR (Se restar qualquer choque, efetuar troca inter-dias segura)
    let crossDayClashes = detectAllClashes();
    if (crossDayClashes.length > 0) {
        for (let clash of crossDayClashes) {
            const { dia, tempo, professorId, turmas: clashTurmas } = clash;
            for (let item of clashTurmas) {
                const turma = state.turmas.find(t => t.id === item.turmaId);
                if (!turma) continue;

                const daySlots = state.timetable[turma.id][dia];
                if (!daySlots) continue;
                const lessonA = daySlots[tempo];
                if (!lessonA || lessonA.professorId !== professorId) continue;

                let crossDayResolved = false;
                for (let otherDia of activeConfig.dias) {
                    if (otherDia === dia) continue;
                    const otherDaySlots = state.timetable[turma.id][otherDia];
                    if (!otherDaySlots) continue;

                    const kOther = otherDaySlots.filter(s => s !== null).length;
                    for (let otherTempo = 0; otherTempo < kOther; otherTempo++) {
                        if (isSlotDisabled(turma, otherDia, otherTempo)) continue;
                        const lessonB = otherDaySlots[otherTempo];
                        if (!lessonB) continue;

                        if (isProfAvailable(lessonA.professorId, otherDia, otherTempo) &&
                            isProfFreeInOtherTurmas(lessonA.professorId, otherDia, otherTempo, turma.id) &&
                            isProfAvailable(lessonB.professorId, dia, tempo) &&
                            isProfFreeInOtherTurmas(lessonB.professorId, dia, tempo, turma.id)) {

                            const discA = discMap.get(lessonA.disciplinaId);
                            const discB = discMap.get(lessonB.disciplinaId);
                            const maxA = discA && discA.maxAulasPorDia ? discA.maxAulasPorDia : 2;
                            const maxB = discB && discB.maxAulasPorDia ? discB.maxAulasPorDia : 2;

                            const countAInOtherDia = otherDaySlots.filter(s => s && s.disciplinaId === lessonA.disciplinaId).length;
                            const countBInDia = daySlots.filter(s => s && s.disciplinaId === lessonB.disciplinaId).length;

                            if (countAInOtherDia < maxA && countBInDia < maxB) {
                                daySlots[tempo] = lessonB;
                                otherDaySlots[otherTempo] = lessonA;
                                affectedTurmas.add(turma.id);
                                totalClashesResolved++;
                                crossDayResolved = true;
                                break;
                            }
                        }
                    }
                    if (crossDayResolved) break;
                }
                if (crossDayResolved) break;
            }
        }
    }

    // FASE 4: MINIMIZAR TEMPOS VAGOS DE PROFESSORES (Janelas Docentes)
    state.professores.forEach(prof => {
        activeConfig.dias.forEach(dia => {
            state.turmas.forEach(turma => {
                const daySlots = state.timetable[turma.id] ? state.timetable[turma.id][dia] : null;
                if (!daySlots) return;
                const k = daySlots.filter(s => s !== null).length;

                for (let t1 = 0; t1 < k; t1++) {
                    for (let t2 = t1 + 1; t2 < k; t2++) {
                        const l1 = daySlots[t1];
                        const l2 = daySlots[t2];
                        if (!l1 || !l2) continue;
                        if (l1.professorId === prof.id || l2.professorId === prof.id) {
                            if (isProfAvailable(l1.professorId, dia, t2) && isProfAvailable(l2.professorId, dia, t1)) {
                                daySlots[t1] = l2;
                                daySlots[t2] = l1;
                                if (detectAllClashes().length > 0) {
                                    daySlots[t1] = l1;
                                    daySlots[t2] = l2;
                                } else {
                                    affectedTurmas.add(turma.id);
                                }
                            }
                        }
                    }
                }
            });
        });
    });

    // FASE 5: SALVAR TODAS AS TURMAS AFETADAS NO LOCALSTORAGE
    affectedTurmas.forEach(tId => {
        if (state.timetable[tId]) {
            localStorage.setItem(getSchoolKey(`timetable_${tId}`), JSON.stringify(state.timetable[tId]));
        }
    });
    saveToStorage();

    renderHorariosGrid();
    auditAndHighlightClashes();

    const finalClashes = detectAllClashes().length;
    const finalGaps = countTurmaGaps();

    return {
        affectedTurmasCount: affectedTurmas.size,
        totalGapsClosed,
        totalClashesResolved,
        finalClashes,
        finalGaps
    };
}

// Botão Retirar Tempos Vagos
document.getElementById('btn-compact-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) {
        showGenerationMessage('Nenhuma turma selecionada para compactar.', 'danger');
        return;
    }
    
    showGenerationMessage('Retirando tempos vagos e coordenando horários com as demais turmas...', 'info');

    setTimeout(() => {
        const res = smartCompactAndResolveTimetable(currentTurmaId);
        if (res.affectedTurmasCount > 0) {
            if (res.finalClashes === 0 && res.finalGaps === 0) {
                showGenerationMessage(`Grade compactada com sucesso! ${res.affectedTurmasCount} turma(s) sincronizada(s) e salvas. Zero tempos vagos e zero choques!`, 'success');
            } else if (res.finalClashes > 0) {
                showGenerationMessage(`Tempos vagos compactados em ${res.affectedTurmasCount} turma(s). Resta(m) ${res.finalClashes} choque(s) devido a restrições rígidas de disponibilidade docente.`, 'warning');
            } else {
                showGenerationMessage(`Tempos vagos retirados e horários salvos para ${res.affectedTurmasCount} turma(s)!`, 'success');
            }
        } else {
            showGenerationMessage('Não há tempos vagos ou choques a retirar nas turmas.', 'info');
        }
    }, 50);
});

// Botão do Banner: Corrigir Todos os Choques
const btnFixClashes = document.getElementById('btn-fix-all-clashes');
if (btnFixClashes) {
    btnFixClashes.addEventListener('click', () => {
        showGenerationMessage('Corrigindo choques de horário e compactando a grade de todas as turmas...', 'info');
        setTimeout(() => {
            const res = smartCompactAndResolveTimetable(null);
            if (res.finalClashes === 0) {
                showGenerationMessage('Todos os choques de horário foram corrigidos e as turmas compactadas com sucesso!', 'success');
            } else {
                showGenerationMessage(`Ajuste coordenado executado. Restam ${res.finalClashes} conflitos devido a restrições estritas de disponibilidade docente.`, 'warning');
            }
        }, 50);
    });
}

document.getElementById('btn-reset-timetable').addEventListener('click', () => {
    const currentTurmaId = selectTimetableTurma.value;
    if (!currentTurmaId) return;
    if (confirm('Deseja limpar o horário planejado para a turma atual?')) {
        state.timetable[currentTurmaId] = {};
        activeConfig.dias.forEach(dia => {
            state.timetable[currentTurmaId][dia] = Array(activeConfig.tempos).fill(null);
        });
        localStorage.removeItem(getSchoolKey(`timetable_${currentTurmaId}`));
        renderHorariosGrid();
        showGenerationMessage('Horários da turma limpos com sucesso.', 'warning');
    }
});

function showGenerationMessage(msg, type) {
    const alertEl = document.getElementById('generation-message');
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.className = `info-alert ${type}`;
    alertEl.classList.remove('d-none');
    setTimeout(() => {
        alertEl.classList.add('d-none');
    }, 8000);
}

// GERAÇÃO GLOBAL: TODAS AS TURMAS DA ESCOLA
function generateAllTimetablesFlow() {
    if (state.turmas.length === 0 || state.professores.length === 0) {
        showGenerationMessage('Cadastre turmas, disciplinas e professores antes de gerar o horário.', 'danger');
        return;
    }

    if (!confirm(`Deseja gerar a grade de horários para TODAS as ${state.turmas.length} turmas da escola? Os horários gerados serão automaticamente calculados e salvos para todas as turmas.`)) {
        return;
    }

    showGenerationMessage('Gerando grade completa de todas as turmas...', 'info');

    const scheduler = new window.TimetableScheduler(state.turmas, state.professores, state.disciplinas, activeConfig);
    const result = scheduler.generate(null, null);

    if (result.timetable) {
        state.timetable = result.timetable;
        
        // Salvar automaticamente para cada turma no localStorage
        state.turmas.forEach(t => {
            if (result.timetable[t.id]) {
                localStorage.setItem(getSchoolKey(`timetable_${t.id}`), JSON.stringify(result.timetable[t.id]));
            }
        });

        // Pós-processamento e garantia de compacidade e zero choques
        smartCompactAndResolveTimetable(null);

        saveToStorage();
        renderTurmas();
        renderHorariosGrid();

        if (result.success) {
            showGenerationMessage(`Grade de horários gerada e salva com 100% de sucesso para todas as ${state.turmas.length} turmas da escola! (Fundamental II com 26 tempos e Ensino Médio com 30 tempos).`, 'success');
        } else {
            showGenerationMessage(`Grade gerada parcialmente (${result.allocated} de ${result.total} aulas alocadas) e salva no sistema.`, 'warning');
        }
    } else {
        showGenerationMessage('Não foi possível gerar a grade global. Verifique se os professores possuem disponibilidades cadastradas.', 'danger');
    }
}

// GERAÇÃO INDIVIDUAL: TURMA SELECIONADA
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
            if (!confirm('Esta turma já possui um horário salvo. Deseja realmente gerar um novo horário e substituir a versão atual?')) {
                return;
            }
        }
    }

    const scheduler = new window.TimetableScheduler(state.turmas, state.professores, state.disciplinas, activeConfig);
    const result = scheduler.generate(currentTurmaId, state.timetable);

    if (result.success && result.timetable && result.timetable[currentTurmaId]) {
        state.timetable = result.timetable;
        state.turmas.forEach(t => {
            if (result.timetable[t.id]) {
                localStorage.setItem(getSchoolKey(`timetable_${t.id}`), JSON.stringify(result.timetable[t.id]));
            }
        });
        smartCompactAndResolveTimetable(currentTurmaId);
        saveToStorage();
        renderTurmas();
        renderHorariosGrid();
        showGenerationMessage('Grade de horários gerada e salva com sucesso para a turma atual!', 'success');
    } else if (result.isPartial && result.allocated > 0 && result.timetable && result.timetable[currentTurmaId]) {
        state.timetable = result.timetable;
        state.turmas.forEach(t => {
            if (result.timetable[t.id]) {
                localStorage.setItem(getSchoolKey(`timetable_${t.id}`), JSON.stringify(result.timetable[t.id]));
            }
        });
        smartCompactAndResolveTimetable(currentTurmaId);
        saveToStorage();
        renderTurmas();
        renderHorariosGrid();
        showGenerationMessage(`Grade gerada parcialmente e salva! Alocamos ${result.allocated} de ${result.total} aulas.`, 'warning');
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
    root.style.gridTemplateColumns = `120px repeat(${activeConfig.dias.length}, 1fr)`;

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

    // Identificar segmento da turma se estiver no modo turma
    let currentTurma = null;
    let currentSegment = null;
    if (viewMode === 'turma') {
        currentTurma = state.turmas.find(t => t.id === currentTurmaId);
        if (currentTurma && currentTurma.segmentoId) {
            currentSegment = (activeConfig.segmentos || []).find(s => s.id === currentTurma.segmentoId);
        }
    }

    const hasSegmentMerenda = currentSegment && currentSegment.merendaAposTempo !== undefined;
    const merendaTempo = hasSegmentMerenda ? currentSegment.merendaAposTempo : 3;
    const merendaHorario = hasSegmentMerenda ? (currentSegment.horarioMerenda || '09:40 - 10:10') : '09:40 - 10:10';

    // 1. Renderizar cabeçalho da tabela (Dias da Semana)
    const headerCorner = document.createElement('div');
    headerCorner.className = 'timetable-header-cell';
    headerCorner.innerHTML = '<i class="fa-solid fa-clock-o"></i> Horário';
    root.appendChild(headerCorner);

    activeConfig.dias.forEach(dia => {
        const headerCell = document.createElement('div');
        headerCell.className = 'timetable-header-cell';
        headerCell.textContent = activeConfig.diasNomes[dia] || `Dia ${dia}`;
        root.appendChild(headerCell);
    });

    // 2. Renderizar linhas por Período/Tempo
    for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
        // Inserir linha visual de Intervalo/Merenda no tempo configurado
        const shouldInsertInterval = hasSegmentMerenda ? (tempo === merendaTempo) : (activeConfig.tempos > 4 && tempo === 3);
        if (shouldInsertInterval) {
            const intervalTimeCell = document.createElement('div');
            intervalTimeCell.className = 'timetable-time-cell';
            intervalTimeCell.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
            intervalTimeCell.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            intervalTimeCell.innerHTML = `<strong style="color: #fbbf24;">MERENDA</strong><span style="color: #fbbf24; font-size: 0.72rem;">${merendaHorario}</span>`;
            root.appendChild(intervalTimeCell);

            const intervalCell = document.createElement('div');
            intervalCell.className = 'timetable-interval-cell';
            intervalCell.style.gridColumn = `span ${activeConfig.dias.length}`;
            intervalCell.style.display = 'flex';
            intervalCell.style.alignItems = 'center';
            intervalCell.style.justifyContent = 'center';
            intervalCell.style.background = 'rgba(245, 158, 11, 0.05)';
            intervalCell.style.border = '1px dashed rgba(245, 158, 11, 0.35)';
            intervalCell.style.borderRadius = 'var(--radius-md)';
            intervalCell.style.color = '#fbbf24';
            intervalCell.style.fontSize = '0.85rem';
            intervalCell.style.fontWeight = '700';
            intervalCell.innerHTML = `<i class="fa-solid fa-utensils" style="margin-right: 8px;"></i> MERENDA / INTERVALO (${merendaHorario})`;
            root.appendChild(intervalCell);
        }

        // Primeira célula da linha: Identificação do Tempo
        const timeCell = document.createElement('div');
        timeCell.className = 'timetable-time-cell';
        let horarioStr = (activeConfig.temposHorarios && activeConfig.temposHorarios[tempo]) ? activeConfig.temposHorarios[tempo] : '';
        if (currentSegment && currentSegment.temposHorarios && currentSegment.temposHorarios[tempo]) {
            horarioStr = currentSegment.temposHorarios[tempo];
        }
        timeCell.innerHTML = `<strong>${tempo + 1}º Tempo</strong><span>${horarioStr}</span>`;
        root.appendChild(timeCell);

        // Células dos dias letivos
        activeConfig.dias.forEach(dia => {
            // Verificar se este dia/tempo está desabilitado para a turma deste segmento (ex: 4 dias com 5 tempos no Fundamental 2)
            if (viewMode === 'turma' && currentTurma) {
                let totalCarga = 0;
                if (currentTurma.cargaHoraria) {
                    totalCarga = Object.values(currentTurma.cargaHoraria).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
                }
                const isFund2 = (currentSegment && (currentSegment.id.includes('fund2') || currentSegment.nome.toLowerCase().includes('fundamental'))) || totalCarga === 26;

                if (isFund2) {
                    // Identificar qual dia tem o 6º tempo nesta turma
                    let dia6 = null;
                    if (currentTurma.diaCom6Tempos && currentTurma.diaCom6Tempos !== 'auto') {
                        dia6 = parseInt(currentTurma.diaCom6Tempos, 10);
                    } else if (currentTurma.diaCom6TemposEfetivo) {
                        dia6 = parseInt(currentTurma.diaCom6TemposEfetivo, 10);
                    } else {
                        // Buscar na grade salva se algum dia já possui aula no tempo 5
                        const agendaTurma = state.timetable[currentTurmaId];
                        if (agendaTurma) {
                            activeConfig.dias.forEach(d => {
                                if (agendaTurma[d] && agendaTurma[d][5] !== null) {
                                    dia6 = d;
                                }
                            });
                        }
                    }

                    // Se identificado, apenas dia6 tem o tempo 5 ativo; os demais 4 dias são "Sem Aula"
                    // Se ainda não gerou e dia6 for nulo, usamos o dia 6 (Sexta) como padrão visual
                    const diaCom6TemposFinal = dia6 !== null ? dia6 : 6;
                    if (dia !== diaCom6TemposFinal && tempo >= 5) {
                        const disabledCell = document.createElement('div');
                        disabledCell.className = 'timetable-cell cell-sem-aula';
                        disabledCell.style.background = 'rgba(255, 255, 255, 0.02)';
                        disabledCell.style.border = '1px dashed rgba(255, 255, 255, 0.12)';
                        disabledCell.style.display = 'flex';
                        disabledCell.style.flexDirection = 'column';
                        disabledCell.style.alignItems = 'center';
                        disabledCell.style.justifyContent = 'center';
                        disabledCell.style.color = 'var(--text-muted)';
                        disabledCell.style.fontSize = '0.75rem';
                        disabledCell.style.cursor = 'not-allowed';
                        disabledCell.innerHTML = '<i class="fa-solid fa-ban" style="opacity: 0.35; margin-bottom: 3px;"></i><span style="opacity: 0.6; font-weight: 500;">Sem Aula</span>';
                        root.appendChild(disabledCell);
                        return;
                    }
                } else if (currentSegment && currentSegment.temposPorDia && !isFund2) {
                    // Ensino Médio ou outros segmentos
                    const maxTemposNoDia = currentSegment.temposPorDia[dia] !== undefined ? currentSegment.temposPorDia[dia] : activeConfig.tempos;
                    if (tempo >= maxTemposNoDia) {
                        const disabledCell = document.createElement('div');
                        disabledCell.className = 'timetable-cell cell-sem-aula';
                        disabledCell.style.background = 'rgba(255, 255, 255, 0.02)';
                        disabledCell.style.border = '1px dashed rgba(255, 255, 255, 0.12)';
                        disabledCell.style.display = 'flex';
                        disabledCell.style.flexDirection = 'column';
                        disabledCell.style.alignItems = 'center';
                        disabledCell.style.justifyContent = 'center';
                        disabledCell.style.color = 'var(--text-muted)';
                        disabledCell.style.fontSize = '0.75rem';
                        disabledCell.style.cursor = 'not-allowed';
                        disabledCell.innerHTML = '<i class="fa-solid fa-ban" style="opacity: 0.35; margin-bottom: 3px;"></i><span style="opacity: 0.6; font-weight: 500;">Sem Aula</span>';
                        root.appendChild(disabledCell);
                        return;
                    }
                }
            }

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
                    
                    // Identificar se há choque de horário para este professor neste dia e tempo
                    const clashingTurmas = [];
                    Object.entries(state.timetable).forEach(([otherId, otherAgenda]) => {
                        if (otherId === currentTurmaId) return;
                        const otherSlot = otherAgenda[dia] ? otherAgenda[dia][tempo] : null;
                        if (otherSlot && otherSlot.professorId === aula.professorId) {
                            const otherT = state.turmas.find(t => t.id === otherId);
                            clashingTurmas.push(otherT ? otherT.nome : otherId);
                        }
                    });

                    if (clashingTurmas.length > 0) {
                        cell.classList.add('cell-clash');
                    }

                    const card = createLessonCard(aula.disciplinaId, disc ? disc.nome : 'Matéria', aula.professorId, prof ? prof.nome : 'Prof.', currentTurmaId, dia, tempo, clashingTurmas);
                    cell.appendChild(card);
                }
            } else {
                // Visualização do Professor
                cell.setAttribute('data-professor-id', currentProfessorId);
                
                // Buscar todas as turmas onde este professor leciona neste tempo
                const aulasEncontradas = [];
                Object.entries(state.timetable).forEach(([tId, tAgenda]) => {
                    const slot = tAgenda[dia] ? tAgenda[dia][tempo] : null;
                    if (slot && slot.professorId === currentProfessorId) {
                        const disc = state.disciplinas.find(d => d.id === slot.disciplinaId);
                        const turma = state.turmas.find(t => t.id === tId);
                        aulasEncontradas.push({ slot, disc, turma });
                    }
                });

                if (aulasEncontradas.length > 0) {
                    if (aulasEncontradas.length > 1) {
                        cell.classList.add('cell-clash');
                    }
                    aulasEncontradas.forEach(({ slot, disc, turma }) => {
                        const card = document.createElement('div');
                        card.className = `lesson-card lesson-card-${(slot.disciplinaId.charCodeAt(1) % 8) + 1}`;
                        card.style.cursor = 'default';
                        let clashBadgeHtml = '';
                        if (aulasEncontradas.length > 1) {
                            card.classList.add('card-clash-warning');
                            clashBadgeHtml = `<div class="clash-badge"><i class="fa-solid fa-triangle-exclamation"></i> CHOQUE (${aulasEncontradas.length} turmas)</div>`;
                        }
                        card.innerHTML = `
                            <div class="lesson-subject">${disc ? disc.nome : 'Sem Nome'}</div>
                            <div class="lesson-teacher"><i class="fa-solid fa-users"></i> ${turma ? turma.nome : 'Turma'}</div>
                            ${clashBadgeHtml}
                        `;
                        cell.appendChild(card);
                    });
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

    // Atualizar auditoria de choques
    auditAndHighlightClashes();
}

// Criar o cartão arrastável
function createLessonCard(disciplinaId, disciplinaNome, professorId, professorNome, turmaId, dia, tempo, clashingTurmas = []) {
    const card = document.createElement('div');
    card.className = `lesson-card lesson-card-${(disciplinaId.charCodeAt(1) % 8) + 1}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-disciplina-id', disciplinaId);
    card.setAttribute('data-professor-id', professorId);
    card.setAttribute('data-turma-id', turmaId);
    card.setAttribute('data-from-dia', dia);
    card.setAttribute('data-from-tempo', tempo);

    let clashBadgeHtml = '';
    if (clashingTurmas && clashingTurmas.length > 0) {
        card.classList.add('card-clash-warning');
        clashBadgeHtml = `<div class="clash-badge" title="Choque com ${clashingTurmas.join(', ')}"><i class="fa-solid fa-triangle-exclamation"></i> Choque: ${clashingTurmas.join(', ')}</div>`;
    }

    card.innerHTML = `
        <div class="lesson-subject">${disciplinaNome}</div>
        <div class="lesson-teacher" title="${professorNome}"><i class="fa-solid fa-user-tie"></i> ${professorNome}</div>
        ${clashBadgeHtml}
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
            const seg = turma.segmentoId ? (activeConfig.segmentos || []).find(s => s.id === turma.segmentoId) : null;
            const merendaTempo = seg && seg.merendaAposTempo !== undefined ? seg.merendaAposTempo : 3;
            const merendaHorario = seg && seg.horarioMerenda ? seg.horarioMerenda : '09:40 - 10:10';
            const temposHorarios = seg && seg.temposHorarios ? seg.temposHorarios : activeConfig.temposHorarios;

            let totalCarga = 0;
            if (turma.cargaHoraria) {
                totalCarga = Object.values(turma.cargaHoraria).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
            }
            const isFund2 = (seg && (seg.id.includes('fund2') || seg.nome.toLowerCase().includes('fundamental'))) || totalCarga === 26;
            
            let dia6 = null;
            if (isFund2) {
                if (turma.diaCom6Tempos && turma.diaCom6Tempos !== 'auto') {
                    dia6 = parseInt(turma.diaCom6Tempos, 10);
                } else if (turma.diaCom6TemposEfetivo) {
                    dia6 = parseInt(turma.diaCom6TemposEfetivo, 10);
                } else {
                    const agendaTurma = state.timetable[turma.id];
                    if (agendaTurma) {
                        activeConfig.dias.forEach(d => {
                            if (agendaTurma[d] && agendaTurma[d][5] !== null) dia6 = d;
                        });
                    }
                }
            }
            const diaCom6Final = dia6 !== null ? dia6 : 6;

            html += `<h3>Turma: ${turma.nome} ${seg ? `(${seg.nome})` : ''}</h3>`;
            html += `<table>`;
            html += `<thead><tr><th>Horário</th><th>Segunda</th><th>Terça</th><th>Quarta</th><th>Quinta</th><th>Sexta</th></tr></thead>`;
            html += `<tbody>`;

            for (let tempo = 0; tempo < activeConfig.tempos; tempo++) {
                if (tempo === merendaTempo) {
                    html += `<tr><td class="time-cell">${merendaHorario}</td><td colspan="5" class="recreio-cell">☕ MERENDA / INTERVALO (${merendaHorario})</td></tr>`;
                }

                html += `<tr>`;
                const hStr = (temposHorarios && temposHorarios[tempo]) ? temposHorarios[tempo] : '';
                html += `<td class="time-cell">${tempo + 1}º Tempo<br>${hStr}</td>`;

                activeConfig.dias.forEach(dia => {
                    if (isFund2 && dia !== diaCom6Final && tempo >= 5) {
                        html += `<td style="color: #64748b; font-style: italic;">Sem Aula</td>`;
                        return;
                    }
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

    const inputLoginPwd = document.getElementById('login-password');
    const btnToggleLoginPwd = document.getElementById('btn-toggle-login-password');
    if (inputLoginPwd) inputLoginPwd.type = 'password';
    if (btnToggleLoginPwd) {
        const icon = btnToggleLoginPwd.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
        btnToggleLoginPwd.title = 'Visualizar senha';
        btnToggleLoginPwd.setAttribute('aria-label', 'Visualizar senha');
    }
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

    // Visibilidade dos Links na Sidebar
    if (navAdminSchools) {
        if (isSuperAdmin && !isImpersonating) {
            navAdminSchools.classList.remove('d-none');
        } else {
            navAdminSchools.classList.add('d-none');
        }
    }
    const navConfig = document.getElementById('nav-link-config');
    if (navConfig) {
        if (isSuperAdmin && !isImpersonating) {
            navConfig.classList.add('d-none');
        } else {
            navConfig.classList.remove('d-none');
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

// Função global de alternar visibilidade de senha (inline e listener)
window.togglePasswordVisibility = function(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btnEl ? btnEl.querySelector('i') : null;
    if (icon) {
        if (isPassword) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            if (btnEl) {
                btnEl.title = 'Ocultar senha';
                btnEl.setAttribute('aria-label', 'Ocultar senha');
            }
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            if (btnEl) {
                btnEl.title = 'Visualizar senha';
                btnEl.setAttribute('aria-label', 'Visualizar senha');
            }
        }
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

    // Configurar botões de alternar visualização de senha
    function setupPasswordToggle(buttonId, inputId) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        btn.onclick = (e) => {
            e.preventDefault();
            window.togglePasswordVisibility(inputId, btn);
        };
    }

    setupPasswordToggle('btn-toggle-login-password', 'login-password');
    setupPasswordToggle('btn-toggle-school-password', 'input-school-password');
    setupPasswordToggle('btn-toggle-reset-password', 'input-new-school-password');

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

    let schoolUsernameTouched = false;
    const inputSchoolName = document.getElementById('input-school-name');
    const inputSchoolUser = document.getElementById('input-school-username');
    const inputSchoolPass = document.getElementById('input-school-password');
    const alertSchoolModal = document.getElementById('modal-school-alert');

    function setSchoolModalAlert(msg, type) {
        if (!alertSchoolModal) return;
        if (!msg) {
            alertSchoolModal.textContent = '';
            alertSchoolModal.className = 'info-alert d-none';
            return;
        }
        alertSchoolModal.textContent = msg;
        alertSchoolModal.className = `info-alert ${type}`;
        alertSchoolModal.classList.remove('d-none');
    }

    if (inputSchoolUser) {
        inputSchoolUser.addEventListener('input', () => {
            schoolUsernameTouched = true;
        });
    }

    if (inputSchoolName && inputSchoolUser) {
        inputSchoolName.addEventListener('input', () => {
            if (!schoolUsernameTouched) {
                const generated = inputSchoolName.value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '');
                inputSchoolUser.value = generated;
            }
        });
    }

    if (btnOpenModalSchool && modalSchool) {
        btnOpenModalSchool.addEventListener('click', () => {
            if (formSchool) formSchool.reset();
            schoolUsernameTouched = false;
            if (inputSchoolName) inputSchoolName.value = '';
            if (inputSchoolUser) inputSchoolUser.value = '';
            if (inputSchoolPass) inputSchoolPass.value = '';
            setSchoolModalAlert('', '');
            modalSchool.classList.add('active');
        });
    }

    if (formSchool) {
        formSchool.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = inputSchoolName ? inputSchoolName.value : '';
            const username = inputSchoolUser ? inputSchoolUser.value : '';
            const password = inputSchoolPass ? inputSchoolPass.value : '';

            const res = AuthManager.createSchool(name, username, password);
            if (res.success) {
                if (modalSchool) modalSchool.classList.remove('active');
                renderAdminSchoolsPanel();
                alert(`Escola "${res.school.name}" cadastrada com sucesso!\nUsuário de acesso: ${res.school.username}\nSenha: ${res.school.password}`);
            } else {
                setSchoolModalAlert(res.message, 'danger');
                if (inputSchoolUser) inputSchoolUser.focus();
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

// ----------------------------------------------------
// ESCOLA: CONFIGURAÇÕES, SEGMENTOS & HORÁRIOS
// ----------------------------------------------------

function populateSegmentosSelect() {
    const select = document.getElementById('input-turma-segmento');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Geral / Sem Segmento Específico</option>';
    if (activeConfig && activeConfig.segmentos && Array.isArray(activeConfig.segmentos)) {
        activeConfig.segmentos.forEach(seg => {
            const opt = document.createElement('option');
            opt.value = seg.id;
            opt.textContent = `${seg.nome} (${seg.turno})`;
            select.appendChild(opt);
        });
    }
    select.value = currentVal;
}

function renderConfigView() {
    // 1. Marcar checkboxes dos dias da semana
    const dayCheckboxes = document.querySelectorAll('input[name="config-dia"]');
    dayCheckboxes.forEach(cb => {
        cb.checked = activeConfig.dias.includes(parseInt(cb.value, 10));
    });

    // 2. Definir quantidade de tempos
    const selectTempos = document.getElementById('select-config-tempos');
    if (selectTempos) {
        selectTempos.value = String(activeConfig.tempos);
    }

    // 3. Renderizar tabela de horários de cada tempo
    renderConfigTemposInputs(activeConfig.tempos, activeConfig.temposHorarios);

    // 4. Renderizar tabela de segmentos
    renderConfigSegmentos();

    // 5. Atualizar select de segmentos no modal de turmas
    populateSegmentosSelect();
}

function renderConfigTemposInputs(temposCount, temposHorarios = []) {
    const tbody = document.getElementById('tbody-config-tempos');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < temposCount; i++) {
        const existingHorario = temposHorarios[i] || '';
        const parts = existingHorario.split(' - ');
        const startVal = parts[0] ? parts[0].trim() : '';
        const endVal = parts[1] ? parts[1].trim() : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${i + 1}º Tempo</strong></td>
            <td>
                <input type="text" class="form-control config-tempo-start" data-tempo="${i}" value="${startVal}" placeholder="Ex: 07:10" style="max-width: 140px;" required>
            </td>
            <td>
                <input type="text" class="form-control config-tempo-end" data-tempo="${i}" value="${endVal}" placeholder="Ex: 08:00" style="max-width: 140px;" required>
            </td>
            <td>
                <span class="badge badge-secondary config-tempo-preview" id="preview-tempo-${i}">${existingHorario || (startVal && endVal ? `${startVal} - ${endVal}` : 'A definir')}</span>
            </td>
        `;
        tbody.appendChild(tr);
    }

    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const idx = input.getAttribute('data-tempo');
            const startInput = tbody.querySelector(`.config-tempo-start[data-tempo="${idx}"]`);
            const endInput = tbody.querySelector(`.config-tempo-end[data-tempo="${idx}"]`);
            const preview = document.getElementById(`preview-tempo-${idx}`);
            if (preview && startInput && endInput) {
                preview.textContent = `${startInput.value || '--:--'} - ${endInput.value || '--:--'}`;
            }
        });
    });
}

function renderConfigSegmentos() {
    const tbody = document.querySelector('#table-config-segmentos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const segmentos = activeConfig.segmentos || [];
    if (segmentos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum segmento cadastrado ainda.</td></tr>`;
        return;
    }

    segmentos.forEach(seg => {
        const turmasCount = state.turmas.filter(t => t.segmentoId === seg.id).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${seg.nome}</td>
            <td><span class="badge badge-primary">${seg.turno}</span></td>
            <td><span class="badge badge-secondary">${turmasCount} turmas</span></td>
            <td style="text-align: right;">
                <button class="btn-icon btn-delete" onclick="deleteSegmento('${seg.id}')" title="Excluir Segmento">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function applyPresetTimes(presetType) {
    const tempos = parseInt(document.getElementById('select-config-tempos').value, 10) || activeConfig.tempos;
    const presets = {
        morning: ["07:10 - 08:00", "08:00 - 08:50", "08:50 - 09:40", "10:00 - 10:50", "10:50 - 11:40", "11:40 - 12:30", "12:30 - 13:20", "13:20 - 14:10"],
        afternoon: ["13:00 - 13:50", "13:50 - 14:40", "14:40 - 15:30", "15:50 - 16:40", "16:40 - 17:30", "17:30 - 18:20", "18:20 - 19:10", "19:10 - 20:00"],
        night: ["19:00 - 19:45", "19:45 - 20:30", "20:45 - 21:30", "21:30 - 22:15", "22:15 - 23:00", "23:00 - 23:45"]
    };
    const chosen = presets[presetType] || presets.morning;
    renderConfigTemposInputs(tempos, chosen);
}

window.deleteSegmento = function(segId) {
    if (confirm('Deseja realmente excluir este segmento de ensino? As turmas vinculadas a ele ficarão sem segmento específico.')) {
        activeConfig.segmentos = (activeConfig.segmentos || []).filter(s => s.id !== segId);
        state.turmas.forEach(t => {
            if (t.segmentoId === segId) {
                t.segmentoId = null;
            }
        });
        localStorage.setItem(getSchoolKey('config'), JSON.stringify(activeConfig));
        saveToStorage();
        renderConfigSegmentos();
        renderTurmas();
        populateSegmentosSelect();
        showGenerationMessage('Segmento removido com sucesso.', 'success');
    }
};

function initSchoolConfigUI() {
    // Botão para atualizar tabela de tempos com base no select de quantidade
    const btnApplyTempos = document.getElementById('btn-apply-tempos-count');
    if (btnApplyTempos) {
        btnApplyTempos.addEventListener('click', () => {
            const count = parseInt(document.getElementById('select-config-tempos').value, 10);
            renderConfigTemposInputs(count, activeConfig.temposHorarios);
        });
    }

    // Presets rápidos de horário
    const btnPresMorning = document.getElementById('btn-preset-morning');
    const btnPresAfternoon = document.getElementById('btn-preset-afternoon');
    const btnPresNight = document.getElementById('btn-preset-night');

    if (btnPresMorning) btnPresMorning.addEventListener('click', () => applyPresetTimes('morning'));
    if (btnPresAfternoon) btnPresAfternoon.addEventListener('click', () => applyPresetTimes('afternoon'));
    if (btnPresNight) btnPresNight.addEventListener('click', () => applyPresetTimes('night'));

    // Submissão do formulário de horários e dias (Salvar tudo)
    const formHorarios = document.getElementById('form-config-horarios-tempos');
    if (formHorarios) {
        formHorarios.addEventListener('submit', (e) => {
            e.preventDefault();

            // 1. Coletar dias selecionados
            const checkedDays = Array.from(document.querySelectorAll('input[name="config-dia"]:checked'))
                .map(cb => parseInt(cb.value, 10))
                .sort((a, b) => a - b);

            if (checkedDays.length === 0) {
                alert('Atenção: selecione ao menos 1 dia letivo da semana.');
                return;
            }

            // 2. Coletar quantidade de tempos
            const count = parseInt(document.getElementById('select-config-tempos').value, 10);

            // 3. Coletar horários de cada tempo
            const novosHorarios = [];
            for (let i = 0; i < count; i++) {
                const startInput = document.querySelector(`.config-tempo-start[data-tempo="${i}"]`);
                const endInput = document.querySelector(`.config-tempo-end[data-tempo="${i}"]`);
                const start = startInput ? startInput.value.trim() : '';
                const end = endInput ? endInput.value.trim() : '';
                if (!start || !end) {
                    alert(`Por favor, preencha o horário de início e término do ${i + 1}º tempo.`);
                    return;
                }
                novosHorarios.push(`${start} - ${end}`);
            }

            // 4. Salvar na configuração
            activeConfig.dias = checkedDays;
            activeConfig.tempos = count;
            activeConfig.temposHorarios = novosHorarios;

            localStorage.setItem(getSchoolKey('config'), JSON.stringify(activeConfig));

            // 5. Ajustar grades existentes
            state.turmas.forEach(t => {
                if (state.timetable[t.id]) {
                    activeConfig.dias.forEach(dia => {
                        if (!state.timetable[t.id][dia]) {
                            state.timetable[t.id][dia] = Array(activeConfig.tempos).fill(null);
                        } else if (state.timetable[t.id][dia].length < activeConfig.tempos) {
                            while (state.timetable[t.id][dia].length < activeConfig.tempos) {
                                state.timetable[t.id][dia].push(null);
                            }
                        }
                    });
                    localStorage.setItem(getSchoolKey(`timetable_${t.id}`), JSON.stringify(state.timetable[t.id]));
                }
            });

            saveToStorage();
            renderHorariosView();
            renderConfigView();
            showGenerationMessage('Configurações da escola salvas com sucesso!', 'success');
            alert('Configurações da escola salvas com sucesso! A grade e disponibilidades foram atualizadas.');
        });
    }

    // Modal de Segmento
    const modalSegmento = document.getElementById('modal-segmento');
    const formSegmento = document.getElementById('form-segmento');
    const btnOpenModalSeg = document.getElementById('btn-open-modal-segmento');

    if (btnOpenModalSeg && modalSegmento) {
        btnOpenModalSeg.addEventListener('click', () => {
            if (formSegmento) formSegmento.reset();
            document.getElementById('edit-segmento-id').value = '';
            modalSegmento.classList.add('active');
        });
    }

    if (formSegmento) {
        formSegmento.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('input-segmento-nome').value.trim();
            const turno = document.getElementById('select-segmento-turno').value;
            const merendaHorarioInput = document.getElementById('input-segmento-merenda-horario');
            const merendaPosSelect = document.getElementById('select-segmento-merenda-pos');
            const modeloTemposSelect = document.getElementById('select-segmento-modelo-tempos');

            const merendaHorario = merendaHorarioInput ? merendaHorarioInput.value.trim() : '';
            const merendaPos = merendaPosSelect ? parseInt(merendaPosSelect.value, 10) : 3;
            const modeloTempos = modeloTemposSelect ? modeloTemposSelect.value : 'padrao';

            if (!nome) return;

            if (!activeConfig.segmentos) activeConfig.segmentos = [];

            const newSeg = {
                id: 'seg_' + Date.now(),
                nome: nome,
                turno: turno
            };

            if (merendaHorario) {
                newSeg.horarioMerenda = merendaHorario;
                newSeg.merendaAposTempo = merendaPos;
            }

            if (modeloTempos === 'fund2_5_6') {
                newSeg.temposPorDia = { 2: 5, 3: 5, 4: 5, 5: 5, 6: 6 };
            }

            activeConfig.segmentos.push(newSeg);

            localStorage.setItem(getSchoolKey('config'), JSON.stringify(activeConfig));
            if (modalSegmento) modalSegmento.classList.remove('active');
            renderConfigSegmentos();
            populateSegmentosSelect();
            renderTurmas();
            showGenerationMessage(`Segmento "${nome}" cadastrado com sucesso!`, 'success');
        });
    }
}

// Inicialização Geral
window.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    initSchoolConfigUI();
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
