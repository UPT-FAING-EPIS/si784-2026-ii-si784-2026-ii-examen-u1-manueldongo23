import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ExamRunner } from './components/ExamRunner';
import { ExamResultsView } from './components/ExamResultsView';
import { LoginModal } from './components/LoginModal';
import { User, ExamSummary, SubmissionResult, SubmissionStartedResponse, SubmitAnswerDto } from './types';

// Initial Mock / Seed data for standalone immediate usability
const INITIAL_TEACHER: User = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Prof. Carlos Mendoza',
  email: 'teacher@exams.com',
  role: 'Teacher'
};

const INITIAL_STUDENT: User = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Ana Gómez',
  email: 'student@exams.com',
  role: 'Student'
};

const INITIAL_EXAMS: ExamSummary[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Examen Parcial: Arquitectura en la Nube y DevOps',
    description: 'Evaluación sobre contenedores, pipelines CI/CD de GitHub Actions, escaneos Sonar/Snyk e infraestructura con Terraform.',
    durationMinutes: 45,
    startsAt: new Date(Date.now() - 3600000).toISOString(),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdBy: INITIAL_TEACHER.id,
    totalQuestions: 3,
    totalPoints: 20,
    isAssigned: true,
    hasSubmitted: false
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Quiz Rápido: Fundamentos de C# y .NET 8 Web API',
    description: 'Preguntas sobre Entity Framework Core, inyección de dependencias y autenticación con tokens JWT.',
    durationMinutes: 20,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    createdBy: INITIAL_TEACHER.id,
    totalQuestions: 2,
    totalPoints: 15,
    isAssigned: true,
    hasSubmitted: false
  }
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_STUDENT);
  const [activeTab, setActiveTab] = useState<string>('student');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [exams, setExams] = useState<ExamSummary[]>(INITIAL_EXAMS);
  const [activeExamSession, setActiveExamSession] = useState<SubmissionStartedResponse | null>(null);
  const [selectedResult, setSelectedResult] = useState<SubmissionResult | null>(null);

  const [submissions, setSubmissions] = useState<SubmissionResult[]>([
    {
      submissionId: 'sub-demo-01',
      examId: '44444444-4444-4444-4444-444444444444',
      examTitle: 'Quiz Rápido: Fundamentos de C# y .NET 8 Web API',
      userId: INITIAL_STUDENT.id,
      userName: INITIAL_STUDENT.name,
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      submittedAt: new Date(Date.now() - 6000000).toISOString(),
      score: 15,
      totalPossibleScore: 15,
      status: 'Graded',
      answers: [
        {
          questionId: 'q-demo-1',
          questionText: '¿Cuál interfaz se usa comúnmente para inyectar configuración en ASP.NET Core?',
          questionType: 'MultipleChoice',
          questionPoints: 10,
          selectedOptionId: 'opt-1',
          selectedOptionText: 'IConfiguration',
          correctOptionText: 'IConfiguration',
          pointsAwarded: 10,
          isCorrect: true
        },
        {
          questionId: 'q-demo-2',
          questionText: 'EF Core permite rastreo de entidades mediante ChangeTracker.',
          questionType: 'TrueFalse',
          questionPoints: 5,
          selectedOptionId: 'opt-3',
          selectedOptionText: 'Verdadero',
          correctOptionText: 'Verdadero',
          pointsAwarded: 5,
          isCorrect: true
        }
      ]
    }
  ]);

  const handleSwitchRole = (role: 'Teacher' | 'Student') => {
    if (role === 'Teacher') {
      setCurrentUser(INITIAL_TEACHER);
      setActiveTab('teacher');
    } else {
      setCurrentUser(INITIAL_STUDENT);
      setActiveTab('student');
    }
  };

  const handleStartExam = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    // Build interactive exam runner data with rich questions
    const session: SubmissionStartedResponse = {
      submissionId: 'sub-' + Math.random().toString(36).substring(2, 9),
      examId: exam.id,
      examTitle: exam.title,
      durationMinutes: exam.durationMinutes,
      startedAt: new Date().toISOString(),
      remainingSeconds: exam.durationMinutes * 60,
      questions: [
        {
          id: 'q1',
          examId: exam.id,
          order: 1,
          points: 5,
          type: 'MultipleChoice',
          text: '¿Cuál es el beneficio de compilar una imagen con Docker multi-stage en el pipeline de despliegue?',
          options: [
            { id: 'opt1_1', text: 'Permite reducir drásticamente el tamaño final de la imagen al descartar el SDK de compilación.' },
            { id: 'opt1_2', text: 'Permite ejecutar el código sin necesidad de compilar.' },
            { id: 'opt1_3', text: 'Reemplaza la necesidad de usar Terraform para crear recursos.' }
          ]
        },
        {
          id: 'q2',
          examId: exam.id,
          order: 2,
          points: 5,
          type: 'TrueFalse',
          text: 'En GitHub Actions, los secretos configurados en el repositorio (ej. SONAR_TOKEN, AZURE_CLIENT_ID) son ofuscados en los logs de ejecución.',
          options: [
            { id: 'opt2_1', text: 'Verdadero' },
            { id: 'opt2_2', text: 'Falso' }
          ]
        },
        {
          id: 'q3',
          examId: exam.id,
          order: 3,
          points: 10,
          type: 'Open',
          text: 'Describa cómo la combinación de SonarCloud y Semgrep previene tanto vulnerabilidades de código fuente (SAST) como security hotspots en el ciclo de vida del software.',
          options: []
        }
      ]
    };

    setActiveExamSession(session);
  };

  const handleSubmitExam = (submissionId: string, answers: SubmitAnswerDto[]) => {
    if (!activeExamSession) return;

    // Auto-grade MC and TF, mark Open for grading
    const q1Ans = answers.find(a => a.questionId === 'q1');
    const q2Ans = answers.find(a => a.questionId === 'q2');
    const q3Ans = answers.find(a => a.questionId === 'q3');

    const isQ1Correct = q1Ans?.optionId === 'opt1_1';
    const isQ2Correct = q2Ans?.optionId === 'opt2_1';

    let initialScore = 0;
    if (isQ1Correct) initialScore += 5;
    if (isQ2Correct) initialScore += 5;

    const newSubmission: SubmissionResult = {
      submissionId,
      examId: activeExamSession.examId,
      examTitle: activeExamSession.examTitle,
      userId: currentUser.id,
      userName: currentUser.name,
      startedAt: activeExamSession.startedAt,
      submittedAt: new Date().toISOString(),
      score: initialScore,
      totalPossibleScore: 20,
      status: 'Submitted', // Awaiting grading for Q3 open question
      answers: [
        {
          questionId: 'q1',
          questionText: '¿Cuál es el beneficio de compilar una imagen con Docker multi-stage en el pipeline de despliegue?',
          questionType: 'MultipleChoice',
          questionPoints: 5,
          selectedOptionId: q1Ans?.optionId,
          selectedOptionText: q1Ans?.optionId === 'opt1_1' ? 'Permite reducir drásticamente el tamaño final de la imagen al descartar el SDK de compilación.' : 'Otra opción',
          correctOptionText: 'Permite reducir drásticamente el tamaño final de la imagen al descartar el SDK de compilación.',
          pointsAwarded: isQ1Correct ? 5 : 0,
          isCorrect: isQ1Correct
        },
        {
          questionId: 'q2',
          questionText: 'En GitHub Actions, los secretos configurados en el repositorio (ej. SONAR_TOKEN, AZURE_CLIENT_ID) son ofuscados en los logs de ejecución.',
          questionType: 'TrueFalse',
          questionPoints: 5,
          selectedOptionId: q2Ans?.optionId,
          selectedOptionText: q2Ans?.optionId === 'opt2_1' ? 'Verdadero' : 'Falso',
          correctOptionText: 'Verdadero',
          pointsAwarded: isQ2Correct ? 5 : 0,
          isCorrect: isQ2Correct
        },
        {
          questionId: 'q3',
          questionText: 'Describa cómo la combinación de SonarCloud y Semgrep previene tanto vulnerabilidades de código fuente (SAST) como security hotspots en el ciclo de vida del software.',
          questionType: 'Open',
          questionPoints: 10,
          openAnswerText: q3Ans?.openText || 'Sin respuesta redactada.',
          pointsAwarded: null, // pending review
          isCorrect: null,
          feedback: null
        }
      ]
    };

    setSubmissions(prev => [newSubmission, ...prev]);
    setActiveExamSession(null);
    setSelectedResult(newSubmission);
  };

  const handleCreateExam = (newExamData: any) => {
    const newExam: ExamSummary = {
      id: 'exam-' + Date.now(),
      title: newExamData.title,
      description: newExamData.description,
      durationMinutes: newExamData.durationMinutes,
      startsAt: newExamData.startsAt,
      endsAt: newExamData.endsAt,
      createdBy: currentUser.id,
      totalQuestions: newExamData.questions.length,
      totalPoints: newExamData.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0),
      isAssigned: true,
      hasSubmitted: false
    };

    setExams(prev => [newExam, ...prev]);
  };

  const handleGradeAnswer = (submissionId: string, answerId: string, pointsAwarded: number, feedback: string) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.submissionId !== submissionId) return sub;

      const updatedAnswers = sub.answers.map(ans => {
        if (ans.questionId === answerId) {
          return {
            ...ans,
            pointsAwarded,
            feedback
          };
        }
        return ans;
      });

      const newTotalScore = updatedAnswers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
      const isStillPending = updatedAnswers.some(a => a.pointsAwarded === null);

      return {
        ...sub,
        score: newTotalScore,
        status: isStillPending ? 'Submitted' : 'Graded',
        answers: updatedAnswers
      };
    }));
  };

  const handleLoginUser = (user: User) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'Teacher' ? 'teacher' : 'student');
    setShowLoginModal(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showLoginModal && (
        <LoginModal
          onLogin={handleLoginUser}
          onClose={() => setShowLoginModal(false)}
        />
      )}
      <Navbar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setSelectedResult(null);
        }}
        isExamRunning={!!activeExamSession}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main style={{ flex: 1 }}>
        {activeExamSession ? (
          <ExamRunner
            examData={activeExamSession}
            onSubmit={handleSubmitExam}
            onCancel={() => setActiveExamSession(null)}
          />
        ) : selectedResult ? (
          <ExamResultsView
            result={selectedResult}
            onBack={() => setSelectedResult(null)}
          />
        ) : currentUser.role === 'Student' ? (
          <StudentDashboard
            exams={exams}
            results={submissions.filter(s => s.userId === currentUser.id)}
            onStartExam={handleStartExam}
            onViewResult={(r) => setSelectedResult(r)}
          />
        ) : (
          <TeacherDashboard
            exams={exams}
            submissions={submissions}
            onCreateExam={handleCreateExam}
            onGradeAnswer={handleGradeAnswer}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.95)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            EvaluaPro © 2026 • Arquitectura .NET 8 Web API + PostgreSQL + React + Vite + Terraform + Azure
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Backend: Docker Alpine</span>
            <span>Seguridad: SonarQube & Semgrep</span>
            <span>IaC: Terraform azurerm</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
