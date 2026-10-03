export type UserRole = 'Student' | 'Teacher' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean | null;
}

export type QuestionType = 'MultipleChoice' | 'TrueFalse' | 'Open';

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  points: number;
  order: number;
  options: Option[];
}

export interface ExamSummary {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  totalQuestions: number;
  totalPoints: number;
  isAssigned: boolean;
  hasSubmitted: boolean;
}

export interface ExamDetail {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  totalQuestions: number;
  totalPoints: number;
  questions: Question[];
}

export interface SubmissionStartedResponse {
  submissionId: string;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  startedAt: string;
  remainingSeconds: number;
  questions: Question[];
}

export interface SubmitAnswerDto {
  questionId: string;
  optionId?: string | null;
  openText?: string | null;
}

export interface AnswerResult {
  questionId: string;
  questionText: string;
  questionType: string;
  questionPoints: number;
  selectedOptionId?: string | null;
  selectedOptionText?: string | null;
  correctOptionText?: string | null;
  openAnswerText?: string | null;
  pointsAwarded?: number | null;
  isCorrect?: boolean | null;
  feedback?: string | null;
}

export interface SubmissionResult {
  submissionId: string;
  examId: string;
  examTitle: string;
  userId: string;
  userName: string;
  startedAt: string;
  submittedAt?: string | null;
  score: number;
  totalPossibleScore: number;
  status: 'InProgress' | 'Submitted' | 'Graded';
  answers: AnswerResult[];
}
