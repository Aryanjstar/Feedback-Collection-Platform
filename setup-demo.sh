#!/bin/bash

echo "🚀 Setting up Feedback Platform Demo..."

# Check if MongoDB is running
if ! pgrep -f mongod > /dev/null; then
    echo "📦 Starting MongoDB..."
    brew services start mongodb/brew/mongodb-community
    sleep 3
fi

# Check if backend is running
if ! pgrep -f "node server.js" > /dev/null; then
    echo "🔧 Starting backend server..."
    cd backend
    node server.js &
    BACKEND_PID=$!
    sleep 5
    cd ..
fi

echo "📝 Creating demo data..."

# Create demo user
DEMO_USER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Admin",
    "email": "demo@feedbackhub.com",
    "password": "demo123"
  }')

if [[ $DEMO_USER_RESPONSE == *"token"* ]]; then
    echo "✅ Demo user created: demo@feedbackhub.com / demo123"
    TOKEN=$(echo $DEMO_USER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Create demo forms
    echo "📋 Creating demo forms..."
    
    # Form 1: Customer Satisfaction
    FORM1_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forms \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "title": "Customer Satisfaction Survey",
        "description": "Help us improve our service by sharing your feedback",
        "questions": [
          {
            "text": "How satisfied are you with our service?",
            "type": "multiple-choice",
            "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
            "required": true
          },
          {
            "text": "What specific aspects did you like most?",
            "type": "text",
            "required": false
          },
          {
            "text": "How likely are you to recommend us to others?",
            "type": "multiple-choice",
            "options": ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"],
            "required": true
          }
        ]
      }')
    
    if [[ $FORM1_RESPONSE == *"publicUrl"* ]]; then
        PUBLIC_URL1=$(echo $FORM1_RESPONSE | grep -o '"publicUrl":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Customer Satisfaction Survey created"
        echo "   🔗 Public URL: http://localhost:3000/form/$PUBLIC_URL1"
    fi
    
    # Form 2: Product Feedback
    FORM2_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forms \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "title": "Product Feedback Form",
        "description": "Share your thoughts about our latest product features",
        "questions": [
          {
            "text": "Which product feature do you use most frequently?",
            "type": "multiple-choice",
            "options": ["Dashboard", "Form Builder", "Analytics", "Export", "Mobile App"],
            "required": true
          },
          {
            "text": "What new features would you like to see?",
            "type": "text",
            "required": true
          },
          {
            "text": "Rate the overall user experience",
            "type": "multiple-choice",
            "options": ["Excellent", "Good", "Average", "Poor"],
            "required": true
          },
          {
            "text": "Any additional comments or suggestions?",
            "type": "text",
            "required": false
          }
        ]
      }')
    
    if [[ $FORM2_RESPONSE == *"publicUrl"* ]]; then
        PUBLIC_URL2=$(echo $FORM2_RESPONSE | grep -o '"publicUrl":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Product Feedback Form created"
        echo "   🔗 Public URL: http://localhost:3000/form/$PUBLIC_URL2"
    fi
    
    # Form 3: Event Feedback
    FORM3_RESPONSE=$(curl -s -X POST http://localhost:5001/api/forms \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "title": "Event Feedback",
        "description": "Tell us about your experience at our recent event",
        "questions": [
          {
            "text": "How would you rate the event overall?",
            "type": "multiple-choice",
            "options": ["Outstanding", "Very Good", "Good", "Fair", "Poor"],
            "required": true
          },
          {
            "text": "What was the most valuable part of the event?",
            "type": "text",
            "required": true
          },
          {
            "text": "Would you attend future events?",
            "type": "multiple-choice",
            "options": ["Definitely", "Probably", "Maybe", "Probably Not", "Definitely Not"],
            "required": true
          }
        ]
      }')
    
    if [[ $FORM3_RESPONSE == *"publicUrl"* ]]; then
        PUBLIC_URL3=$(echo $FORM3_RESPONSE | grep -o '"publicUrl":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Event Feedback Form created"
        echo "   🔗 Public URL: http://localhost:3000/form/$PUBLIC_URL3"
        
        # Create some demo responses for this form
        echo "📊 Creating demo responses..."
        
        # Response 1
        curl -s -X POST http://localhost:5001/api/responses/$PUBLIC_URL3 \
          -H "Content-Type: application/json" \
          -d '{
            "answers": [
              {
                "questionId": "placeholder1",
                "answer": "Outstanding"
              },
              {
                "questionId": "placeholder2", 
                "answer": "The networking opportunities were fantastic!"
              },
              {
                "questionId": "placeholder3",
                "answer": "Definitely"
              }
            ]
          }' > /dev/null
        
        # Response 2
        curl -s -X POST http://localhost:5001/api/responses/$PUBLIC_URL3 \
          -H "Content-Type: application/json" \
          -d '{
            "answers": [
              {
                "questionId": "placeholder1",
                "answer": "Very Good"
              },
              {
                "questionId": "placeholder2",
                "answer": "Great speakers and content"
              },
              {
                "questionId": "placeholder3", 
                "answer": "Probably"
              }
            ]
          }' > /dev/null
        
        echo "✅ Demo responses created"
    fi
    
else
    echo "❌ Failed to create demo user"
fi

echo ""
echo "🎉 Demo setup complete!"
echo ""
echo "📋 Demo Account:"
echo "   Email: demo@feedbackhub.com"
echo "   Password: demo123"
echo ""
echo "🚀 To start the frontend:"
echo "   cd frontend && npm start"
echo ""
echo "💡 Demo forms have been created with sample data"
echo "   You can test form submission using the public URLs above"
echo ""
