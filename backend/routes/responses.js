const express = require('express');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const Form = require('../models/Form');
const Response = require('../models/Response');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/responses/:publicUrl
// @desc    Submit a response to a form
// @access  Public
router.post('/:publicUrl', [
  body('answers').isArray({ min: 1 }).withMessage('Answers are required'),
  body('answers.*.questionId').isMongoId().withMessage('Invalid question ID'),
  body('answers.*.answer').exists().withMessage('Answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { answers } = req.body;
    const { publicUrl } = req.params;

    // Find the form
    const form = await Form.findOne({ publicUrl, isActive: true });
    if (!form) {
      return res.status(404).json({ message: 'Form not found or inactive' });
    }

    // Validate answers against form questions
    const formQuestionIds = form.questions.map(q => q._id.toString());
    const answerQuestionIds = answers.map(a => a.questionId);

    // Check if all required questions are answered
    const requiredQuestions = form.questions.filter(q => q.required);
    const answeredRequiredQuestions = answers.filter(a => 
      requiredQuestions.some(q => q._id.toString() === a.questionId)
    );

    if (answeredRequiredQuestions.length < requiredQuestions.length) {
      return res.status(400).json({ message: 'All required questions must be answered' });
    }

    // Validate each answer
    const validatedAnswers = [];
    for (let answer of answers) {
      const question = form.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) {
        return res.status(400).json({ 
          message: `Invalid question ID: ${answer.questionId}` 
        });
      }

      // Validate multiple choice answers
      if (question.type === 'multiple-choice') {
        if (Array.isArray(answer.answer)) {
          // Multiple selection
          const invalidOptions = answer.answer.filter(opt => 
            !question.options.includes(opt)
          );
          if (invalidOptions.length > 0) {
            return res.status(400).json({ 
              message: `Invalid options for question "${question.text}": ${invalidOptions.join(', ')}` 
            });
          }
        } else {
          // Single selection
          if (!question.options.includes(answer.answer)) {
            return res.status(400).json({ 
              message: `Invalid option for question "${question.text}": ${answer.answer}` 
            });
          }
        }
      }

      validatedAnswers.push({
        questionId: answer.questionId,
        questionText: question.text,
        answer: answer.answer
      });
    }

    // Create response
    const response = new Response({
      form: form._id,
      answers: validatedAnswers,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await response.save();

    // Update form's responses array
    await Form.findByIdAndUpdate(form._id, {
      $push: { responses: response._id }
    });

    res.status(201).json({
      message: 'Response submitted successfully',
      responseId: response._id
    });
  } catch (error) {
    console.error('Response submission error:', error);
    res.status(500).json({ message: 'Server error during response submission' });
  }
});

// @route   GET /api/responses/form/:formId
// @desc    Get all responses for a specific form
// @access  Private
router.get('/form/:formId', auth, async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify form ownership
    const form = await Form.findOne({ 
      _id: formId, 
      createdBy: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Get responses with pagination
    const responses = await Response.find({ form: formId })
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const totalResponses = await Response.countDocuments({ form: formId });

    // Generate summary statistics
    const summary = {};
    
    for (let question of form.questions) {
      const questionId = question._id.toString();
      const questionStats = {
        questionText: question.text,
        questionType: question.type,
        totalAnswers: 0,
        answerCounts: {}
      };

      // Count answers for this question
      const questionResponses = await Response.aggregate([
        { $match: { form: form._id } },
        { $unwind: '$answers' },
        { $match: { 'answers.questionId': question._id } },
        { $group: {
          _id: '$answers.answer',
          count: { $sum: 1 }
        }}
      ]);

      questionStats.totalAnswers = questionResponses.reduce((sum, resp) => sum + resp.count, 0);
      
      questionResponses.forEach(resp => {
        questionStats.answerCounts[resp._id] = resp.count;
      });

      summary[questionId] = questionStats;
    }

    res.json({
      responses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResponses / limit),
        totalResponses,
        hasNext: page * limit < totalResponses,
        hasPrev: page > 1
      },
      summary
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Server error while fetching responses' });
  }
});

// @route   GET /api/responses/form/:formId/export
// @desc    Export responses as CSV
// @access  Private
router.get('/form/:formId/export', auth, async (req, res) => {
  try {
    const { formId } = req.params;

    // Verify form ownership
    const form = await Form.findOne({ 
      _id: formId, 
      createdBy: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Get all responses
    const responses = await Response.find({ form: formId })
      .sort({ submittedAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({ message: 'No responses found' });
    }

    // Prepare data for CSV
    const csvData = [];
    
    responses.forEach(response => {
      const row = {
        'Submitted At': response.submittedAt.toISOString(),
        'Response ID': response._id.toString()
      };

      // Add answers
      response.answers.forEach(answer => {
        const key = answer.questionText;
        row[key] = Array.isArray(answer.answer) 
          ? answer.answer.join(', ') 
          : answer.answer;
      });

      csvData.push(row);
    });

    // Generate CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title}_responses.csv"`);
    
    res.send(csv);
  } catch (error) {
    console.error('Export responses error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

// @route   DELETE /api/responses/:responseId
// @desc    Delete a specific response
// @access  Private
router.delete('/:responseId', auth, async (req, res) => {
  try {
    const { responseId } = req.params;

    const response = await Response.findById(responseId).populate('form');
    
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Verify form ownership
    if (response.form.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Response.findByIdAndDelete(responseId);

    // Remove response from form's responses array
    await Form.findByIdAndUpdate(response.form._id, {
      $pull: { responses: responseId }
    });

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ message: 'Server error during response deletion' });
  }
});

module.exports = router;
