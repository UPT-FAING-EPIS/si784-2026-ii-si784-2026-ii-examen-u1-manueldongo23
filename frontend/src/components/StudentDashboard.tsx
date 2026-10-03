import React from 'react';
import { ExamSummary, SubmissionResult } from '../types';

interface StudentDashboardProps {
  exams: ExamSummary[];
  results: SubmissionResult[];
  onStartExam: (examId: string) => void;
  onViewResult: (result: SubmissionResult) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  exams,
  results,
  onStartExam,
  onViewResult
}) => {
  const completedCount = results.length;
  const pendingCount = exams.filter(e => !results.some(r => r.examId === e.id)).length;
  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + (r.score / (r.totalPossibleScore || 1)) * 100, 0) / results.length)
    : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header & KPI cards */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Portal del Estudiante
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Consulta tus evaluaciones activas, rinde tus exámenes programados y revisa el historial de calificaciones.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Exámenes Asignados
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {exams.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {pendingCount} pendiente(s) por rendir
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Evaluaciones Entregadas
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
            {completedCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Con retroalimentación docente
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
            Promedio General
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#c084fc', marginTop: '0.25rem' }}>
            {avgScore}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Rendimiento académico actual
          </div>
        </div>
      </div>

      {/* Available Exams Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Exámenes Programados</h2>
          <span className="badge badge-cyan">{exams.length} Disponibles</span>
        </div>

        {exams.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tienes exámenes asignados en este momento.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {exams.map(exam => {
              const submission = results.find(r => r.examId === exam.id);
              const isCompleted = !!submission;

              return (
                <div key={exam.id} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-amber'}`}>
                        {isCompleted ? 'Completado' : 'Disponible'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        ⏱ {exam.durationMinutes} min
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {exam.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      {exam.description || 'Evaluación integral de competencias y conocimientos adquiridos.'}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.5rem' }}>
                      <div>📝 {exam.totalQuestions} Preguntas • {exam.totalPoints} Pts Totales</div>
                      <div>📅 Vence: {new Date(exam.endsAt).toLocaleDateString()} a las {new Date(exam.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => onViewResult(submission)}
                        style={{ width: '100%', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                      >
                        Ver Resultado ({submission.score} pts)
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => onStartExam(exam.id)}
                        style={{ width: '100%' }}
                      >
                        Comenzar Examen Ahora
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
