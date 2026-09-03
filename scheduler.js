/**
 * Algoritmo de Geração de Horários com Backtracking Otimizado e Limite de Passos
 */

class TimetableScheduler {
    constructor(turmas, professores, disciplinas, config) {
        this.turmas = JSON.parse(JSON.stringify(turmas));
        this.professores = JSON.parse(JSON.stringify(professores));
        this.disciplinas = JSON.parse(JSON.stringify(disciplinas));
        this.config = config || { dias: [2, 3, 4, 5, 6], tempos: 8 };
        
        this.professoresPorDisciplina = {};
        this.disciplinas.forEach(d => {
            this.professoresPorDisciplina[d.id] = this.professores.filter(p => p.disciplinas.includes(d.id));
        });
    }

    generate(targetTurmaId, existingTimetable) {
        let lessonsToSchedule = [];
        
        // Se targetTurmaId for passado, agendar apenas para ela
        const activeTurmas = targetTurmaId ? this.turmas.filter(t => t.id === targetTurmaId) : this.turmas;
        
        activeTurmas.forEach(turma => {
            Object.entries(turma.cargaHoraria || {}).forEach(([disciplinaId, horas]) => {
                const horasInt = parseInt(horas, 10) || 0;
                const professoresDisponiveis = this.professoresPorDisciplina[disciplinaId] || [];
                if (professoresDisponiveis.length === 0) return;

                for (let i = 0; i < horasInt; i++) {
                    lessonsToSchedule.push({
                        id: `${turma.id}-${disciplinaId}-${i}`,
                        turmaId: turma.id,
                        disciplinaId: disciplinaId,
                        professoresPossiveis: professoresDisponiveis
                    });
                }
            });
        });

        // Inicializar horários vazios
        let timetable = {};
        this.turmas.forEach(t => {
            timetable[t.id] = {};
            this.config.dias.forEach(d => {
                timetable[t.id][d] = Array(this.config.tempos).fill(null);
            });
        });

        let teacherSchedule = {};
        this.professores.forEach(p => {
            teacherSchedule[p.id] = {};
            this.config.dias.forEach(d => {
                teacherSchedule[p.id][d] = Array(this.config.tempos).fill(null);
            });
        });

        // Preencher horários existentes das outras turmas para bloquear professores
        if (targetTurmaId && existingTimetable) {
            this.turmas.forEach(t => {
                if (t.id === targetTurmaId) return; // Ignora a turma alvo, pois vamos gerá-la do zero
                
                const agenda = existingTimetable[t.id];
                if (agenda) {
                    this.config.dias.forEach(dia => {
                        if (agenda[dia]) {
                            agenda[dia].forEach((slot, tempo) => {
                                if (slot && tempo < this.config.tempos) {
                                    timetable[t.id][dia][tempo] = JSON.parse(JSON.stringify(slot));
                                    if (teacherSchedule[slot.professorId]) {
                                        teacherSchedule[slot.professorId][dia][tempo] = t.id;
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }

        // Função auxiliar para copiar estrutura da grade apenas quando necessário
        const cloneTimetable = (t) => JSON.parse(JSON.stringify(t));

        // Variáveis para rastrear o melhor resultado parcial (inicializadas para nunca retornar null)
        let bestScheduledCount = 0;
        let bestTimetable = cloneTimetable(timetable);
        let bestTeacherSchedule = cloneTimetable(teacherSchedule);

        // Contar slots válidos possíveis para cada aula considerando a disponibilidade dos professores e horários livres
        lessonsToSchedule.forEach(l => {
            let validSlots = 0;
            l.professoresPossiveis.forEach(prof => {
                this.config.dias.forEach(dia => {
                    const disp = prof.disponibilidade && prof.disponibilidade[dia];
                    if (disp) {
                        for (let tempo = 0; tempo < this.config.tempos; tempo++) {
                            if (disp.includes(tempo) && teacherSchedule[prof.id][dia][tempo] === null) {
                                validSlots++;
                            }
                        }
                    }
                });
            });
            l.validSlots = validSlots;
        });

        // Heurística de ordenação: priorizar disciplinas com menos opções válidas (Most Constrained First)
        // Aulas sem slots válidos vão para o final para não abortar precocemente o agendamento das outras matérias
        lessonsToSchedule.sort((a, b) => {
            if (a.validSlots === 0 && b.validSlots > 0) return 1;
            if (b.validSlots === 0 && a.validSlots > 0) return -1;
            return a.validSlots - b.validSlots;
        });

        let steps = 0;
        const MAX_STEPS = 50000;

        const solve = (index) => {
            steps++;
            if (steps > MAX_STEPS) return false;

            if (index > bestScheduledCount) {
                bestScheduledCount = index;
                bestTimetable = cloneTimetable(timetable);
                bestTeacherSchedule = cloneTimetable(teacherSchedule);
            }

            if (index >= lessonsToSchedule.length) return true;

            const lesson = lessonsToSchedule[index];
            // Se esta aula não possui nenhum slot viável, encerra essa busca mantendo o melhor resultado
            if (lesson.validSlots === 0) return false;

            const { turmaId, disciplinaId, professoresPossiveis } = lesson;

            for (let prof of professoresPossiveis) {
                for (let dia of this.config.dias) {
                    const disponibilidadeProf = prof.disponibilidade && prof.disponibilidade[dia];
                    if (!disponibilidadeProf) continue;

                    for (let tempo = 0; tempo < this.config.tempos; tempo++) {
                        if (!disponibilidadeProf.includes(tempo)) continue;
                        if (timetable[turmaId][dia][tempo] !== null) continue;
                        if (teacherSchedule[prof.id][dia][tempo] !== null) continue;

                        let aulasMesmaMateriaNoDia = 0;
                        for (let t = 0; t < this.config.tempos; t++) {
                            if (timetable[turmaId][dia][t] && timetable[turmaId][dia][t].disciplinaId === disciplinaId) {
                                aulasMesmaMateriaNoDia++;
                            }
                        }
                        if (aulasMesmaMateriaNoDia >= 3) continue;

                        // Alocação Direta (sem clones pesados)
                        timetable[turmaId][dia][tempo] = { disciplinaId, professorId: prof.id };
                        teacherSchedule[prof.id][dia][tempo] = turmaId;

                        if (solve(index + 1)) return true;

                        // Backtrack (reversão direta)
                        timetable[turmaId][dia][tempo] = null;
                        teacherSchedule[prof.id][dia][tempo] = null;
                    }
                }
            }
            return false;
        };

        const success = solve(0);

        // Se falhou ou excedeu os passos, retorna a melhor grade parcial obtida!
        if (success) {
            return {
                success: true,
                timetable,
                teacherSchedule
            };
        } else {
            console.warn(`Geração completa não concluída em ${steps} passos. Retornando melhor resultado parcial (${bestScheduledCount}/${lessonsToSchedule.length} aulas alocadas).`);
            return {
                success: false,
                isPartial: bestScheduledCount > 0,
                timetable: bestTimetable || cloneTimetable(timetable),
                teacherSchedule: bestTeacherSchedule || cloneTimetable(teacherSchedule),
                allocated: bestScheduledCount,
                total: lessonsToSchedule.length
            };
        }
    }
}

window.TimetableScheduler = TimetableScheduler;
