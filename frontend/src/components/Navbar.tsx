import React from 'react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onSwitchRole: (role: 'Teacher' | 'Student') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isExamRunning: boolean;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchRole,
  activeTab,
  setActiveTab,
  isExamRunning,
  onOpenLogin
}) => {
  return (
    <header style={{
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 2rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
             onClick={() => !isExamRunning && setActiveTab(currentUser?.role === 'Teacher' ? 'teacher' : 'student')}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#fff',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}>
            EP
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EvaluaPro
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Plataforma de Exámenes en Línea
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        {!isExamRunning && currentUser && (
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {currentUser.role === 'Student' ? (
              <>
                <button
                  className={`btn ${activeTab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('student')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Mis Exámenes
                </button>
                <button
                  className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('results')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Historial de Resultados
                </button>
              </>
            ) : (
              <>
                <button
                  className={`btn ${activeTab === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('teacher')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Panel Docente
                </button>
                <button
                  className={`btn ${activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('grading')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Calificaciones & Entregas
                </button>
              </>
            )}
          </nav>
        )}

        {/* User profile & Fast Role Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isExamRunning ? (
            <div className="badge badge-amber" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              Modo Examen Activo
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{currentUser?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser?.email}</div>
              </div>
              <span className={`badge ${currentUser?.role === 'Teacher' ? 'badge-purple' : 'badge-cyan'}`}>
                {currentUser?.role === 'Teacher' ? 'Docente' : 'Estudiante'}
              </span>

              {/* Login Modal Button */}
              {onOpenLogin && (
                <button
                  className="btn btn-primary"
                  title="Abrir formulario de Login"
                  onClick={onOpenLogin}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  🔐 Iniciar Sesión
                </button>
              )}

              {/* Quick Role switcher button for demo / testing */}
              <button
                className="btn btn-secondary"
                title="Cambiar entre rol Docente y Estudiante"
                onClick={() => onSwitchRole(currentUser?.role === 'Teacher' ? 'Student' : 'Teacher')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderColor: 'var(--border-accent)' }}
              >
                Cambiar a {currentUser?.role === 'Teacher' ? 'Estudiante' : 'Docente'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
