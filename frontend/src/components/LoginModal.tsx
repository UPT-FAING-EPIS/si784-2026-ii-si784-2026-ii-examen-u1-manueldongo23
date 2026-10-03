import React, { useState } from 'react';
import { User } from '../types';

interface LoginModalProps {
  onLogin: (user: User) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('student@exams.com');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'Student' | 'Teacher'>('Student');

  const handleDemoStudent = () => {
    onLogin({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Ana Gómez',
      email: 'student@exams.com',
      role: 'Student'
    });
  };

  const handleDemoTeacher = () => {
    onLogin({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Prof. Carlos Mendoza',
      email: 'teacher@exams.com',
      role: 'Teacher'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'Teacher') {
      onLogin({
        id: '11111111-1111-1111-1111-111111111111',
        name: email.includes('teacher') ? 'Prof. Carlos Mendoza' : email.split('@')[0],
        email: email,
        role: 'Teacher'
      });
    } else {
      onLogin({
        id: '22222222-2222-2222-2222-222222222222',
        name: email.includes('student') ? 'Ana Gómez' : email.split('@')[0],
        email: email,
        role: 'Student'
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)'
          }}>
            EP
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Iniciar Sesión en EvaluaPro
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Plataforma de Exámenes en Línea
          </p>
        </div>

        {/* Demo Credentials Alert */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 Credenciales de Acceso Rápido (Demo)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button 
              type="button"
              onClick={handleDemoStudent}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderColor: 'rgba(56, 189, 248, 0.4)' }}
            >
              👨‍🎓 Entrar como Estudiante
            </button>
            <button 
              type="button"
              onClick={handleDemoTeacher}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderColor: 'rgba(168, 85, 247, 0.4)' }}
            >
              👨‍🏫 Entrar como Docente
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Rol de Usuario
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'Student' | 'Teacher')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            >
              <option value="Student" style={{ background: '#111827' }}>Estudiante (student@exams.com)</option>
              <option value="Teacher" style={{ background: '#111827' }}>Docente / Profesor (teacher@exams.com)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@exams.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem', fontSize: '1rem' }}>
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};
