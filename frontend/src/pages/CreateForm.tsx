import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Question, Form } from '../types';
import { formsAPI } from '../services/api';

const CreateForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Form>>({
    title: '',
    description: '',
    questions: [
      { text: '', type: 'text', required: true, options: [] },
      { text: '', type: 'text', required: true, options: [] },
      { text: '', type: 'text', required: true, options: [] },
    ],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...(formData.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const addQuestion = () => {
    if ((formData.questions?.length || 0) < 5) {
      setFormData(prev => ({
        ...prev,
        questions: [
          ...(prev.questions || []),
          { text: '', type: 'text', required: true, options: [] },
        ],
      }));
    }
  };

  const removeQuestion = (index: number) => {
    if ((formData.questions?.length || 0) > 3) {
      const updatedQuestions = [...(formData.questions || [])];
      updatedQuestions.splice(index, 1);
      setFormData(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...(formData.questions || [])];
    const question = updatedQuestions[questionIndex];
    if (question.type === 'multiple-choice') {
      question.options = [...(question.options || []), ''];
    }
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...(formData.questions || [])];
    const question = updatedQuestions[questionIndex];
    if (question.options && question.options.length > 2) {
      question.options.splice(optionIndex, 1);
    }
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...(formData.questions || [])];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      question.options[optionIndex] = value;
    }
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Form title is required';
    }

    if (!formData.questions || formData.questions.length < 3) {
      newErrors.questions = 'At least 3 questions are required';
    } else if (formData.questions.length > 5) {
      newErrors.questions = 'Maximum 5 questions allowed';
    }

    formData.questions?.forEach((question, index) => {
      if (!question.text.trim()) {
        newErrors[`question_${index}`] = `Question ${index + 1} text is required`;
      }

      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length < 2) {
          newErrors[`question_${index}_options`] = `Question ${index + 1} must have at least 2 options`;
        } else {
          const emptyOptions = question.options.filter(opt => !opt.trim());
          if (emptyOptions.length > 0) {
            newErrors[`question_${index}_options`] = `Question ${index + 1} has empty options`;
          }
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await formsAPI.createForm(formData);
      navigate('/dashboard');
    } catch (error: any) {
      setErrors({ general: error.response?.data?.message || 'Failed to create form' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Form</h1>
          <p className="text-gray-600 mt-2">
            Build a feedback form with 3-5 questions to collect responses from your customers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Form Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Form Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter form title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Form Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this form is for..."
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
              <span className="text-sm text-gray-500">
                {formData.questions?.length || 0} of 5 questions
              </span>
            </div>

            {errors.questions && (
              <div className="mb-4 text-sm text-red-600">{errors.questions}</div>
            )}

            <div className="space-y-6">
              {formData.questions?.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Question {index + 1}
                    </h3>
                    {(formData.questions?.length || 0) > 3 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question Text *
                      </label>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border ${
                          errors[`question_${index}`] ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter your question"
                      />
                      {errors[`question_${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`question_${index}`]}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Question Type
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) => {
                            const newType = e.target.value as 'text' | 'multiple-choice';
                            handleQuestionChange(index, 'type', newType);
                            if (newType === 'multiple-choice' && !question.options?.length) {
                              handleQuestionChange(index, 'options', ['', '']);
                            }
                          }}
                          className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="multiple-choice">Multiple Choice</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Required</label>
                      </div>
                    </div>

                    {question.type === 'multiple-choice' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options
                        </label>
                        {errors[`question_${index}_options`] && (
                          <p className="mb-2 text-sm text-red-600">{errors[`question_${index}_options`]}</p>
                        )}
                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              {(question.options?.length || 0) > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(formData.questions?.length || 0) < 5 && (
              <button
                type="button"
                onClick={addQuestion}
                className="mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                + Add Question
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Form...' : 'Create Form'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateForm;
