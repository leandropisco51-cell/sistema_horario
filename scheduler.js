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

    isSlotDisabledForTurma(turmaId, dia, tempo) {
        const turma = this.turmas.find(t => t.id === turmaId);
        if (!turma) return false;

        const seg = turma.segmentoId ? (this.config.segmentos || []).find(s => s.id === turma.segmentoId) : null;
        
        let totalCarga = 0;
        if (turma.cargaHoraria) {
            totalCarga = Object.values(turma.cargaHoraria).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
        }
        const isFund2 = (seg && (seg.id.includes('fund2') || seg.nome.toLowerCase().includes('fundamental'))) || totalCarga === 26;

        if (isFund2) {
            // Se o usuário fixou um dia específico para 6 tempos (ex: 2=Seg, 3=Ter, 4=Qua, 5=Qui, 6=Sex)
            if (turma.diaCom6Tempos && turma.diaCom6Tempos !== 'auto') {
                const dia6 = parseInt(turma.diaCom6Tempos, 10);
                if (dia === dia6) {
                    return tempo >= 6;
                } else {
                    return tempo >= 5; // Os outros 4 dias só podem ter até o tempo 4 (5 tempos)
                }
            }
            // Se estiver em modo 'auto', nenhum dia pode passar de 6 tempos
            return tempo >= 6;
        }

        // Outros segmentos (ex: Ensino Médio)
        if (seg && seg.temposPorDia && !isFund2) {
            const maxTemposNoDia = seg.temposPorDia[dia] !== undefined ? seg.temposPorDia[dia] : this.config.tempos;
            return tempo >= maxTemposNoDia;
        }

        return false;
    }

    generate(targetTurmaId, existingTimetable) {
        let lessonsToSchedule = [];
        
        // Se targetTurmaId for passado, agendar apenas para ela; senão, agendar para todas
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

        // Inicializar estruturas
        const timetable = {};
        const teacherSchedule = {};

        this.turmas.forEach(t => {
            timetable[t.id] = {};
            this.config.dias.forEach(d => {
                timetable[t.id][d] = Array(this.config.tempos).fill(null);
            });
        });

        this.professores.forEach(p => {
            teacherSchedule[p.id] = {};
            this.config.dias.forEach(d => {
                teacherSchedule[p.id][d] = Array(this.config.tempos).fill(null);
            });
        });

        // Preencher horários existentes das outras turmas para bloquear professores se for turma única
        if (targetTurmaId && existingTimetable) {
            this.turmas.forEach(t => {
                if (t.id === targetTurmaId) return; // Ignora a turma alvo
                
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

        // Variáveis para rastrear o melhor resultado parcial
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
                            if (this.isSlotDisabledForTurma(l.turmaId, dia, tempo)) continue;
                            if (disp.includes(tempo) && teacherSchedule[prof.id][dia][tempo] === null) {
                                validSlots++;
                            }
                        }
                    }
                });
            });
            l.validSlots = validSlots;
        });

        // Heurística de ordenação
        lessonsToSchedule.sort((a, b) => {
            if (a.validSlots === 0 && b.validSlots > 0) return 1;
            if (b.validSlots === 0 && a.validSlots > 0) return -1;
            
            const discA = this.disciplinas.find(d => d.id === a.disciplinaId);
            const discB = this.disciplinas.find(d => d.id === b.disciplinaId);
            const maxA = (discA && discA.maxAulasPorDia !== undefined) ? discA.maxAulasPorDia : 2;
            const maxB = (discB && discB.maxAulasPorDia !== undefined) ? discB.maxAulasPorDia : 2;
            if (maxA !== maxB) return maxA - maxB;

            return a.validSlots - b.validSlots;
        });

        let steps = 0;
        const MAX_STEPS = targetTurmaId ? 60000 : 150000;

        const solve = (index) => {
            steps++;
            if (steps > MAX_STEPS) return false;

            if (index > bestScheduledCount) {
                bestScheduledCount = index;
                bestTimetable = cloneTimetable(timetable);
                bestTeacherSchedule = cloneTimetable(teacherSchedule);
            }

            if (index === lessonsToSchedule.length) {
                return true;
            }

            const lesson = lessonsToSchedule[index];
            if (lesson.validSlots === 0) return false;

            const { turmaId, disciplinaId, professoresPossiveis } = lesson;
            const discObj = this.disciplinas.find(d => d.id === disciplinaId);
            const maxAulasDia = (discObj && discObj.maxAulasPorDia !== undefined) ? discObj.maxAulasPorDia : 2;

            const diasOrdenados = [...this.config.dias].sort((d1, d2) => {
                let c1 = 0, c2 = 0;
                for (let t = 0; t < this.config.tempos; t++) {
                    if (timetable[turmaId][d1][t] !== null) c1++;
                    if (timetable[turmaId][d2][t] !== null) c2++;
                }
                return c1 - c2;
            });

            for (let prof of professoresPossiveis) {
                for (let dia of diasOrdenados) {
                    const disponibilidadeProf = prof.disponibilidade && prof.disponibilidade[dia];
                    if (!disponibilidadeProf) continue;

                    for (let tempo = 0; tempo < this.config.tempos; tempo++) {
                        if (this.isSlotDisabledForTurma(turmaId, dia, tempo)) continue;
                        if (!disponibilidadeProf.includes(tempo)) continue;
                        if (timetable[turmaId][dia][tempo] !== null) continue;
                        if (teacherSchedule[prof.id][dia][tempo] !== null) continue;

                        // Validação Fundamental II: 4 dias com 5 tempos e apenas 1 dia com 6 tempos
                        if (tempo === 5) {
                            const turma = this.turmas.find(t => t.id === turmaId);
                            let totalCarga = 0;
                            if (turma && turma.cargaHoraria) {
                                totalCarga = Object.values(turma.cargaHoraria).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
                            }
                            const seg = turma && turma.segmentoId ? (this.config.segmentos || []).find(s => s.id === turma.segmentoId) : null;
                            const isFund2 = (seg && (seg.id.includes('fund2') || seg.nome.toLowerCase().includes('fundamental'))) || totalCarga === 26;

                            if (isFund2) {
                                if (turma && turma.diaCom6Tempos && turma.diaCom6Tempos !== 'auto') {
                                    const dia6 = parseInt(turma.diaCom6Tempos, 10);
                                    if (dia !== dia6) continue; // Bloqueia tempo 5 nos outros 4 dias
                                } else {
                                    // Modo automático: no máximo 1 dia da semana pode receber aula no tempo 5
                                    const outroDiaTemTempo5 = this.config.dias.some(d => 
                                        d !== dia && timetable[turmaId][d] && timetable[turmaId][d][5] !== null
                                    );
                                    if (outroDiaTemTempo5) continue;
                                }
                            }
                        }

                        let aulasMesmaMateriaNoDia = 0;
                        for (let t = 0; t < this.config.tempos; t++) {
                            if (timetable[turmaId][dia][t] && timetable[turmaId][dia][t].disciplinaId === disciplinaId) {
                                aulasMesmaMateriaNoDia++;
                            }
                        }
                        if (aulasMesmaMateriaNoDia >= maxAulasDia) continue;

                        // Alocação Direta
                        timetable[turmaId][dia][tempo] = { disciplinaId, professorId: prof.id };
                        teacherSchedule[prof.id][dia][tempo] = turmaId;

                        if (solve(index + 1)) return true;

                        // Backtrack
                        timetable[turmaId][dia][tempo] = null;
                        teacherSchedule[prof.id][dia][tempo] = null;
                    }
                }
            }
            return false;
        };

        const success = solve(0);

        // Determinar o resultado final
        const finalTimetable = success ? timetable : (bestTimetable || cloneTimetable(timetable));
        const finalTeacherSchedule = success ? teacherSchedule : (bestTeacherSchedule || cloneTimetable(teacherSchedule));

        // Registrar para cada turma qual dia ficou com 6 tempos (para exibição precisa na tela)
        this.turmas.forEach(turma => {
            const agenda = finalTimetable[turma.id];
            if (agenda) {
                this.config.dias.forEach(d => {
                    if (agenda[d] && agenda[d][5] !== null) {
                        turma.diaCom6TemposEfetivo = d;
                    }
                });
            }
        });

        if (success) {
            return {
                success: true,
                timetable: finalTimetable,
                teacherSchedule: finalTeacherSchedule,
                allocated: lessonsToSchedule.length,
                total: lessonsToSchedule.length
            };
        } else {
            console.warn(`Geração completa não concluída em ${steps} passos. Retornando melhor resultado parcial (${bestScheduledCount}/${lessonsToSchedule.length} aulas alocadas).`);
            return {
                success: false,
                isPartial: bestScheduledCount > 0,
                timetable: finalTimetable,
                teacherSchedule: finalTeacherSchedule,
                allocated: bestScheduledCount,
                total: lessonsToSchedule.length
            };
        }
    }
}

window.TimetableScheduler = TimetableScheduler;
