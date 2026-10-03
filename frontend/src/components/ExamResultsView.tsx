import React from 'react';
import { SubmissionResult } from '../types';

interface ExamResultsViewProps {
  result: SubmissionResult;
  onBack: () => void;
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({ result, onBack }) => {
  const percentage = Math.round((result.score / (result.totalPossibleScore || 1)) * 100);
  const isPassing = percentage >= 60;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
        ← Volver al Listado
      </button>

      {/* Score Header Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span className={`badge ${result.status === 'Graded' ? 'badge-emerald' : 'badge-amber'}`} style={{ marginBottom: '0.5rem' }}>
            {result.status === 'Graded' ? 'Calificación Final' : 'Pendiente de Revisión Docente'}
          </span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{result.examTitle}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Estudiante: <strong>{result.userName}</strong> • Fecha de Entrega: {new Date(result.submittedAt || '').toLocaleString()}
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          border: `2px solid ${isPassing ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 2rem'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: isPassing ? '#34d399' : '#fb7185', lineHeight: 1 }}>
            {result.score} / {result.totalPossibleScore}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            {percentage}% de Acierto
          </div>
        </div>
      </div>

      {/* Questions Breakdown */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Detalle de Respuestas</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {result.answers.map((ans, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="badge badge-purple">Pregunta #{idx + 1}</span>
              <span className={`badge ${ans.pointsAwarded && ans.pointsAwarded > 0 ? 'badge-emerald' : 'badge-amber'}`}>
                {ans.pointsAwarded ?? 'Pendiente'} / {ans.questionPoints} pts
              </span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
              {ans.questionText}
            </div>

            {ans.questionType === 'Open' ? (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Tu respuesta:</div>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                  {ans.openAnswerText || 'Sin respuesta.'}
                </div>
                {ans.feedback && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c084fc', fontSize: '0.875rem' }}>
                    <strong>Comentario del docente:</strong> {ans.feedback}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
                <div>Tu respuesta: <strong style={{ color: ans.isCorrect ? '#34d399' : '#f43f5e' }}>{ans.selectedOptionText || 'Sin responder'}</strong></div>
                {ans.correctOptionText && <div>Respuesta correcta: <span style={{ color: '#38bdf8' }}>{ans.correctOptionText}</span></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
