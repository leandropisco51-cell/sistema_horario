/**
 * Chronos School Timetable - Algoritmo de Geração Inteligente de Horários
 * 
 * Arquitetura de Alto Desempenho:
 * 1. Coordenação Latin-Square para Disciplinas de 1 Aula/Dia (ex: Inglês/Bilíngue - 5 tempos/semana).
 * 2. Cadeias de Ejeção de Kempe (Kempe Swaps Nível 1, 2 e Intra-Turma) para resolução de bloqueios
 *    e garantia de 100% de preenchimento de todas as turmas (Fundamental II e Ensino Médio).
 */

class TimetableScheduler {
    constructor(turmas, professores, disciplinas, config) {
        this.turmas = JSON.parse(JSON.stringify(turmas || []));
        this.professores = JSON.parse(JSON.stringify(professores || []));
        this.disciplinas = JSON.parse(JSON.stringify(disciplinas || []));
        this.config = config || { dias: [2, 3, 4, 5, 6], tempos: 8 };

        this.dias = this.config.dias || [2, 3, 4, 5, 6];
        this.tempos = this.config.tempos || 6;

        this.profMap = new Map(this.professores.map(p => [p.id, p]));
        this.discMap = new Map(this.disciplinas.map(d => [d.id, d]));
        this.turmaMap = new Map(this.turmas.map(t => [t.id, t]));

        this.professoresPorDisciplina = {};
        this.disciplinas.forEach(d => {
            this.professoresPorDisciplina[d.id] = this.professores.filter(p => p.disciplinas.includes(d.id));
        });
    }

    isFund2(turma) {
        if (!turma) return false;
        let totalCarga = 0;
        if (turma.cargaHoraria) {
            totalCarga = Object.values(turma.cargaHoraria).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
        }
        const seg = turma.segmentoId ? (this.config.segmentos || []).find(s => s.id === turma.segmentoId) : null;
        return (seg && (seg.id.includes('fund2') || seg.nome.toLowerCase().includes('fundamental'))) || totalCarga === 26;
    }

    isSlotDisabledForTurma(turma, dia, tempo, timetable) {
        if (!turma) return false;
        const seg = turma.segmentoId ? (this.config.segmentos || []).find(s => s.id === turma.segmentoId) : null;
        const isFund2 = this.isFund2(turma);

        if (isFund2) {
            // Se o usuário fixou um dia específico para 6 tempos (ex: 2=Seg, 3=Ter, 4=Qua, 5=Qui, 6=Sex)
            if (turma.diaCom6Tempos && turma.diaCom6Tempos !== 'auto') {
                const dia6 = parseInt(turma.diaCom6Tempos, 10);
                return dia === dia6 ? tempo >= 6 : tempo >= 5;
            }

            // Modo automático: no máximo 6 tempos em qualquer dia (0 a 5)
            if (tempo >= 6) return true;

            // Para o tempo 5 (o 6º tempo da turma de Fund II):
            if (tempo === 5 && timetable && timetable[turma.id]) {
                const outroDiaTemTempo5 = this.dias.some(d => 
                    d !== dia && timetable[turma.id][d] && timetable[turma.id][d][5] !== null
                );
                if (outroDiaTemTempo5) return true;
            }
            return false;
        }

        // Outros segmentos (ex: Ensino Médio - 6 tempos em todos os dias)
        if (seg && seg.temposPorDia && !isFund2) {
            const maxTemposNoDia = seg.temposPorDia[dia] !== undefined ? seg.temposPorDia[dia] : this.tempos;
            return tempo >= maxTemposNoDia;
        }

        return tempo >= this.tempos;
    }

    countAulasDia(timetable, turmaId, dia, disciplinaId) {
        let count = 0;
        if (!timetable[turmaId] || !timetable[turmaId][dia]) return 0;
        for (let t = 0; t < this.tempos; t++) {
            if (timetable[turmaId][dia][t] && timetable[turmaId][dia][t].disciplinaId === disciplinaId) {
                count++;
            }
        }
        return count;
    }

    isProfAvailable(prof, dia, tempo) {
        return prof && prof.disponibilidade && prof.disponibilidade[dia] && prof.disponibilidade[dia].includes(tempo);
    }

    generate(targetTurmaId, existingTimetable) {
        const timetable = {};
        const teacherSchedule = {};

        // Inicializar estruturas
        this.turmas.forEach(t => {
            timetable[t.id] = {};
            this.dias.forEach(d => {
                timetable[t.id][d] = Array(this.tempos).fill(null);
            });
        });

        this.professores.forEach(p => {
            teacherSchedule[p.id] = {};
            this.dias.forEach(d => {
                teacherSchedule[p.id][d] = Array(this.tempos).fill(null);
            });
        });

        // Preencher horários existentes das outras turmas caso seja geração de turma individual
        if (targetTurmaId && existingTimetable) {
            this.turmas.forEach(t => {
                if (t.id === targetTurmaId) return; // A turma alvo será recalculada
                const agenda = existingTimetable[t.id];
                if (agenda) {
                    this.dias.forEach(dia => {
                        if (agenda[dia]) {
                            agenda[dia].forEach((slot, tempo) => {
                                if (slot && tempo < this.tempos) {
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

        const turmasToSchedule = targetTurmaId ? this.turmas.filter(t => t.id === targetTurmaId) : this.turmas;

        // Calcular total de aulas solicitadas
        let totalExpectedLessons = 0;
        turmasToSchedule.forEach(turma => {
            Object.values(turma.cargaHoraria || {}).forEach(v => {
                totalExpectedLessons += (parseInt(v, 10) || 0);
            });
        });

        // ----------------------------------------------------
        // FASE 1: COORDENAÇÃO LATIN-SQUARE PARA 1 AULA/DIA
        // (ex: Inglês/Bilíngue com 5 tempos no Fundamental II)
        // ----------------------------------------------------
        const strictSingleLessons = [];
        turmasToSchedule.forEach(turma => {
            Object.entries(turma.cargaHoraria || {}).forEach(([discId, countStr]) => {
                const count = parseInt(countStr, 10) || 0;
                const disc = this.discMap.get(discId);
                const isSinglePerDay = disc && (disc.maxAulasPorDia === 1 || disc.id.includes('bilingue')) && count === 5;
                if (isSinglePerDay) {
                    const profs = this.professoresPorDisciplina[discId] || [];
                    if (profs.length > 0) {
                        strictSingleLessons.push({ turma, discId, prof: profs[0] });
                    }
                }
            });
        });

        if (strictSingleLessons.length > 0) {
            const byProf = {};
            strictSingleLessons.forEach(item => {
                if (!byProf[item.prof.id]) byProf[item.prof.id] = [];
                byProf[item.prof.id].push(item);
            });

            Object.values(byProf).forEach(items => {
                items.forEach((item, tIdx) => {
                    this.dias.forEach((dia, dIdx) => {
                        // Rotação de tempos para evitar choque: (dIdx + tIdx) % 5
                        const preferredTempos = [
                            (dIdx + tIdx) % 5,
                            (dIdx + tIdx + 1) % 5,
                            (dIdx + tIdx + 2) % 5,
                            (dIdx + tIdx + 3) % 5,
                            (dIdx + tIdx + 4) % 5
                        ];
                        for (let tempo of preferredTempos) {
                            if (this.isSlotDisabledForTurma(item.turma, dia, tempo, timetable)) continue;
                            if (!this.isProfAvailable(item.prof, dia, tempo)) continue;
                            if (timetable[item.turma.id][dia][tempo] !== null) continue;
                            if (teacherSchedule[item.prof.id][dia][tempo] !== null) continue;

                            timetable[item.turma.id][dia][tempo] = { disciplinaId: item.discId, professorId: item.prof.id };
                            teacherSchedule[item.prof.id][dia][tempo] = item.turma.id;
                            break;
                        }
                    });
                });
            });
        }

        // ----------------------------------------------------
        // FASE 2: ALOCAÇÃO DINÂMICA COM KEMPE CHAINS (SWAPS)
        // ----------------------------------------------------
        const unplaced = [];

        turmasToSchedule.forEach(turma => {
            const turmaLessons = [];
            Object.entries(turma.cargaHoraria || {}).forEach(([discId, countStr]) => {
                const count = parseInt(countStr, 10) || 0;
                const disc = this.discMap.get(discId);
                const profs = this.professoresPorDisciplina[discId] || [];
                if (profs.length === 0 || !disc) return;

                // Contar quantas aulas já foram pré-alocadas na Fase 1
                let alreadyPlaced = 0;
                this.dias.forEach(d => {
                    for (let t = 0; t < this.tempos; t++) {
                        if (timetable[turma.id][d][t] && timetable[turma.id][d][t].disciplinaId === discId) {
                            alreadyPlaced++;
                        }
                    }
                });

                const remaining = count - alreadyPlaced;
                for (let i = 0; i < remaining; i++) {
                    turmaLessons.push({
                        turmaId: turma.id,
                        turma: turma,
                        disciplinaId: discId,
                        disc: disc,
                        professoresPossiveis: profs,
                        maxAulasDia: disc.maxAulasPorDia || 2
                    });
                }
            });

            // Agendar primeiro disciplinas mais restritas (menor maxAulasPorDia)
            turmaLessons.sort((a, b) => a.maxAulasDia - b.maxAulasDia);

            turmaLessons.forEach(lesson => {
                let placed = false;
                const prof = lesson.professoresPossiveis[0];

                // Balanceamento: ordenar dias pelo menor número de aulas já marcadas nesta turma
                const sortedDias = [...this.dias].sort((d1, d2) => {
                    let c1 = 0, c2 = 0;
                    for (let t = 0; t < this.tempos; t++) {
                        if (timetable[turma.id][d1][t] !== null) c1++;
                        if (timetable[turma.id][d2][t] !== null) c2++;
                    }
                    return c1 - c2;
                });

                // 1. Tentar alocação direta em slot vazio
                for (let dia of sortedDias) {
                    if (this.countAulasDia(timetable, turma.id, dia, lesson.disciplinaId) >= lesson.maxAulasDia) continue;
                    for (let t = 0; t < this.tempos; t++) {
                        if (this.isSlotDisabledForTurma(turma, dia, t, timetable)) continue;
                        if (!this.isProfAvailable(prof, dia, t)) continue;
                        if (timetable[turma.id][dia][t] !== null) continue;
                        if (teacherSchedule[prof.id][dia][t] !== null) continue;

                        timetable[turma.id][dia][t] = { disciplinaId: lesson.disciplinaId, professorId: prof.id };
                        teacherSchedule[prof.id][dia][t] = turma.id;
                        placed = true;
                        break;
                    }
                    if (placed) break;
                }

                // 2. Kempe Swap Nível 1: Mover aula de outra turma para slot livre
                if (!placed) {
                    for (let dia of sortedDias) {
                        if (placed) break;
                        if (this.countAulasDia(timetable, turma.id, dia, lesson.disciplinaId) >= lesson.maxAulasDia) continue;

                        for (let t = 0; t < this.tempos; t++) {
                            if (this.isSlotDisabledForTurma(turma, dia, t, timetable)) continue;
                            if (!this.isProfAvailable(prof, dia, t)) continue;
                            if (timetable[turma.id][dia][t] !== null) continue;

                            const otherTurmaId = teacherSchedule[prof.id][dia][t];
                            if (otherTurmaId && otherTurmaId !== turma.id) {
                                const otherTurma = this.turmas.find(x => x.id === otherTurmaId);
                                if (!otherTurma) continue;

                                for (let d2 of this.dias) {
                                    if (placed) break;
                                    if (d2 !== dia && this.countAulasDia(timetable, otherTurmaId, d2, lesson.disciplinaId) >= lesson.maxAulasDia) continue;

                                    for (let t2 = 0; t2 < this.tempos; t2++) {
                                        if (this.isSlotDisabledForTurma(otherTurma, d2, t2, timetable)) continue;
                                        if (!this.isProfAvailable(prof, d2, t2)) continue;
                                        if (timetable[otherTurmaId][d2][t2] === null && teacherSchedule[prof.id][d2][t2] === null) {
                                            // Realocar na outra turma
                                            timetable[otherTurmaId][d2][t2] = { disciplinaId: lesson.disciplinaId, professorId: prof.id };
                                            teacherSchedule[prof.id][d2][t2] = otherTurmaId;

                                            // Alocar nesta turma
                                            timetable[turma.id][dia][t] = { disciplinaId: lesson.disciplinaId, professorId: prof.id };
                                            teacherSchedule[prof.id][dia][t] = turma.id;
                                            placed = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 3. Kempe Swap Nível 2: Trocar 2 aulas dentro da outra turma
                if (!placed) {
                    for (let dia of sortedDias) {
                        if (placed) break;
                        if (this.countAulasDia(timetable, turma.id, dia, lesson.disciplinaId) >= lesson.maxAulasDia) continue;

                        for (let t = 0; t < this.tempos; t++) {
                            if (placed) break;
                            if (this.isSlotDisabledForTurma(turma, dia, t, timetable)) continue;
                            if (!this.isProfAvailable(prof, dia, t)) continue;
                            if (timetable[turma.id][dia][t] !== null) continue;

                            const otherTurmaId = teacherSchedule[prof.id][dia][t];
                            if (otherTurmaId && otherTurmaId !== turma.id) {
                                const otherTurma = this.turmas.find(x => x.id === otherTurmaId);
                                if (!otherTurma) continue;

                                for (let d2 of this.dias) {
                                    if (placed) break;
                                    for (let t2 = 0; t2 < this.tempos; t2++) {
                                        if (this.isSlotDisabledForTurma(otherTurma, d2, t2, timetable)) continue;
                                        const otherLesson = timetable[otherTurmaId][d2][t2];
                                        if (!otherLesson || otherLesson.disciplinaId === lesson.disciplinaId) continue;

                                        const prof2 = this.profMap.get(otherLesson.professorId);
                                        const disc2 = this.discMap.get(otherLesson.disciplinaId);
                                        if (!prof2 || !disc2) continue;

                                        const max2 = disc2.maxAulasPorDia || 2;

                                        // Disponibilidade
                                        if (!this.isProfAvailable(prof, d2, t2)) continue;
                                        if (!this.isProfAvailable(prof2, dia, t)) continue;

                                        // Bloqueios com terceiros
                                        if (teacherSchedule[prof2.id][dia][t] !== null) continue;
                                        if (teacherSchedule[prof.id][d2][t2] !== null && teacherSchedule[prof.id][d2][t2] !== otherTurmaId) continue;

                                        // Limites diários
                                        if (d2 !== dia && this.countAulasDia(timetable, otherTurmaId, dia, otherLesson.disciplinaId) >= max2) continue;
                                        if (d2 !== dia && this.countAulasDia(timetable, otherTurmaId, d2, lesson.disciplinaId) >= lesson.maxAulasDia) continue;

                                        // Executar troca dentro da outra turma
                                        timetable[otherTurmaId][dia][t] = otherLesson;
                                        teacherSchedule[prof2.id][dia][t] = otherTurmaId;

                                        timetable[otherTurmaId][d2][t2] = { disciplinaId: lesson.disciplinaId, professorId: prof.id };
                                        teacherSchedule[prof.id][d2][t2] = otherTurmaId;

                                        // Liberou (dia, t) para a turma atual!
                                        timetable[turma.id][dia][t] = { disciplinaId: lesson.disciplinaId, professorId: prof.id };
                                        teacherSchedule[prof.id][dia][t] = turma.id;
                                        placed = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                // 4. Intra-Turma Move: Remanejar aula da própria turma para abrir slot
                if (!placed) {
                    for (let d1 of this.dias) {
                        if (placed) break;
                        for (let t1 = 0; t1 < this.tempos; t1++) {
                            if (this.isSlotDisabledForTurma(turma, d1, t1, timetable)) continue;
                            const ownSlot = timetable[turma.id][d1][t1];
                            if (!ownSlot || ownSlot.disciplinaId === lesson.disciplinaId) continue;

                            if (!this.isProfAvailable(prof, d1, t1) || teacherSchedule[prof.id][d1][t1] !== null) continue;
                            if (this.countAulasDia(timetable, turma.id, d1, lesson.disciplinaId) >= lesson.maxAulasDia) continue;

                            const ownProf = this.profMap.get(ownSlot.professorId);
                            const ownDisc = this.discMap.get(ownSlot.disciplinaId);
                            if (!ownProf || !ownDisc) continue;

                            for (let d2 of this.dias) {
                                if (placed) break;
                                if (d2 !== d1 && this.countAulasDia(timetable, turma.id, d2, ownSlot.disciplinaId) >= (ownDisc.maxAulasPorDia || 2)) continue;
                                for (let t2 = 0; t2 < this.tempos; t2++) {
                                    if (this.isSlotDisabledForTurma(turma, d2, t2, timetable)) continue;
                                    if (timetable[turma.id][d2][t2] !== null) continue;
                                    if (!this.isProfAvailable(ownProf, d2, t2) || teacherSchedule[ownProf.id][d2][t2] !== null) continue;

                                    // Remanejar aula interna
                                    timetable[turma.id][d2][t2] = ownSlot;
                                    teacherSchedule[ownProf.id][d2][t2] = turma.id;

                                    timetable[turma.id][d1][t1] = { disciplinaId: lesson.disciplinaId, professorId: prof.id };
                                    teacherSchedule[prof.id][d1][t1] = turma.id;
                                    placed = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (!placed) {
                    unplaced.push(lesson);
                }
            });
        });

        // Registrar o dia com 6 tempos efetivo de cada turma
        this.turmas.forEach(turma => {
            const agenda = timetable[turma.id];
            if (agenda) {
                this.dias.forEach(d => {
                    if (agenda[d] && agenda[d][5] !== null) {
                        turma.diaCom6TemposEfetivo = d;
                    }
                });
            }
        });

        // Contabilizar alocações
        let totalAllocated = 0;
        turmasToSchedule.forEach(t => {
            this.dias.forEach(d => {
                for (let tm = 0; tm < this.tempos; tm++) {
                    if (timetable[t.id][d][tm] !== null) totalAllocated++;
                }
            });
        });

        const isFullySuccess = unplaced.length === 0;

        return {
            success: isFullySuccess,
            isPartial: !isFullySuccess && totalAllocated > 0,
            timetable: timetable,
            teacherSchedule: teacherSchedule,
            allocated: totalAllocated,
            total: totalExpectedLessons,
            unplacedCount: unplaced.length
        };
    }
}

window.TimetableScheduler = TimetableScheduler;
