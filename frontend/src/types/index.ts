export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'business';
}

export interface Question {
  _id?: string;
  text: string;
  type: 'text' | 'multiple-choice';
  options?: string[];
  required: boolean;
}

export interface Form {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  questions: Question[];
  createdBy?: string;
  isActive?: boolean;
  publicUrl?: string;
  responseCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Answer {
  questionId: string;
  questionText: string;
  answer: string | string[];
}

export interface Response {
  _id: string;
  form: string;
  answers: Answer[];
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalResponses: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ResponseSummary {
  [questionId: string]: {
    questionText: string;
    questionType: 'text' | 'multiple-choice';
    totalAnswers: number;
    answerCounts: Record<string, number>;
  };
}
