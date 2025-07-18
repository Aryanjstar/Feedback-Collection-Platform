const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const Form = require('../models/Form');
const Response = require('../models/Response');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/forms
// @desc    Create a new form
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('questions').isArray({ min: 3, max: 5 }).withMessage('Must have between 3-5 questions'),
  body('questions.*.text').trim().isLength({ min: 1 }).withMessage('Question text is required'),
  body('questions.*.type').isIn(['text', 'multiple-choice']).withMessage('Invalid question type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions } = req.body;

    // Validate multiple choice questions have options
    for (let question of questions) {
      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length < 2) {
          return res.status(400).json({ 
            message: 'Multiple choice questions must have at least 2 options' 
          });
        }
      }
    }

    // Generate unique public URL
    const publicUrl = uuidv4();

    const form = new Form({
      title,
      description,
      questions,
      createdBy: req.user._id,
      publicUrl
    });

    await form.save();

    res.status(201).json({
      message: 'Form created successfully',
      form: {
        id: form._id,
        title: form.title,
        description: form.description,
        questions: form.questions,
        publicUrl: form.publicUrl,
        isActive: form.isActive,
        createdAt: form.createdAt
      }
    });
  } catch (error) {
    console.error('Form creation error:', error);
    res.status(500).json({ message: 'Server error during form creation' });
  }
});

// @route   GET /api/forms
// @desc    Get all forms for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const forms = await Form.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    // Add response count to each form
    const formsWithCounts = await Promise.all(forms.map(async (form) => {
      const responseCount = await Response.countDocuments({ form: form._id });
      return {
        ...form.toObject(),
        responseCount
      };
    }));

    res.json({ forms: formsWithCounts });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ message: 'Server error while fetching forms' });
  }
});

// @route   GET /api/forms/:id
// @desc    Get a specific form
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    }).select('-__v');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const responseCount = await Response.countDocuments({ form: form._id });

    res.json({
      form: {
        ...form.toObject(),
        responseCount
      }
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ message: 'Server error while fetching form' });
  }
});

// @route   GET /api/forms/public/:publicUrl
// @desc    Get a form by public URL (for public access)
// @access  Public
router.get('/public/:publicUrl', async (req, res) => {
  try {
    const form = await Form.findOne({ 
      publicUrl: req.params.publicUrl,
      isActive: true 
    }).select('title description questions publicUrl');

    if (!form) {
      return res.status(404).json({ message: 'Form not found or inactive' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({ message: 'Server error while fetching form' });
  }
});

// @route   PUT /api/forms/:id
// @desc    Update a form
// @access  Private
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('questions').optional().isArray({ min: 3, max: 5 }).withMessage('Must have between 3-5 questions')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, isActive } = req.body;

    const form = await Form.findOne({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Update fields
    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (questions !== undefined) form.questions = questions;
    if (isActive !== undefined) form.isActive = isActive;

    await form.save();

    res.json({
      message: 'Form updated successfully',
      form: {
        id: form._id,
        title: form.title,
        description: form.description,
        questions: form.questions,
        publicUrl: form.publicUrl,
        isActive: form.isActive,
        updatedAt: form.updatedAt
      }
    });
  } catch (error) {
    console.error('Form update error:', error);
    res.status(500).json({ message: 'Server error during form update' });
  }
});

// @route   DELETE /api/forms/:id
// @desc    Delete a form
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Delete all responses for this form
    await Response.deleteMany({ form: form._id });

    // Delete the form
    await Form.findByIdAndDelete(form._id);

    res.json({ message: 'Form and all associated responses deleted successfully' });
  } catch (error) {
    console.error('Form deletion error:', error);
    res.status(500).json({ message: 'Server error during form deletion' });
  }
});

module.exports = router;
