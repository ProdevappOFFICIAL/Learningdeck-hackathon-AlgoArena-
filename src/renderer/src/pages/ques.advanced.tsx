/*import axios from 'axios'
import { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Book } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FcAddDatabase, FcDeleteDatabase } from 'react-icons/fc'
import { AiFillEdit, AiOutlineDelete } from 'react-icons/ai'
import { FiMaximize } from 'react-icons/fi'
import { BiX } from 'react-icons/bi'
import useLogger from '../hook/useLogger'

function Question() {
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [classFilter, setClassFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { log } = useLogger()
  const router = useNavigate()
  const { id } = useParams()
  let questionId = 1

  // Define question types
  const questionTypes = [
    { id: 'single_choice', label: 'Single Choice' },
    { id: 'multiple_choice', label: 'Multiple Choice' },
    { id: 'true_false', label: 'True/False' },
    { id: 'short_answer', label: 'Short Answer' },
    { id: 'essay', label: 'Essay' },
    { id: 'fill_blank', label: 'Fill in the Blank' },
    { id: 'matching', label: 'Matching' }
  ]

  const [userData, setUserData] = useState({
    question: '',
    img: '',
    incorrect_answers: ['', '', ''],
    correct_answer: '',
    class_name: '',
    exam_name: '',
    subject: '',
    question_type: 'single_choice', // Default to single choice
    // For fill in the blank
    blanks: [''],
    // For matching
    matching_pairs: [{ left: '', right: '' }],
    // For true/false
    is_true: true,
    // For single choice
    options: ['', '', '', ''],
    correct_option_index: 0
  })

  const loadQuestionData = (question) => {
    console.log('Loading question data for editing:', question)
    setEditMode(true)
    setCurrentQuestionId(question.id)

    // Handle different question types and ensure all required fields exist
    const questionData = {
      ...question,
      incorrect_answers: question.incorrect_answers || ['', '', ''],
      question_type: question.question_type || 'single_choice',
      blanks: question.blanks || [''],
      matching_pairs: question.matching_pairs || [{ left: '', right: '' }],
      is_true: question.hasOwnProperty('is_true') ? question.is_true : true,
      options: question.options || ['', '', '', ''],
      correct_option_index: question.correct_option_index || 0
    }

    setUserData(questionData)
    setImagePreview(question.img || null)
    setShowDialog(true)
  }

  const setOption = (index, value) => {
    setUserData((prevData) => {
      const updatedAnswers = [...prevData.incorrect_answers]
      updatedAnswers[index] = value
      return { ...prevData, incorrect_answers: updatedAnswers }
    })
  }

  const setSingleOption = (index, value) => {
    setUserData((prevData) => {
      const updatedOptions = [...prevData.options]
      updatedOptions[index] = value
      return { ...prevData, options: updatedOptions }
    })
  }

  const setCorrectOptionIndex = (index) => {
    setUserData((prevData) => ({
      ...prevData,
      correct_option_index: index
    }))
  }

  const onTextFieldChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckboxChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.checked
    })
  }

  const handleNumberChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: Number(e.target.value)
    })
  }

  // Handle image file selection and conversion to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file')
      return
    }

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target.result
      setUserData({
        ...userData,
        img: base64String
      })
      setImagePreview(base64String)
    }
    reader.onerror = () => {
      toast.error('Error reading file')
    }
    reader.readAsDataURL(file)
  }

  // Clear the selected image
  const clearImage = () => {
    setUserData({
      ...userData,
      img: ''
    })
    setImagePreview(null)
  }

  // Add a blank for fill in the blank questions
  const addBlank = () => {
    setUserData((prevData) => ({
      ...prevData,
      blanks: [...prevData.blanks, '']
    }))
  }

  // Update a blank value
  const updateBlank = (index, value) => {
    setUserData((prevData) => {
      const updatedBlanks = [...prevData.blanks]
      updatedBlanks[index] = value
      return { ...prevData, blanks: updatedBlanks }
    })
  }

  // Remove a blank
  const removeBlank = (index) => {
    setUserData((prevData) => {
      const updatedBlanks = [...prevData.blanks]
      updatedBlanks.splice(index, 1)
      return { ...prevData, blanks: updatedBlanks }
    })
  }

  // Add a matching pair
  const addMatchingPair = () => {
    setUserData((prevData) => ({
      ...prevData,
      matching_pairs: [...prevData.matching_pairs, { left: '', right: '' }]
    }))
  }

  // Update a matching pair
  const updateMatchingPair = (index, side, value) => {
    setUserData((prevData) => {
      const updatedPairs = [...prevData.matching_pairs]
      updatedPairs[index][side] = value
      return { ...prevData, matching_pairs: updatedPairs }
    })
  }

  // Remove a matching pair
  const removeMatchingPair = (index) => {
    setUserData((prevData) => {
      const updatedPairs = [...prevData.matching_pairs]
      updatedPairs.splice(index, 1)
      return { ...prevData, matching_pairs: updatedPairs }
    })
  }

  const handleDeleteQuestion = async (questionId) => {
    try {
      await axios.delete(`http://${serverInfo.ip}:${serverInfo.port}/api/Question/${questionId}`)
      toast(`Question ${questionId} deleted successfully`)
      log(`${new Date().toLocaleTimeString()} Deleted Question ${questionId}`)
      // Force refresh by incrementing the refresh trigger
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    }
  }

  const validateQuestion = () => {
    if (!userData.question.trim()) {
      toast.error('Question text is required')
      return false
    }

    if (!userData.class_name) {
      toast.error('Please select a class')
      return false
    }

    if (!userData.exam_name) {
      toast.error('Please select an exam')
      return false
    }

    if (!userData.subject) {
      toast.error('Please select a subject')
      return false
    }

    // Validate based on question type
    switch (userData.question_type) {
      case 'single_choice':
        // Check if all options are filled
        if (userData.options.some((option) => !option.trim())) {
          toast.error('All options must be filled')
          return false
        }
        break
        
      case 'multiple_choice':
        if (!userData.correct_answer.trim()) {
          toast.error('Correct answer is required')
          return false
        }

        if (userData.incorrect_answers.some((answer) => !answer.trim())) {
          toast.error('All options must be filled')
          return false
        }
        break

      case 'true_false':
        // No additional validation needed
        break

      case 'fill_blank':
        if (userData.blanks.some((blank) => !blank.trim())) {
          toast.error('All blanks must be filled')
          return false
        }
        break

      case 'matching':
        if (userData.matching_pairs.some((pair) => !pair.left.trim() || !pair.right.trim())) {
          toast.error('All matching pairs must be filled')
          return false
        }
        break

      default:
        // For other question types like short answer, essay
        if (!userData.correct_answer.trim()) {
          toast.error('Answer or solution is required')
          return false
        }
    }

    return true
  }

  const handleAddOrUpdateQuestion = async () => {
    if (!validateQuestion()) {
      return
    }

    // For single choice questions, set the correct answer from the selected option
    if (userData.question_type === 'single_choice') {
      const correctAnswer = userData.options[userData.correct_option_index]
      const updatedUserData = {
        ...userData,
        correct_answer: correctAnswer
      }
      setUserData(updatedUserData)
    }

    try {
      if (editMode && currentQuestionId) {
        console.log('Updating question with ID:', currentQuestionId)
        await axios.put(`http://${serverInfo.ip}:${serverInfo.port}/api/Question/${currentQuestionId}`, userData)
        toast(`Updated Question ${currentQuestionId}`)
        log(`${new Date().toLocaleTimeString()} Updated Question ${currentQuestionId}`)
      } else {
        console.log('Adding new question:', userData)
        await axios.post('http://${serverInfo.ip}:${serverInfo.port}/api/Question', userData)
        toast('Added new question successfully')
        log(`${new Date().toLocaleTimeString()} Added new question successfully`)
      }

      setEditMode(false)
      setCurrentQuestionId(null)
      resetForm()
      setShowDialog(false)
      // Force refresh by incrementing the refresh trigger
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error adding/updating question:', error)
      toast.error('Failed to add/update question')
    }
  }

  const resetForm = () => {
    setUserData({
      question: '',
      img: '',
      incorrect_answers: ['', '', ''],
      correct_answer: '',
      class_name: '',
      exam_name: '',
      subject: '',
      question_type: 'single_choice',
      blanks: [''],
      matching_pairs: [{ left: '', right: '' }],
      is_true: true,
      options: ['', '', '', ''],
      correct_option_index: 0
    })
    setImagePreview(null)
  }

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all questions? This action cannot be undone.')) {
      return
    }

    try {
      const fetchResponse = await fetch('http://${serverInfo.ip}:${serverInfo.port}/api/Question')

      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch items')
      }

      const data = await fetchResponse.json()

      const deletePromises = data.map((item) =>
        fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Question/${item.id}`, {
          method: 'DELETE'
        })
      )

      await Promise.all(deletePromises)
      toast('All Questions Deleted Successfully')
      log(`${new Date().toLocaleTimeString()} All Questions Deleted`)

      // Force refresh by incrementing the refresh trigger
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('An error occurred while deleting content')
    }
  }

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://${serverInfo.ip}:${serverInfo.port}/api/Question')
      const filteredQuestions = classFilter
        ? response.data.filter((question) => question.class_name === classFilter)
        : response.data
      setQuestions(filteredQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://${serverInfo.ip}:${serverInfo.port}/api/subject')
      setSubjects(response.data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
      toast.error('Failed to load subjects')
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://${serverInfo.ip}:${serverInfo.port}/api/classes')
      setClasses(response.data)
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const fetchExams = async () => {
    try {
      const response = await axios.get('http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination')
      console.log('Fetched exams:', response.data) // Add this to debug the response
      setExams(response.data)
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to load exams')
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [classFilter, refreshTrigger])

  useEffect(() => {
    fetchSubjects()
    fetchClasses()
    fetchExams()
  }, [])

  // Function to render form fields based on question type
  const renderQuestionTypeFields = () => {
    switch (userData.question_type) {
      case 'single_choice':
        return (
          <div className="space-y-3 bg-gray-300/20 border p-2 rounded-md">
            <label className="block font-medium text-gray-700">Options</label>
            {userData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="correct_option"
                  checked={userData.correct_option_index === index}
                  onChange={() => setCorrectOptionIndex(index)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => setSingleOption(index, e.target.value)}
                  className="flex-grow p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={`Option ${index + 1}`}
                  required
                />
              </div>
            ))}
            <p className="text-xs text-gray-500 italic">
              Select the radio button next to the correct answer
            </p>
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label htmlFor="option1" className="block font-medium text-gray-700">
                Option 1
              </label>
              <input
                type="text"
                id="option1"
                value={userData.incorrect_answers[0]}
                onChange={(e) => setOption(0, e.target.value)}
                className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                placeholder="Enter option 1"
              />
            </div>

            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label htmlFor="option2" className="block font-medium text-gray-700">
                Option 2
              </label>
              <input
                type="text"
                id="option2"
                value={userData.incorrect_answers[1]}
                onChange={(e) => setOption(1, e.target.value)}
                className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                placeholder="Enter option 2"
              />
            </div>

            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label htmlFor="option3" className="block font-medium text-gray-700">
                Option 3
              </label>
              <input
                type="text"
                id="option3"
                value={userData.incorrect_answers[2]}
                onChange={(e) => setOption(2, e.target.value)}
                className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                placeholder="Enter option 3"
              />
            </div>

            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label htmlFor="correct_answer" className="block font-medium text-gray-700">
                Correct Answer
              </label>
              <input
                type="text"
                id="correct_answer"
                name="correct_answer"
                value={userData.correct_answer}
                onChange={onTextFieldChange}
                className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                placeholder="Enter correct answer"
              />
            </div>
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
            <label className="block font-medium text-gray-700">Correct Answer</label>
            <div className="flex items-center space-x-4 p-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="is_true"
                  checked={userData.is_true === true}
                  onChange={() => setUserData({ ...userData, is_true: true })}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">True</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="is_true"
                  checked={userData.is_true === false}
                  onChange={() => setUserData({ ...userData, is_true: false })}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">False</span>
              </label>
            </div>
          </div>
        )

      case 'short_answer':
      case 'essay':
        return (
          <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
            <label htmlFor="correct_answer" className="block font-medium text-gray-700">
              {userData.question_type === 'short_answer'
                ? 'Correct Answer'
                : 'Sample Answer/Rubric'}
            </label>
            <textarea
              id="correct_answer"
              name="correct_answer"
              value={userData.correct_answer}
              onChange={onTextFieldChange}
              className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
              required
              placeholder={
                userData.question_type === 'short_answer'
                  ? 'Enter expected answer'
                  : 'Enter sample answer or grading rubric'
              }
            />
          </div>
        )

      case 'fill_blank':
        return (
          <div className="space-y-3 bg-gray-300/20 border p-2 rounded-md">
            <div className="flex justify-between items-center">
              <label className="block font-medium text-gray-700">Blanks (Correct Answers)</label>
              <button
                type="button"
                onClick={addBlank}
                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-200"
              >
                + Add Blank
              </button>
            </div>

            <div className="space-y-2">
              {userData.blanks.map((blank, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={blank}
                    onChange={(e) => updateBlank(index, e.target.value)}
                    className="flex-grow p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={`Blank ${index + 1} answer`}
                  />
                  {userData.blanks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBlank(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <BiX size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic">
              Tip: In your question text, use underscores (_____) to indicate where blanks should
              appear.
            </p>
          </div>
        )

      case 'matching':
        return (
          <div className="space-y-3 bg-gray-300/20 border p-2 rounded-md">
            <div className="flex justify-between items-center">
              <label className="block font-medium text-gray-700">Matching Pairs</label>
              <button
                type="button"
                onClick={addMatchingPair}
                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-200"
              >
                + Add Pair
              </button>
            </div>

            <div className="space-y-2">
              {userData.matching_pairs.map((pair, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pair.left}
                    onChange={(e) => updateMatchingPair(index, 'left', e.target.value)}
                    className="flex-grow p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Left item"
                  />
                  <span className="text-gray-500">↔</span>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => updateMatchingPair(index, 'right', e.target.value)}
                    className="flex-grow p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Right item"
                  />
                  {userData.matching_pairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMatchingPair(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <BiX size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Function to format question data for display in the table
  const formatQuestionForDisplay = (question) => {
    switch (question.question_type) {
      case 'single_choice':
        return {
          options: question.options || [],
          answer: question.options ? question.options[question.correct_option_index] : question.correct_answer,
          displayType: 'single_choice'
        }
        
      case 'multiple_choice':
        const options = [...(question.incorrect_answers || []), question.correct_answer]
          .filter(Boolean)
          .sort()
        while (options.length < 4) options.push('') // Ensure 4 options
        return {
          options,
          answer: question.correct_answer,
          displayType: 'options'
        }

      case 'true_false':
        return {
          options: ['True', 'False'],
          answer: question.is_true ? 'True' : 'False',
          displayType: 'true_false'
        }

      case 'short_answer':
        return {
          options: [],
          answer: question.correct_answer,
          displayType: 'short_answer'
        }

      case 'essay':
        return {
          options: [],
          answer: 'Essay Question',
          displayType: 'essay'
        }

      case 'fill_blank':
        return {
          options: [],
          answer: question.blanks.join(', '),
          displayType: 'fill_blank'
        }

      case 'matching':
        return {
          options: [],
          answer: 'Matching Question',
          displayType: 'matching'
        }

      default:
        const defaultOptions = [...(question.incorrect_answers || []), question.correct_answer]
          .filter(Boolean)
          .sort()
        while (defaultOptions.length < 4) defaultOptions.push('')
        return {
          options: defaultOptions,
          answer: question.correct_answer,
          displayType: 'options'
        }
    }
  }

  return (
    <div className="flex flex-col w-full h-full mx-auto">
      <Toaster />

      <div className="flex items-center justify-between border-b p-3">
        <span className="text-gray-800 dark:text-white">Questions</span>
        <div className="flex items-center space-x-2">
          <p className="py-1 px-2 bg-blue-300/20 rounded-md text-black/80 text-[10px] uppercase border">
            {classFilter
              ? `${classFilter}: has ${questions.length} questions`
              : `Total: ${questions.length} questions`}
          </p>
          <select
            className="p-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
            onChange={(e) => setClassFilter(e.target.value)}
            value={classFilter}
          >
            <option value="">All Classes</option>
            {classes.length > 0 ? (
              classes.map((classItem) => (
                <option key={classItem.id} value={classItem.name}>
                  {classItem.name}
                </option>
              ))
            ) : (
              <option disabled>Loading classes...</option>
            )}
          </select>
          <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200">
            <FcDeleteDatabase
              onClick={handleDeleteAll}
              className="cursor-pointer"
              title="Delete All Questions"
            />
            <FcAddDatabase
              onClick={() => {
                setEditMode(false)
                resetForm()
                setShowDialog(true)
              }}
              className="cursor-pointer"
              title="Add New Question"
            />
          </div>
        </div>
      </div>

      {/* Custom Dialog for Add/Edit 
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-[10px]">
          <div className="bg-white dark:bg-gray-900 rounded border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 border-b p-2 bg-gray-300/20">
              <h2 className="flex items-center w-full text-gray-800">
                <AiFillEdit className="mr-1" />
                {editMode ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 p-3 text-[10px]">
    
              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="question_type" className="block font-medium text-gray-700">
                  Question Type
                </label>
                <select
                  id="question_type"
                  name="question_type"
                  className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onChange={onTextFieldChange}
                  value={userData.question_type}
                >
                  {questionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>


              <div className="space-y-2">
                {imagePreview && (
                  <div className="relative h-32 w-full flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Question image"
                      className="rounded-full h-full object-contain border border-gray-300 dark:border-gray-700"
                    />
                    <button
                    onClick={clearImage}
                    className="flex flex-row space-x-3 items-center absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 px-2"
                    title="Remove image"
                  >
                    <span>X</span>
                  </button>
                </div>
              )}

              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="image" className="block font-medium text-gray-700">
                  Question Image (Optional)
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 italic">Max size: 2MB</p>
              </div>
            </div>

    
            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label htmlFor="question" className="block font-medium text-gray-700">
                Question Text
              </label>
              <textarea
                id="question"
                name="question"
                value={userData.question}
                onChange={onTextFieldChange}
                className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
                required
                placeholder="Enter your question here"
              />
            </div>

        
            {renderQuestionTypeFields()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="class_name" className="block font-medium text-gray-700">
                  Class
                </label>
                <select
                  id="class_name"
                  name="class_name"
                  value={userData.class_name}
                  onChange={onTextFieldChange}
                  className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.name}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="subject" className="block font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={userData.subject}
                  onChange={onTextFieldChange}
                  className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="exam_name" className="block font-medium text-gray-700">
                  Exam
                </label>
                <select 
    id="exam_name"
    name="exam_name" 
    className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" 
    onChange={onTextFieldChange} 
    value={userData.exam_name} 
    required
>
    <option value="">Select Exam</option>
    {exams && exams.length > 0 ? (
        exams.map(exam => (
            <option key={exam.id} value={exam.name || exam.exam_name}>
                {exam.name || exam.exam_name}
            </option>
        ))
    ) : (
        <option disabled>No exams available</option>
    )}
</select>
              </div>
            </div>

        
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOrUpdateQuestion}
                className="bg-blue-500 hover:bg-blue-600 bg-blue-400 text-white font-bold py-1 px-4 rounded"
              >
                {editMode ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

   
    <div className="p-3 overflow-auto h-full">
      {loading ? (
        <div className="text-center py-4">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-4">No questions available.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((question) => {
            const displayData = formatQuestionForDisplay(question)
            return (
              <div
                key={question.id}
                className="border rounded-md p-3 bg-white dark:bg-gray-900 shadow-sm text-[10px]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium flex items-center">
                    <span className="mr-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {questionId++}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full mr-2">
                      {question.question_type
                        ? question.question_type.replace('_', ' ').charAt(0).toUpperCase() +
                          question.question_type.replace('_', ' ').slice(1)
                        : 'Multiple Choice'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-2">
                      {question.class_name}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                      {question.subject}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => loadQuestionData(question)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit"
                    >
                      <AiFillEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <AiOutlineDelete size={16} />
                    </button>
                    <button
                      onClick={() => router(`/question/${question.id}`)}
                      className="text-blue-500 hover:text-blue-700"
                      title="View Full"
                    >
                      <FiMaximize size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-gray-800 whitespace-pre-wrap break-words">{question.question}</p>
                  {question.img && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={question.img}
                        alt="Question"
                        className="max-h-32 object-contain border rounded-md"
                      />
                    </div>
                  )}
                </div>

                {displayData.displayType === 'options' && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {displayData.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-1 border rounded-md ${
                          option === displayData.answer
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-gray-50'
                        }`}
                      >
                        {option || <span className="text-gray-400 italic">Empty option</span>}
                      </div>
                    ))}
                  </div>
                )}

                {displayData.displayType === 'single_choice' && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {displayData.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-1 border rounded-md ${
                          option === displayData.answer
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-gray-50'
                        }`}
                      >
                        {option || <span className="text-gray-400 italic">Empty option</span>}
                      </div>
                    ))}
                  </div>
                )}

                {displayData.displayType === 'true_false' && (
                  <div className="flex space-x-2 mt-2">
                    <div
                      className={`p-1 border rounded-md px-4 ${
                        displayData.answer === 'True'
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-gray-50'
                      }`}
                    >
                      True
                    </div>
                    <div
                      className={`p-1 border rounded-md px-4 ${
                        displayData.answer === 'False'
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-gray-50'
                      }`}
                    >
                      False
                    </div>
                  </div>
                )}

                {(displayData.displayType === 'short_answer' ||
                  displayData.displayType === 'fill_blank') && (
                  <div className="mt-2 p-1 border rounded-md bg-blue-50 border-blue-200">
                    <span className="font-medium">Answer: </span>
                    {displayData.answer}
                  </div>
                )}

                {(displayData.displayType === 'essay' || displayData.displayType === 'matching') && (
                  <div className="mt-2 p-1 border rounded-md bg-blue-50 border-blue-200">
                    <span className="font-medium">
                      {displayData.displayType === 'essay'
                        ? 'Essay Question'
                        : 'Matching Question'}
                    </span>
                    {displayData.displayType === 'matching' && question.matching_pairs && (
                      <div className="mt-1 space-y-1">
                        {question.matching_pairs.map((pair, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="bg-gray-100 p-1 rounded">{pair.left}</span>
                            <span>↔</span>
                            <span className="bg-gray-100 p-1 rounded">{pair.right}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  </div>
)
}

export default Question*/