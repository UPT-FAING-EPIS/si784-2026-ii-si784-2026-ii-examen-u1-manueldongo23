import React, { useState } from 'react';
import { ExamSummary, SubmissionResult } from '../types';

interface TeacherDashboardProps {
  exams: ExamSummary[];
  submissions: SubmissionResult[];
  onCreateExam: (examData: {
    title: string;
    description: string;
    durationMinutes: number;
    startsAt: string;
    endsAt: string;
    questions: any[];
  }) => void;
  onGradeAnswer: (submissionId: string, answerId: string, pointsAwarded: number, feedback: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  exams,
  submissions,
  onCreateExam,
  onGradeAnswer
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'exams' | 'grading'>('exams');

  // New Exam Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));

  // Question Builder State
  const [questions, setQuestions] = useState<any[]>([
    {
      text: '¿Cuál es la diferencia principal entre un contenedor Docker y una máquina virtual?',
      type: 'MultipleChoice',
      points: 10,
      options: [
        { text: 'Los contenedores comparten el kernel del host haciéndolos más ligeros', isCorrect: true },
        { text: 'Las máquinas virtuales no requieren hipervisor', isCorrect: false },
        { text: 'Los contenedores son más lentos al iniciar', isCorrect: false }
      ]
    }
  ]);

  const [formError, setFormError] = useState('');

  // Grading state
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResult | null>(null);
  const [gradingPoints, setGradingPoints] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});

  const handleAddQuestion = (type: 'MultipleChoice' | 'TrueFalse' | 'Open') => {
    if (type === 'MultipleChoice') {
      setQuestions(prev => [
        ...prev,
        {
          text: '',
          type: 'MultipleChoice',
          points: 10,
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false }
          ]
        }
      ]);
    } else if (type === 'TrueFalse') {
      setQuestions(prev => [
        ...prev,
        {
          text: '',
          type: 'TrueFalse',
          points: 5,
          options: [
            { text: 'Verdadero', isCorrect: true },
            { text: 'Falso', isCorrect: false }
          ]
        }
      ]);
    } else {
      setQuestions(prev => [
        ...prev,
        {
          text: '',
          type: 'Open',
          points: 15,
          options: []
        }
      ]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Frontend Validations mirroring backend rules
    if (!title.trim() || title.length < 3 || title.length > 150) {
      setFormError('El título debe tener entre 3 y 150 caracteres.');
      return;
    }
    if (durationMinutes < 1 || durationMinutes > 480) {
      setFormError('La duración debe estar entre 1 y 480 minutos.');
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    if (questions.length === 0) {
      setFormError('Debe agregar al menos una pregunta al examen.');
      return;
    }

    onCreateExam({
      title: title.trim(),
      description: description.trim(),
      durationMinutes,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      questions
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>
            Panel de Gestión Docente
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Administra exámenes, configura el banco de preguntas y califica respuestas de estudiantes.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
        >
          + Crear Nuevo Examen
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'exams' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('exams')}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}
        >
          Exámenes Creados ({exams.length})
        </button>
        <button
          className={`btn ${activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('grading')}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}
        >
          Entregas de Estudiantes ({submissions.length})
        </button>
      </div>

      {activeTab === 'exams' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {exams.map(exam => (
            <div key={exam.id} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge badge-purple">Docente Creador</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>⏱ {exam.durationMinutes} min</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{exam.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {exam.description || 'Sin descripción.'}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>📊 {exam.totalQuestions} preguntas • {exam.totalPoints} puntos totales</div>
                <div>📅 Inicio: {new Date(exam.startsAt).toLocaleDateString()}</div>
                <div>🏁 Fin: {new Date(exam.endsAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => setActiveTab('grading')}>
                  Ver Entregas
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem', borderColor: 'var(--border-accent)' }}>
                  Asignar Grupo
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grading tab */
        <div>
          {submissions.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aún no hay entregas registradas para calificar.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
              {/* Submissions List */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Entregas Recibidas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {submissions.map(sub => (
                    <div
                      key={sub.submissionId}
                      onClick={() => setSelectedSubmission(sub)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: selectedSubmission?.submissionId === sub.submissionId ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${selectedSubmission?.submissionId === sub.submissionId ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sub.userName}</span>
                        <span className={`badge ${sub.status === 'Graded' ? 'badge-emerald' : 'badge-amber'}`}>
                          {sub.status === 'Graded' ? 'Calificado' : 'Por Revisar'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.examTitle}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                        Puntaje: {sub.score} / {sub.totalPossibleScore} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Detail & Open Answer Grading */}
              {selectedSubmission ? (
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedSubmission.examTitle}</h2>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Estudiante: <strong>{selectedSubmission.userName}</strong> • Entregado: {new Date(selectedSubmission.submittedAt || '').toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                        {selectedSubmission.score} / {selectedSubmission.totalPossibleScore}
                      </div>
                      <span className="badge badge-cyan">Puntaje Total</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {selectedSubmission.answers.map((ans, idx) => (
                      <div key={idx} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span className="badge badge-purple">Pregunta #{idx + 1} ({ans.questionPoints} pts)</span>
                          <span className="badge badge-cyan">{ans.questionType}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>{ans.questionText}</div>

                        {ans.questionType === 'Open' ? (
                          <div>
                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontStyle: 'italic', color: '#e2e8f0' }}>
                              "{ans.openAnswerText || 'Sin respuesta del estudiante.'}"
                            </div>

                            {/* Grading Inputs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                              <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.2rem' }}>Puntos (0-{ans.questionPoints})</label>
                                <input
                                  type="number"
                                  className="input"
                                  min={0}
                                  max={ans.questionPoints}
                                  value={gradingPoints[ans.questionId] ?? (ans.pointsAwarded ?? 0)}
                                  onChange={(e) => setGradingPoints({ ...gradingPoints, [ans.questionId]: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.2rem' }}>Retroalimentación al Estudiante</label>
                                <input
                                  type="text"
                                  className="input"
                                  placeholder="Ej: Buena explicación, profundizar en..."
                                  value={gradingFeedback[ans.questionId] ?? (ans.feedback || '')}
                                  onChange={(e) => setGradingFeedback({ ...gradingFeedback, [ans.questionId]: e.target.value })}
                                />
                              </div>
                              <button
                                className="btn btn-primary"
                                style={{ alignSelf: 'flex-end', height: '42px', fontSize: '0.85rem' }}
                                onClick={() => {
                                  const pts = gradingPoints[ans.questionId] ?? (ans.pointsAwarded ?? 0);
                                  const fb = gradingFeedback[ans.questionId] ?? (ans.feedback || '');
                                  onGradeAnswer(selectedSubmission.submissionId, ans.questionId, pts, fb);
                                }}
                              >
                                Guardar Nota
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem' }}>
                            <div>Respuesta seleccionada: <strong style={{ color: ans.isCorrect ? '#34d399' : '#f43f5e' }}>{ans.selectedOptionText || 'No respondió'}</strong></div>
                            <div>Opción correcta: <span style={{ color: '#38bdf8' }}>{ans.correctOptionText}</span></div>
                            <div style={{ marginTop: '0.4rem', fontWeight: 600 }}>Puntos asignados: {ans.pointsAwarded} / {ans.questionPoints}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Selecciona una entrega de la lista lateral para visualizar sus respuestas y calificar.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Crear Nuevo Examen */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Crear Nuevo Examen</h2>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ padding: '0.35rem 0.75rem' }}>✕</button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.2)', border: '1px solid var(--accent-rose)', borderRadius: 'var(--radius-md)', color: '#fb7185', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Título del Examen (3-150 car.) *</label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Examen Parcial de Bases de Datos NoSQL"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Descripción / Instrucciones</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instrucciones para los estudiantes antes de comenzar el examen..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Duración (min) *</label>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      max={480}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Fecha de Inicio *</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Fecha de Fin *</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Banco de Preguntas ({questions.length})</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={() => handleAddQuestion('MultipleChoice')}>
                      + Opción Múltiple
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={() => handleAddQuestion('TrueFalse')}>
                      + V/F
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={() => handleAddQuestion('Open')}>
                      + Abierta
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge badge-cyan">#{qIndex + 1} - {q.type}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Puntos:</label>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '70px', padding: '0.2rem 0.5rem' }}
                            value={q.points}
                            min={1}
                            max={100}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].points = parseInt(e.target.value) || 1;
                              setQuestions(updated);
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        className="input"
                        placeholder="Enunciado de la pregunta..."
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].text = e.target.value;
                          setQuestions(updated);
                        }}
                        style={{ marginBottom: '0.75rem' }}
                        required
                      />

                      {/* Options editing for MC and TF */}
                      {(q.type === 'MultipleChoice' || q.type === 'TrueFalse') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                          {q.options.map((opt: any, oIndex: number) => (
                            <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={opt.isCorrect}
                                onChange={() => {
                                  const updated = [...questions];
                                  updated[qIndex].options.forEach((o: any, idx: number) => {
                                    o.isCorrect = idx === oIndex;
                                  });
                                  setQuestions(updated);
                                }}
                                title="Marcar como opción correcta"
                              />
                              <input
                                type="text"
                                className="input"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                                value={opt.text}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[qIndex].options[oIndex].text = e.target.value;
                                  setQuestions(updated);
                                }}
                                placeholder={`Opción ${oIndex + 1}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                  Guardar y Publicar Examen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
