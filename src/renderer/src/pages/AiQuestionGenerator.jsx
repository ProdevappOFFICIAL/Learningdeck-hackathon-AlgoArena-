// Create this file at: ../components/AiQuestionGenerator.jsx

import { useState, useEffect } from 'react'
import Dialog from '../components/dailog'
import axios from 'axios'
import toast from 'react-hot-toast'
import { TbBrain, TbLoader3, TbSparkles } from 'react-icons/tb'
import RichTextEditor from '../components/RichTextEditor'
import { VscDebugAlt } from 'react-icons/vsc'

const AiQuestionGenerator = ({
  serverInfo,
  classes,
  subjects,
  exams,
  refreshTrigger,
  setRefreshTrigger,
  onClose,
  log
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [showReviewMode, setShowReviewMode] = useState(false)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [debugInfo, setDebugInfo] = useState({ visible: false, message: '', details: '' })
  const [aiParams, setAiParams] = useState({
    subject: '',
    class_name: '',
    exam_name: '',
    numQuestions: 1, // Start with just 1 question
    difficulty: 'easy', // Start with easy
    topicFocus: '',
    model: 'anthropic/claude-3-haiku' // Default model - switched to OpenRouter model
  })

  // Models available through OpenRouter - a selection of good models for this use case
  const models = [
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Accurate Response)' },

    { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B (Moderate Response)' },

    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Standard Response)' }
  ]

  // Load API key from localStorage if available
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openrouter_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAiParams((prev) => ({
      ...prev,
      [name]: name === 'numQuestions' ? parseInt(value) || 1 : value
    }))
  }

  const handleApiKeyChange = (e) => {
    const { value } = e.target
    setApiKey(value)
    // Save to localStorage for persistence
    localStorage.setItem('openrouter_api_key', value)
  }

  // Show debug info
  const showDebug = (message, details = '') => {
    setDebugInfo({
      visible: true,
      message,
      details
    })
  }

  // Hide debug info
  const hideDebug = () => {
    setDebugInfo({
      visible: false,
      message: '',
      details: ''
    })
  }

  // Test API connection without generating questions
  const testApiConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter your OpenRouter API key')
      return
    }

    setIsGenerating(true)
    setDebugInfo({ visible: false, message: '', details: '' })

    try {
      const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

      // Make a simple request to check if the API is accessible
      const response = await axios.post(
        apiUrl,
        {
          model: aiParams.model,
          messages: [{ role: 'user', content: 'Hello, are you working?' }]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.href, // OpenRouter requires this
            'X-Title': 'Question Generator App', // Optional but recommended
            'Content-Type': 'application/json'
          }
        }
      )

      // If we get here, the connection was successful
      showDebug(
        'API Connection Successful',
        `Response status: ${response.status}\n` +
          `Model: ${response.data.model}\n` +
          `Raw response: ${JSON.stringify(response.data.choices[0], null, 2)}`
      )
      toast.success('API connection test successful!')
    } catch (error) {
      // Connection failed - show detailed error
      console.error('API connection test failed:', error)

      const errorDetails = error.response
        ? `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`
        : `Error: ${error.message}`

      showDebug('API Connection Failed', errorDetails)
      toast.error(`API connection failed: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Create a very basic question (fallback for when API fails)
  const createBasicQuestion = (index) => {
    const basicQuestions = {
      Mathematics: [
        {
          question: 'What is 7 + 8?',
          correct_answer: '15',
          incorrect_answers: ['14', '16', '17']
        },
        {
          question: 'What is 12 × 5?',
          correct_answer: '60',
          incorrect_answers: ['55', '65', '70']
        }
      ],
      Science: [
        {
          question: 'Which is NOT a state of matter?',
          correct_answer: 'Energy',
          incorrect_answers: ['Solid', 'Liquid', 'Gas']
        },
        {
          question: 'What is the chemical symbol for water?',
          correct_answer: 'H₂O',
          incorrect_answers: ['CO₂', 'O₂', 'NaCl']
        }
      ],
      English: [
        {
          question: 'Which word is a synonym for "happy"?',
          correct_answer: 'Joyful',
          incorrect_answers: ['Sad', 'Angry', 'Tired']
        }
      ],
      'General Knowledge': [
        {
          question: 'Which planet is known as the Red Planet?',
          correct_answer: 'Mars',
          incorrect_answers: ['Venus', 'Jupiter', 'Saturn']
        }
      ]
    }

    // Select a random question from the appropriate subject or from general knowledge
    const subjectQuestions = basicQuestions[aiParams.subject] || basicQuestions['General Knowledge']
    const randomIndex = Math.floor(Math.random() * subjectQuestions.length)
    const questionTemplate = subjectQuestions[randomIndex]

    return {
      ...questionTemplate,
      explanation: `This is a basic ${aiParams.difficulty} level question about ${aiParams.subject}.`,
      img: '',
      class_name: aiParams.class_name,
      exam_name: aiParams.exam_name,
      subject: aiParams.subject,
      custom: {
        generatedBy: 'System fallback',
        difficulty: aiParams.difficulty
      }
    }
  }

  // Generate manual questions without API
  const generateManualQuestions = () => {
    if (!aiParams.subject || !aiParams.class_name) {
      toast.error('Please fill all required fields')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setGeneratedQuestions([])

    try {
      const questions = []
      const totalQuestions = aiParams.numQuestions

      // Generate simple questions based on templates
      for (let i = 0; i < totalQuestions; i++) {
        questions.push(createBasicQuestion(i))
        setGenerationProgress(Math.round(((i + 1) / totalQuestions) * 100))
      }

      // Update final progress
      setGenerationProgress(100)
      setGeneratedQuestions(questions)

      // Show review mode
      setShowReviewMode(true)
      setCurrentReviewIndex(0)

      toast.success(`Generated ${questions.length} questions. Please review before saving.`)
    } catch (error) {
      console.error('Error in manual question generation:', error)
      toast.error(`Generation failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }
  const generateQuestions = async () => {
    // Validate inputs
    if (!aiParams.subject || !aiParams.class_name) {
      toast.error('Please fill all required fields')
      return
    }

    if (aiParams.numQuestions <= 0 || aiParams.numQuestions > 10) {
      // Increased max to 5 as LLMs handle this better
      toast.error('Number of questions must be between 1 and 5')
      return
    }

    if (!apiKey) {
      toast.error('Please enter your OpenRouter API key')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setGeneratedQuestions([])
    hideDebug() // Clear any previous debug info

    try {
      const questions = []
      const totalQuestions = aiParams.numQuestions
      const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

      // Create a prompt that instructs the model to generate all questions at once
      // with clear formatting to make parsing easier
      const createPrompt = () => {
        return `Generate ${aiParams.numQuestions} multiple choice ${aiParams.difficulty} level questions about ${aiParams.subject}${aiParams.topicFocus ? ' focusing on ' + aiParams.topicFocus : ''} for ${aiParams.class_name} students.

For each question:
1. Include one correct answer and three incorrect answers
2. Provide a brief explanation of why the correct answer is right
3. Format your response as follows, with each question in JSON format:

\`\`\`json
[
  {
    "question": "Question text here?",
    "correct_answer": "The correct answer",
    "incorrect_answers": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
    "explanation": "Brief explanation of the correct answer"
  },
  {
    "question": "Second question text here?",
    ...and so on
  }
]
\`\`\`

Important: Return ONLY the JSON array with no additional text before or after it.
Make sure the content is appropriate for ${aiParams.class_name} education level and ${aiParams.difficulty} difficulty.`
      }

      setGenerationProgress(10) // Show that we're starting the request

      // Make the API call to OpenRouter
      const response = await axios.post(
        apiUrl,
        {
          model: aiParams.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert educational content creator specializing in creating high-quality multiple choice questions. Always format your response exactly as requested, with no additional explanatory text.'
            },
            { role: 'user', content: createPrompt() }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.href, // OpenRouter requires this
            'X-Title': 'Question Generator App', // Optional but recommended
            'Content-Type': 'application/json'
          }
        }
      )

      setGenerationProgress(70) // Show we got a response

      // Extract the response content
      const responseContent = response.data.choices[0].message.content
      console.log('Raw API response:', responseContent)

      // Try to extract JSON from the response
      try {
        // First, try to find JSON content between backticks (```json ... ```)
        let jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        let jsonContent

        if (jsonMatch) {
          jsonContent = jsonMatch[1]
        } else {
          // If no backticks, look for JSON array pattern directly
          jsonMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/)
          if (jsonMatch) {
            jsonContent = jsonMatch[0]
          } else {
            // Last resort - try to find any content between square brackets
            jsonMatch = responseContent.match(/\[([\s\S]*?)\]/)
            jsonContent = jsonMatch ? jsonMatch[0] : responseContent
          }
        }

        // Clean up any possible text before or after the JSON
        jsonContent = jsonContent.trim()

        // Parse the JSON
        const parsedQuestions = JSON.parse(jsonContent)

        // Process each question
        if (Array.isArray(parsedQuestions)) {
          parsedQuestions.forEach((q, index) => {
            // Make sure we have all the required fields
            if (q.question && q.correct_answer && q.incorrect_answers && q.explanation) {
              // Ensure we have exactly 3 incorrect answers
              let incorrectAnswers = [...q.incorrect_answers]
              while (incorrectAnswers.length < 3) {
                incorrectAnswers.push(`Option ${incorrectAnswers.length + 1}`)
              }
              if (incorrectAnswers.length > 3) {
                incorrectAnswers = incorrectAnswers.slice(0, 3)
              }

              questions.push({
                question: q.question.trim(),
                correct_answer: q.correct_answer.trim(),
                incorrect_answers: incorrectAnswers.map((a) => a.trim()),
                explanation: q.explanation.trim(),
                img: '',
                class_name: aiParams.class_name,
                exam_name: aiParams.exam_name,
                subject: aiParams.subject,
                custom: {
                  generatedBy: 'AI (OpenRouter)',
                  model: aiParams.model,
                  difficulty: aiParams.difficulty,
                  topicFocus: aiParams.topicFocus || 'General'
                }
              })
            }
          })
        }

        // If we couldn't get any valid questions from the parsing, throw an error
        if (questions.length === 0) {
          throw new Error('Failed to parse valid questions from response')
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        showDebug(
          'Error Parsing AI Response',
          `Error: ${parseError.message}\nRaw Response: ${responseContent}`
        )

        // Try a fallback approach - simple text parsing
        const lines = responseContent.split('\n')
        let currentQuestion = null
        let questionText = ''
        let correctAnswer = ''
        let incorrectAnswers = []
        let explanation = ''

        for (const line of lines) {
          const trimmedLine = line.trim()

          // Try to identify question parts using common patterns
          if (/^Q(?:uestion)?[\s\d\.:\)]+/i.test(trimmedLine)) {
            // Save previous question if exists
            if (questionText && correctAnswer) {
              questions.push({
                question: questionText.trim(),
                correct_answer: correctAnswer.trim(),
                incorrect_answers:
                  incorrectAnswers.length >= 3
                    ? incorrectAnswers.slice(0, 3).map((a) => a.trim())
                    : [
                        ...incorrectAnswers.map((a) => a.trim()),
                        ...Array(3 - incorrectAnswers.length)
                          .fill('')
                          .map((_, i) => `Option ${i + 1}`)
                      ],
                explanation:
                  explanation.trim() ||
                  `This is a ${aiParams.difficulty} level ${aiParams.subject} question.`,
                img: '',
                class_name: aiParams.class_name,
                exam_name: aiParams.exam_name,
                subject: aiParams.subject,
                custom: {
                  generatedBy: 'AI (OpenRouter - text parsed)',
                  model: aiParams.model,
                  difficulty: aiParams.difficulty,
                  topicFocus: aiParams.topicFocus || 'General'
                }
              })
            }

            // Start new question
            questionText = trimmedLine.replace(/^Q(?:uestion)?[\s\d\.:\)]+/i, '')
            correctAnswer = ''
            incorrectAnswers = []
            explanation = ''
          } else if (/^(?:Correct|Right|Answer)[:\s]+/i.test(trimmedLine)) {
            correctAnswer = trimmedLine.replace(/^(?:Correct|Right|Answer)[:\s]+/i, '')
          } else if (
            /^(?:Incorrect|Wrong)[:\s]+/i.test(trimmedLine) ||
            /^[A-D][\.:\)]/.test(trimmedLine)
          ) {
            const answerText = trimmedLine
              .replace(/^(?:Incorrect|Wrong)[:\s]+/i, '')
              .replace(/^[A-D][\.:\)]\s*/, '')
            incorrectAnswers.push(answerText)
          } else if (/^(?:Explanation|Reason)[:\s]+/i.test(trimmedLine)) {
            explanation = trimmedLine.replace(/^(?:Explanation|Reason)[:\s]+/i, '')
          } else if (questionText && !correctAnswer) {
            questionText += ' ' + trimmedLine
          } else if (explanation) {
            explanation += ' ' + trimmedLine
          }
        }

        // Add the last question if it exists
        if (questionText && correctAnswer) {
          questions.push({
            question: questionText.trim(),
            correct_answer: correctAnswer.trim(),
            incorrect_answers:
              incorrectAnswers.length >= 3
                ? incorrectAnswers.slice(0, 3).map((a) => a.trim())
                : [
                    ...incorrectAnswers.map((a) => a.trim()),
                    ...Array(3 - incorrectAnswers.length)
                      .fill('')
                      .map((_, i) => `Option ${i + 1}`)
                  ],
            explanation:
              explanation.trim() ||
              `This is a ${aiParams.difficulty} level ${aiParams.subject} question.`,
            img: '',
            class_name: aiParams.class_name,
            exam_name: aiParams.exam_name,
            subject: aiParams.subject,
            custom: {
              generatedBy: 'AI (OpenRouter - text parsed)',
              model: aiParams.model,
              difficulty: aiParams.difficulty,
              topicFocus: aiParams.topicFocus || 'General'
            }
          })
        }

        // If we still couldn't extract questions, use fallback
        if (questions.length === 0) {
          // Use fallback questions
          for (let i = 0; i < totalQuestions; i++) {
            questions.push(createBasicQuestion(i))
          }
        }
      }

      // Fill with fallback questions if we don't have enough
      while (questions.length < totalQuestions) {
        questions.push(createBasicQuestion(questions.length))
      }

      // Trim to requested number of questions
      const finalQuestions = questions.slice(0, totalQuestions)

      // Update final progress
      setGenerationProgress(100)
      setGeneratedQuestions(finalQuestions)

      // Show review mode
      setShowReviewMode(true)
      setCurrentReviewIndex(0)

      toast.success(`Generated ${finalQuestions.length} questions. Please review before saving.`)
    } catch (error) {
      console.error('Error in question generation process:', error)

      // Show detailed error
      const errorDetails = error.response
        ? `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`
        : `Error: ${error.message}`

      showDebug('Generation Process Failed', errorDetails)
      toast.error(`Generation failed: ${error.message || 'Unknown error'}`)

      // Try to generate fallback questions
      try {
        const fallbackQuestions = []
        for (let i = 0; i < aiParams.numQuestions; i++) {
          fallbackQuestions.push(createBasicQuestion(i))
        }
        setGeneratedQuestions(fallbackQuestions)
        setShowReviewMode(true)
        setCurrentReviewIndex(0)
        toast.info('Using fallback questions instead. Please review.')
      } catch (fallbackError) {
        console.error('Error generating fallback questions:', fallbackError)
      }
    } finally {
      setIsGenerating(false)
    }
  }
  // Save reviewed questions to the database
  const saveGeneratedQuestions = async () => {
    try {
      setIsGenerating(true)
      let savedCount = 0

      for (const question of generatedQuestions) {
        await axios.post(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`, question)
        savedCount++
        setGenerationProgress(Math.round((savedCount / generatedQuestions.length) * 100))
      }

      toast.success(`Saved ${savedCount} questions successfully!`)
      log(
        `${new Date().toLocaleTimeString()} Generated and saved ${savedCount} AI questions for ${aiParams.subject}`
      )

      // Refresh the question list
      setRefreshTrigger((prev) => prev + 1)

      // Close the dialog
      onClose()
    } catch (error) {
      console.error('Error saving questions:', error)
      toast.error('Failed to save questions')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Handle editing a question during review
  const updateQuestionInReview = (field, value) => {
    setGeneratedQuestions((prev) => {
      const updated = [...prev]
      updated[currentReviewIndex] = {
        ...updated[currentReviewIndex],
        [field]: value
      }
      return updated
    })
  }

  // Handle editing incorrect answers during review
  const updateIncorrectAnswer = (index, value) => {
    setGeneratedQuestions((prev) => {
      const updated = [...prev]
      const newIncorrectAnswers = [...updated[currentReviewIndex].incorrect_answers]
      newIncorrectAnswers[index] = value

      updated[currentReviewIndex] = {
        ...updated[currentReviewIndex],
        incorrect_answers: newIncorrectAnswers
      }
      return updated
    })
  }

  // Navigation for review mode
  const goToNextQuestion = () => {
    if (currentReviewIndex < generatedQuestions.length - 1) {
      setCurrentReviewIndex((prev) => prev + 1)
    }
  }

  const goToPrevQuestion = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex((prev) => prev - 1)
    }
  }

  return (
    <Dialog
      im={<TbSparkles className="mr-1" />}
      title={showReviewMode ? 'Review Questions' : 'LearningDeck AI'}
      onClose={onClose}
    >
      <div className="space-y-3 p-3 text-[10px] overflow-y-auto max-h-[90vh]">
        {/* Debug info panel */}
        {debugInfo.visible && (
          <div className=" border border-gray-300 p-2 rounded-md mb-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{debugInfo.message}</h3>
              <button onClick={hideDebug} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            {debugInfo.details && (
              <pre className="mt-2  border p-2 rounded w-fit">
                {debugInfo.details}
              </pre>
            )}
          </div>
        )}

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-6">
            <TbLoader3 className="animate-spin text-4xl text-purple-600 mb-3 text-[10px]" />
            <h3 className="font-medium text-gray-700 mb-2">
              {generatedQuestions.length > 0 ? 'Saving Questions...' : 'Processing...'}
            </h3>
          
            <p className="mt-2 text-gray-500">Please wait, this may take a minute</p>
          </div>
        ) : showReviewMode ? (
          <>
            {/* Review Mode UI */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">
                Question {currentReviewIndex + 1} of {generatedQuestions.length}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevQuestion}
                  disabled={currentReviewIndex === 0}
                  className={`px-2 py-1 rounded-full ${
                    currentReviewIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={goToNextQuestion}
                  disabled={currentReviewIndex === generatedQuestions.length - 1}
                  className={`px-2 py-1 rounded-full ${
                    currentReviewIndex === generatedQuestions.length - 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Question Editor */}
            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label className="block font-medium text-gray-700">Question</label>
              <div className="mt-1">
                <RichTextEditor
                  value={generatedQuestions[currentReviewIndex]?.question || ''}
                  onChange={(value) => updateQuestionInReview('question', value)}
                />
              </div>
            </div>

            {/* Correct Answer */}
            <div className="space-y-1 bg-green-100 border border-green-200 p-1 rounded-md">
              <label className="block font-medium text-gray-700">Correct Answer</label>
              <input
                type="text"
                value={generatedQuestions[currentReviewIndex]?.correct_answer || ''}
                onChange={(e) => updateQuestionInReview('correct_answer', e.target.value)}
                className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
              />
            </div>

            {/* Incorrect Answers */}
            <div className="space-y-1 bg-red-50 border border-red-100 p-1 rounded-md">
              <label className="block font-medium text-gray-700">Incorrect Answers</label>
              {generatedQuestions[currentReviewIndex]?.incorrect_answers?.map((answer, idx) => (
                <div key={idx} className="mt-1">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => updateIncorrectAnswer(idx, e.target.value)}
                    className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                    placeholder={`Incorrect Answer ${idx + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="space-y-1 bg-blue-50 border border-blue-100 p-1 rounded-md">
              <label className="block font-medium text-gray-700">Explanation</label>
              <textarea
                value={generatedQuestions[currentReviewIndex]?.explanation || ''}
                onChange={(e) => updateQuestionInReview('explanation', e.target.value)}
                rows={3}
                className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                placeholder="Explanation for the correct answer"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block  text-gray-700">Subject</label>
                <input
                  type="text"
                  value={generatedQuestions[currentReviewIndex]?.subject || ''}
                  onChange={(e) => updateQuestionInReview('subject', e.target.value)}
                  className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block  text-gray-700">Class</label>
                <input
                  type="text"
                  value={generatedQuestions[currentReviewIndex]?.class_name || ''}
                  onChange={(e) => updateQuestionInReview('class_name', e.target.value)}
                  className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block  text-gray-700">Exam</label>
                <input
                  type="text"
                  value={generatedQuestions[currentReviewIndex]?.exam_name || ''}
                  onChange={(e) => updateQuestionInReview('exam_name', e.target.value)}
                  className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={saveGeneratedQuestions}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Save All Questions
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Generator Form */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <label className="flex w-full font-medium text-gray-700">Subject</label>
                <select
                  name="subject"
                  value={aiParams.subject}
                  onChange={handleInputChange}
                  className=" w-fit text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-full font-medium text-gray-700">Class</label>
                <select
                  name="class_name"
                  value={aiParams.class_name}
                  onChange={handleInputChange}
                  className=" w-fit text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

        <div className="flex items-center gap-2">
                <label className="flex w-full font-medium text-gray-700">Exam</label>
             
               <select
    id="exam_name"
    name="exam_name"
    className="w-fit p-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
    value={aiParams.exam_name}
                  onChange={handleInputChange}
    required
  >
    <option value="">Select Exam</option>
    {exams && exams.length > 0 ? (
      exams.map((exam) => (
        <option key={exam.id} value={exam.exam_name}>
          {exam.exam_name}
        </option>
      ))
    ) : (
      <option disabled>Loading exams...</option>
    )}
  </select>
  
              </div>

              <div className="flex items-center gap-2">
                <label className="flex w-full font-medium text-gray-700">Number of Questions</label>
                <input
                  type="number"
                  name="numQuestions"
                  min="1"
                
                max="10"
                  value={aiParams.numQuestions}
                  onChange={handleInputChange}
                  className=" w-fit text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex w-full font-medium text-gray-700">Difficulty</label>
                <select
                  name="difficulty"
                  value={aiParams.difficulty}
                  onChange={handleInputChange}
                  className=" w-fit text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="block font-medium text-gray-700">Topic Focus (Optional)</label>
                <textarea
                  type="text"
                  name="topicFocus"
                  value={aiParams.topicFocus}
                  onChange={handleInputChange}
                  placeholder="e.g. Quadratic Equations"
                  className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-md bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex w-full font-medium text-gray-700">Model</label>
              <select
                name="model"
                value={aiParams.model}
                onChange={handleInputChange}
                className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex w-full font-medium text-gray-700">OpenRouter API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your OpenRouter API key"
                className=" w-full text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
              />
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={testApiConnection}
                className=" text-[10px] px-2 py-1 border border-gray-200 rounded-full bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
              >
                <VscDebugAlt />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={generateQuestions}
                  className=" text-[10px] px-2 py-1 border text-white border-gray-200 rounded-full bg-purple-600 dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                >
                  Generate
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}

export default AiQuestionGenerator
