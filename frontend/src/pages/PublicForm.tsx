import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Form } from '../types';
import { formsAPI, responsesAPI } from '../services/api';

const PublicForm: React.FC = () => {
  const { publicUrl } = useParams<{ publicUrl: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await formsAPI.getPublicForm(publicUrl!);
        setForm(response.form);
      } catch (error: any) {
        console.error('Failed to fetch form:', error);
      } finally {
        setLoading(false);
      }
    };

    if (publicUrl) {
      fetchForm();
    }
  }, [publicUrl]);

  const handleAnswerChange = (questionId: string, value: string | string[], questionType: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Clear error when user provides an answer
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const validateAnswers = () => {
    const newErrors: Record<string, string> = {};

    form?.questions.forEach((question) => {
      if (question.required && question._id) {
        const answer = answers[question._id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || 
            (typeof answer === 'string' && !answer.trim())) {
          newErrors[question._id] = 'This field is required';
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateAnswers();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        const question = form?.questions.find(q => q._id === questionId);
        return {
          questionId,
          questionText: question?.text || '',
          answer,
        };
      });

      await responsesAPI.submitResponse(publicUrl!, formattedAnswers);
      setSubmitted(true);
    } catch (error: any) {
      setErrors({ general: error.response?.data?.message || 'Failed to submit response' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
            <p className="text-gray-600">The form you're looking for doesn't exist or has been deactivated.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout showNavbar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600">
              Your feedback has been submitted successfully. We appreciate your time and input.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-8 text-white text-center">
              <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
              {form.description && (
                <p className="text-blue-100">{form.description}</p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              {form.questions.map((question, index) => (
                <div key={question._id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {question.type === 'text' ? (
                    <textarea
                      rows={3}
                      value={(answers[question._id!] as string) || ''}
                      onChange={(e) => handleAnswerChange(question._id!, e.target.value, question.type)}
                      className={`w-full px-3 py-2 border ${
                        errors[question._id!] ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter your response..."
                    />
                  ) : question.type === 'multiple-choice' ? (
                    <div className="space-y-2">
                      {question.options?.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={question._id}
                            value={option}
                            checked={(answers[question._id!] as string) === option}
                            onChange={(e) => handleAnswerChange(question._id!, e.target.value, question.type)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {errors[question._id!] && (
                    <p className="text-sm text-red-600">{errors[question._id!]}</p>
                  )}
                </div>
              ))}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                FeedbackHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PublicForm;
