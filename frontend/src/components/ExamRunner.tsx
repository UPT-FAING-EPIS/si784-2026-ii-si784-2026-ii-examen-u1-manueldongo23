import React, { useState, useEffect } from 'react';
import { SubmissionStartedResponse, SubmitAnswerDto } from '../types';

interface ExamRunnerProps {
  examData: SubmissionStartedResponse;
  onSubmit: (submissionId: string, answers: SubmitAnswerDto[]) => void;
  onCancel?: () => void;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  examData,
  onSubmit,
  onCancel
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(examData.remainingSeconds || examData.durationMinutes * 60);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; openText?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer effect with setInterval & auto-submit at 0
  useEffect(() => {
    if (remainingSeconds <= 0) {
      handleFinalSubmit();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = examData.questions[currentIdx];
  const totalQuestions = examData.questions.length;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], optionId }
    }));
  };

  const handleOpenTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], openText: text }
    }));
  };

  const answeredCount = examData.questions.filter(q => {
    const ans = answers[q.id];
    return ans && (ans.optionId || (ans.openText && ans.openText.trim().length > 0));
  }).length;

  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleFinalSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload: SubmitAnswerDto[] = examData.questions.map(q => {
      const userAns = answers[q.id];
      return {
        questionId: q.id,
        optionId: userAns?.optionId || null,
        openText: userAns?.openText || null
      };
    });

    onSubmit(examData.submissionId, payload);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Top Banner: Exam title, Timer, Progress */}
      <div className="glass-card" style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>Examen en Curso</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{examData.examTitle}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Pregunta {currentIdx + 1} de {totalQuestions} • {answeredCount} respondida(s) ({progressPercent}%)
          </div>
        </div>

        {/* Live Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: `1px solid ${remainingSeconds < 300 ? 'var(--accent-rose)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
              Tiempo Restante
            </div>
            <div className={`font-mono ${remainingSeconds < 300 ? 'timer-urgent' : ''}`}
                 style={{ fontSize: '1.65rem', fontWeight: 700, color: remainingSeconds < 300 ? '#f43f5e' : '#38bdf8' }}>
              {formatTime(remainingSeconds)}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar y Entregar'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: 'var(--gradient-brand)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Main Layout: Question + Question Map Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        {/* Left: Active Question */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-cyan">Pregunta #{currentIdx + 1}</span>
              <span className="badge badge-emerald">{currentQuestion.points} Puntos</span>
              <span className="badge badge-purple" style={{ textTransform: 'none' }}>
                {currentQuestion.type === 'MultipleChoice' ? 'Opción Múltiple' :
                 currentQuestion.type === 'TrueFalse' ? 'Verdadero / Falso' : 'Respuesta Abierta'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.6 }}>
            {currentQuestion.text}
          </div>

          {/* Options / Answer Input */}
          <div style={{ marginBottom: '2.5rem' }}>
            {currentQuestion.type === 'MultipleChoice' || currentQuestion.type === 'TrueFalse' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQuestion.id]?.optionId === opt.id;
                  const letter = String.fromCharCode(65 + oIdx);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--text-dim)'}`,
                        background: isSelected ? 'var(--accent-indigo)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}>
                        {letter}
                      </div>
                      <div style={{ fontSize: '0.975rem', color: isSelected ? '#fff' : 'var(--text-main)', flex: 1 }}>
                        {opt.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Escriba su respuesta detallada:
                </label>
                <textarea
                  className="textarea"
                  rows={6}
                  value={answers[currentQuestion.id]?.openText || ''}
                  onChange={(e) => handleOpenTextChange(currentQuestion.id, e.target.value)}
                  placeholder="Redacte aquí su justificación técnica o respuesta al problema..."
                  style={{ resize: 'vertical' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '0.4rem' }}>
                  {(answers[currentQuestion.id]?.openText || '').length} caracteres
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
            >
              ← Anterior
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
              >
                Siguiente →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                style={{ background: 'var(--accent-emerald)' }}
              >
                {isSubmitting ? 'Enviando...' : 'Revisar y Entregar'}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar: Question Grid Map */}
        <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
            Navegación de Preguntas
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {examData.questions.map((q, idx) => {
              const ans = answers[q.id];
              const isAnswered = ans && (ans.optionId || (ans.openText && ans.openText.trim().length > 0));
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    border: isCurrent ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: isAnswered ? 'rgba(16, 185, 129, 0.2)' : isCurrent ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isAnswered ? '#34d399' : isCurrent ? '#38bdf8' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Pregunta ${idx + 1}: ${isAnswered ? 'Respondida' : 'Pendiente'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.6)' }} />
              <span>Respondida</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', border: '1px solid var(--accent-cyan)' }} />
              <span>Pregunta Actual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span>Sin Responder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
