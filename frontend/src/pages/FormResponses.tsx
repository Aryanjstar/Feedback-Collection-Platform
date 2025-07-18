import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Form, Response, ResponseSummary } from '../types';
import { formsAPI, responsesAPI } from '../services/api';
import { formatDate, downloadFile } from '../utils/helpers';

const FormResponses: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [summary, setSummary] = useState<ResponseSummary>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [activeTab, setActiveTab] = useState<'responses' | 'summary'>('responses');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await formsAPI.getForm(formId!);
        setForm(response.form);
      } catch (error) {
        console.error('Failed to fetch form:', error);
      }
    };

    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response = await responsesAPI.getResponses(formId!, currentPage, 20);
        setResponses(response.responses || []);
        setSummary(response.summary || {});
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalResponses(response.pagination?.totalResponses || 0);
      } catch (error) {
        console.error('Failed to fetch responses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      fetchForm();
      fetchResponses();
    }
  }, [formId, currentPage]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await responsesAPI.exportResponses(formId!);
      const blob = new Blob([response.data], { type: 'text/csv' });
      downloadFile(blob, `${form?.title || 'form'}_responses.csv`);
    } catch (error) {
      console.error('Failed to export responses:', error);
      alert('Failed to export responses. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (window.confirm('Are you sure you want to delete this response?')) {
      try {
        await responsesAPI.deleteResponse(responseId);
        setResponses(responses.filter(r => r._id !== responseId));
        setTotalResponses(prev => prev - 1);
      } catch (error) {
        console.error('Failed to delete response:', error);
        alert('Failed to delete response. Please try again.');
      }
    }
  };

  if (loading && responses.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link
              to="/dashboard"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{form?.title}</h1>
            <p className="text-gray-600 mt-2">
              {totalResponses} responses • Created {form?.createdAt && formatDate(form.createdAt)}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              disabled={exporting || totalResponses === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {totalResponses === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No responses yet
            </h3>
            <p className="text-gray-500 mb-6">
              Share your form to start collecting feedback
            </p>
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('responses')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'responses'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Responses ({totalResponses})
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Summary
                </button>
              </nav>
            </div>

            {activeTab === 'responses' ? (
              <div className="space-y-6">
                {/* Individual Responses */}
                {responses.map((response) => (
                  <div
                    key={response._id}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Submitted {formatDate(response.submittedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteResponse(response._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-4">
                      {response.answers.map((answer, index) => (
                        <div key={index}>
                          <p className="font-medium text-gray-900 mb-1">
                            {answer.questionText}
                          </p>
                          <p className="text-gray-700">
                            {Array.isArray(answer.answer)
                              ? answer.answer.join(', ')
                              : answer.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Summary Tab */
              <div className="space-y-6">
                {Object.entries(summary).map(([questionId, stats]) => (
                  <div
                    key={questionId}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {stats.questionText}
                    </h3>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        Total Answers: {stats.totalAnswers}
                      </p>
                    </div>

                    {stats.questionType === 'multiple-choice' ? (
                      <div className="space-y-2">
                        {Object.entries(stats.answerCounts).map(([answer, count]) => {
                          const percentage = stats.totalAnswers > 0 
                            ? Math.round((count / stats.totalAnswers) * 100) 
                            : 0;
                          
                          return (
                            <div key={answer} className="flex items-center space-x-3">
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700">{answer}</span>
                                  <span className="text-gray-500">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Text responses - view individual responses for details
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default FormResponses;
