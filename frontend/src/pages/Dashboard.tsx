import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Form } from '../types';
import { formsAPI } from '../services/api';
import { formatDate, generatePublicFormUrl, copyToClipboard } from '../utils/helpers';

const Dashboard: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formsAPI.getForms();
      setForms(response.forms || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (publicUrl: string, formId: string) => {
    const url = generatePublicFormUrl(publicUrl);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedFormId(formId);
      setTimeout(() => setCopiedFormId(null), 2000);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        await formsAPI.deleteForm(formId);
        setForms(forms.filter(form => form._id !== formId));
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete form');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your feedback forms and view responses
            </p>
          </div>
          <Link
            to="/forms/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create New Form
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No forms yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first feedback form to get started
            </p>
            <Link
              to="/forms/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Form
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {forms.map((form) => (
              <div
                key={form._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {form.title}
                    </h3>
                    {form.description && (
                      <p className="text-gray-600 mb-2">{form.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{form.questions.length} questions</span>
                      <span>{form.responseCount || 0} responses</span>
                      <span>Created {formatDate(form.createdAt!)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        form.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/forms/${form._id}/responses`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    View Responses ({form.responseCount || 0})
                  </Link>
                  
                  <button
                    onClick={() => handleCopyLink(form.publicUrl!, form._id!)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {copiedFormId === form._id ? 'Copied!' : 'Copy Link'}
                  </button>

                  <Link
                    to={`/forms/${form._id}/edit`}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDeleteForm(form._id!)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                {form.publicUrl && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-1">Public Form URL:</p>
                    <p className="text-sm font-mono text-blue-600 break-all">
                      {generatePublicFormUrl(form.publicUrl)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
