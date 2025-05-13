import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
import toast, { LoaderIcon, Toaster } from 'react-hot-toast'
import { Book } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FcAddDatabase, FcDeleteDatabase } from 'react-icons/fc'
import { AiFillEdit, AiOutlineDelete } from 'react-icons/ai'
import { FiMaximize, FiMinimize } from 'react-icons/fi'
import { BiBook, BiX, BiPlus } from 'react-icons/bi'
import useLogger from '../hook/useLogger'
import { TbEdit, TbLoader3 } from 'react-icons/tb'
import { MdDeleteOutline, MdEditDocument, MdFullscreen, MdFullscreenExit, MdAdd } from 'react-icons/md'
import QuestionImporter from '../components/QuestionsImporter'
import Dialog from '../components/dailog'
import RichTextEditor from '../components/RichTextEditor'
import { useCallback } from 'react'
import { debounce } from 'lodash'
import { LuSparkles } from 'react-icons/lu'
import AiQuestionGenerator from './AiQuestionGenerator'

function Question() {
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [classFilter, setClassFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true) // New state for initial loading
  const [imagePreview, setImagePreview] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const tableContainerRef = useRef(null)
  const { log } = useLogger()
  let questionId = 1

  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
  const [serverConnected, setServerConnected] = useState(false) // New state to track server connection

  // New state for custom field input
  const [newCustomField, setNewCustomField] = useState('')

  const [userData, setUserData] = useState({
    question: '',
    img: '',
    incorrect_answers: ['', '', ''],
    correct_answer: '',
    class_name: '',
    exam_name: '',
    subject: '',
    custom: {}  // Initialize custom as an empty object
  })

  // Fetch server info first
  useEffect(() => {
    const getServerInformation = async () => {
      try {
        setInitialLoading(true)
        const info = await window.api.getServerInfo()
        setServerInfo(info)
        setServerConnected(true)
      } catch (error) {
        console.error('Error fetching server info:', error)
        toast.error('Failed to connect to server')
      } finally {
        setInitialLoading(false)
      }
    }
    
    getServerInformation()
  }, [])

  // Only fetch data after server info is available
  useEffect(() => {
    if (serverConnected && serverInfo.ip && serverInfo.port) {
      fetchQuestions()
      fetchSubjects()
      fetchClasses()
      fetchExams()
    }
  }, [serverConnected, classFilter, refreshTrigger])

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (tableContainerRef.current && tableContainerRef.current.requestFullscreen) {
        tableContainerRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true)
          })
          .catch(err => {
            toast.error(`Error attempting to enable fullscreen: ${err.message}`)
          })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false)
          })
          .catch(err => {
            toast.error(`Error attempting to exit fullscreen: ${err.message}`)
          })
      }
    }
  }

  // Listen for fullscreen change events
  useEffect(() => {
    const fullScreenChanged = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', fullScreenChanged)
    return () => {
      document.removeEventListener('fullscreenchange', fullScreenChanged)
    }
  }, [])

  const loadQuestionData = (question) => {
    console.log('Loading question data for editing:', question)
    setEditMode(true)
    setCurrentQuestionId(question.id)
    
    // Handle custom fields if they exist in the question object
    const customFields = question.custom || {}
    
    setUserData({
      ...question,
      incorrect_answers: question.incorrect_answers || ['', '', ''],
      custom: customFields
    })
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

  const onTextFieldChange = (e) => {
    const { name, value } = e.target ? e.target : { name: e, value: e };
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Add a new custom field to userData
  const addCustomField = () => {
    if (!newCustomField.trim()) {
      toast.error('Please enter a field name')
      return
    }

    setUserData(prevData => ({
      ...prevData,
      custom: {
        ...prevData.custom,
        [newCustomField]: ''
      }
    }))

    setNewCustomField('') // Clear the input
    toast.success(`Added custom field: ${newCustomField}`)
  }

  // Update a custom field value
  const updateCustomField = (fieldName, value) => {
    setUserData(prevData => ({
      ...prevData,
      custom: {
        ...prevData.custom,
        [fieldName]: value
      }
    }))
  }

  // Remove a custom field
  const removeCustomField = (fieldName) => {
    setUserData(prevData => {
      const updatedCustom = { ...prevData.custom }
      delete updatedCustom[fieldName]
      
      return {
        ...prevData,
        custom: updatedCustom
      }
    })
    toast.success(`Removed custom field: ${fieldName}`)
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

  const debouncedTextChange = useCallback(
    debounce((name, value) => {
      setUserData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }, 300), 
    []
  )

  const handleDeleteQuestion = async (questionId) => {
    if (!serverInfo.ip || !serverInfo.port) {
      toast.error('No server connection')
      return
    }
    
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

  const handleAddOrUpdateQuestion = async () => {
    if (!serverInfo.ip || !serverInfo.port) {
      toast.error('No server connection')
      return
    }
    
    try {
      if (editMode && currentQuestionId) {
        console.log('Updating question with ID:', currentQuestionId)
        await axios.put(
          `http://${serverInfo.ip}:${serverInfo.port}/api/Question/${currentQuestionId}`,
          userData
        )
        toast(`Updated Question ${currentQuestionId}`)
        log(`${new Date().toLocaleTimeString()} Updated Question ${currentQuestionId}`)
      } else {
        console.log('Adding new question:', userData)
        await axios.post(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`, userData)
        toast('Added new question successfully')
        log(`${new Date().toLocaleTimeString()} Added new question successfully`)
      }

      setEditMode(false)
      setCurrentQuestionId(null)
      setUserData({
        img: '',
        question: '',
        incorrect_answers: ['', '', ''],
        correct_answer: '',
        class_name: '',
        exam_name: '',
        subject: '',
        custom: {}
      })
      setImagePreview(null)
      setShowDialog(false)
      questionId++

      // Force refresh by incrementing the refresh trigger
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error adding/updating question:', error)
      toast.error('Failed to add/update question')
    }
  }

  const handleDeleteAll = async () => {
    if (!serverInfo.ip || !serverInfo.port) {
      toast.error('No server connection')
      return
    }
    
    try {
      const fetchResponse = await fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`)

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
    if (!serverInfo.ip || !serverInfo.port) return
    
    setLoading(true)
    try {
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`)
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
    if (!serverInfo.ip || !serverInfo.port) return
    
    try {
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/subject`)
      setSubjects(response.data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
      toast.error('Failed to load subjects')
    }
  }

  const fetchClasses = async () => {
    if (!serverInfo.ip || !serverInfo.port) return
    
    try {
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/classes`)
      setClasses(response.data)
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const fetchExams = async () => {
    if (!serverInfo.ip || !serverInfo.port) return
    
    try {
      const response = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`
      )
      setExams(response.data)
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to load exams')
    }
  }

  // Show loading state if we're still initializing the connection
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full py-10">
       <LoaderIcon/>
      </div>
    )
  }

  // Show error state if we couldn't connect to the server
  if (!serverConnected || !serverInfo.ip || !serverInfo.port) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full py-10">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <p className="text-red-600 font-medium mb-2">Server connection failed</p>
        <p className="text-gray-600 mb-4">Unable to connect to the server at {serverInfo.ip}:{serverInfo.port}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 bg-blue-400"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  // Table component that works in both fullscreen and regular mode
  const QuestionsTable = () => (
    <>
      {loading ? (
        <div className="flex justify-center items-center py-6 w-full h-screen">

          <LoaderIcon/>      
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 w-full text-[10px]">
          <div className="relative w-full overflow-auto">
            <table className="min-w-full">
              <thead className="border-b text-gray-600 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-900">
                <tr className="rounded-t-lg">
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">S/N</th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">
                    Question
                  </th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">A</th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">B</th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">C</th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">D</th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">
                    Correct Answer
                  </th>
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">
                    Subject
                  </th>
                  {!isFullscreen && 
                    
                  <th className="py-2 px-3 border-b dark:border-gray-600 text-left font-semibold">Actions
                </th>}
                </tr>
              </thead>
              <tbody>
                {questions.length > 0 ? (
                  questions.map((data, index) => {
                    const options = [...(data.incorrect_answers || []), data.correct_answer]
                      .filter(Boolean)
                      .sort()
                    while (options.length < 4) options.push('') // Ensure 4 options

                    return (
                      <tr key={data.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-white border-b dark:border-gray-600 dark:text-gray-300">
                        <td className="py-2 px-3 border-b dark:border-gray-600">{index + 1}</td>
                        <td
                          className="py-2 px-3 border-b dark:border-gray-600 max-w-xs truncate"
                          dangerouslySetInnerHTML={{ __html: data.question }}
                        ></td>

                        {options.slice(0, 4).map((option, idx) => (
                          <td key={idx} className="py-2 px-3 border-b dark:border-gray-600 max-w-xs truncate">
                            {option}
                          </td>
                        ))}
                        <td className="py-2 px-3 border-b dark:border-gray-600 font-medium text-blue-600">
                          {data.correct_answer}
                        </td>
                        <td className="py-2 px-3 border-b dark:border-gray-600">{data.subject}</td>
                        {!isFullscreen && 
                        <td className="flex w-fit items-center px-3 py-2 gap-2">
                    
                            <button
                              onClick={() => loadQuestionData(data)}
                              className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-green-600 rounded-full focus:bg-blue-300 hover:bg-green-500 text-white text-[10px] transition-all"
                            >
                              <TbEdit className="mr-1" />
                              Edit
                            </button>
                      
                        
                            <button
                              onClick={() => handleDeleteQuestion(data.id)}
                              className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-red-600 rounded-full focus:bg-blue-300 hover:bg-red-500 text-white text-[10px] transition-all"
                            >
                              <MdDeleteOutline className="mr-1" />
                              Delete
                            </button>
                        </td>
                        }
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="py-3 text-center text-gray-500">
                      No questions found. Add a new question to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="flex flex-col w-full h-full mx-auto">
      <Toaster />

      <div className="flex items-center justify-between border-b dark:border-gray-600 p-3">
        <span className="text-gray-800 dark:text-white">Questions</span>
        <div className="flex items-center space-x-2">
          <p className="py-1 px-2 bg-blue-300/20 rounded-md text-black/80 text-[10px] uppercase border">
            {classFilter
              ? `${classFilter}: has ${questions.length} questions`
              : `Total: ${questions.length} questions`}
          </p>
          
          <select
            className="p-1 text-[10px] border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
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
          
          {/* Add the QuestionImporter component here */}
          <QuestionImporter
            serverInfo={serverInfo} 
            refreshTrigger={refreshTrigger} 
            setRefreshTrigger={setRefreshTrigger} 
            log={log}
          />
            <button
      onClick={() => setShowAiDialog(true)}
      className="flex items-center space-x-1 text-white px-3 rounded-full text-[10px] py-1 from-purple-600  to-purple-400 bg-gradient-to-r border border-purple-300 dark:text-purple-200 hover:bg-purple-200 transition-colors"
      title="Generate AI Questions"
    >
    <LuSparkles/>
      <span>Generate AI Questions</span>
    </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1 text-gray-800 px-3 rounded-full text-[10px] py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200 hover:bg-zinc-200 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
          >
            {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
          </button>
          
          <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200">
            <FcDeleteDatabase onClick={handleDeleteAll} className="cursor-pointer" />
            <FcAddDatabase
              onClick={() => {
                setEditMode(false)
                setUserData({
                  question: '',
                  img: '',
                  incorrect_answers: ['', '', ''],
                  correct_answer: '',
                  class_name: '',
                  exam_name: '',
                  subject: '',
                  custom: {}
                })
                setImagePreview(null)
                setShowDialog(true)
              }}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>

{showAiDialog && (
    <AiQuestionGenerator
      serverInfo={serverInfo}
      classes={classes}
      subjects={subjects}
      exams={exams}
      refreshTrigger={refreshTrigger}
      setRefreshTrigger={setRefreshTrigger}
      onClose={() => setShowAiDialog(false)}
      log={log}
    />
  )}

      {/* Custom Dialog for Add/Edit using the Dialog component */}
      {showDialog && (
        <Dialog 
          im={<MdEditDocument className="mr-1" />}
          title={editMode ? 'Edit Question' : 'Add New Question'}
          onClose={() => setShowDialog(false)}
        >
          <div className="space-y-3 p-3 text-[10px] overflow-y-auto max-h-[90vh]" >
            {/* Image Upload Section */}
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
                    <BiX className="text-[15px]" /> Remove Icon
                  </button>
                </div>
              )}
              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="image-upload" className="block font-medium text-gray-700">
                  Question Image
                </label>
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-gray-500">Max size: 2MB</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
              <label htmlFor="question" className="block font-medium text-gray-700">
                Question
              </label>
              <div className="mt-1">
                <RichTextEditor 
                  value={userData.question} 
                  onChange={(content) => debouncedTextChange('question', content)}
                  placeholder="Enter your question with formatting..."
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  {exams.length > 0 ? (
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

              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="subject" className="block font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                  onChange={onTextFieldChange}
                  value={userData.subject}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading subjects...</option>
                  )}
                </select>
              </div>

              <div className="space-y-1 bg-gray-300/20 border p-1 rounded-md">
                <label htmlFor="class_name" className="block font-medium text-gray-700">
                  Class
                </label>
                <select
                 id="class_name"
                  name="class_name"
                  className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                  onChange={onTextFieldChange}
                  value={userData.class_name}
                  required
                >
                  <option value="">Select Class</option>
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
              </div>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-2 bg-gray-300/20 border p-2 rounded-md">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-700">Custom Fields</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCustomField}
                    onChange={(e) => setNewCustomField(e.target.value)}
                    placeholder="New field name"
                    className="p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={addCustomField}
                    className="flex items-center px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-500"
                    title="Add custom field"
                  >
                    <BiPlus className="mr-1" />
                    Add
                  </button>
                </div>
              </div>
              
              {/* Display existing custom fields */}
              <div className="space-y-2">
                {Object.keys(userData.custom || {}).map((fieldName) => (
                  <div key={fieldName} className="flex items-center space-x-2">
                    <div className="flex-grow">
                      <label className="block font-medium text-gray-600">{fieldName}</label>
                      <input
                        type="text"
                        value={userData.custom[fieldName]}
                        onChange={(e) => updateCustomField(fieldName, e.target.value)}
                        className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <button
                      onClick={() => removeCustomField(fieldName)}
                      className="flex items-center p-[2px] bg-red-600 text-white rounded-full hover:bg-red-500"
                      title="Remove field"
                    >
                      <BiX />
                    </button>
                  </div>
                ))}
                {Object.keys(userData.custom || {}).length === 0 && (
                  <p className="text-gray-500 italic">No custom fields added yet</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                onClick={() => setShowDialog(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateQuestion}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-500"
              >
                {editMode ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Main content area with table */}
      <div ref={tableContainerRef} className="flex-grow overflow-auto">
        <QuestionsTable />
      </div>
    </div>
  )
}

export default Question