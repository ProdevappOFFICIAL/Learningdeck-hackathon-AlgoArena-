import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { TbFileImport, TbLoader3 } from 'react-icons/tb'
import { BiCheckCircle, BiErrorCircle, BiInfoCircle, BiEdit } from 'react-icons/bi'
import { FiAlertTriangle, FiPlus } from 'react-icons/fi'
import { MdError } from 'react-icons/md'
import Dailog from '../components/dailog'

function QuestionImporter({ serverInfo, refreshTrigger, setRefreshTrigger, log }) {
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [parsingErrors, setParsingErrors] = useState([])
  const [fileContent, setFileContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dropZoneRef = useRef(null)
  const [fileMetadata, setFileMetadata] = useState({
    class: '',
    subject: '',
    exam: ''
  })
  const [entityChecks, setEntityChecks] = useState({
    classExists: null,
    subjectExists: null,
    examExists: null
  })
  const [validationMode, setValidationMode] = useState(true)
  const [reviewStep, setReviewStep] = useState(false)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null)
  const [showAddOptionModal, setShowAddOptionModal] = useState(false)
  const [newOptionData, setNewOptionData] = useState({
    questionIndex: null,
    optionLetter: '',
    optionText: ''
  })
  const fileInputRef = useRef(null)

  // For batched API requests
  const batchSize = 5

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      // Check file extension
      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (fileExtension !== 'txt') {
        toast.error('Please upload a .txt file')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        setFileContent(content)
        parseFileContent(content)
      }
      reader.onerror = () => {
        toast.error('Error reading file')
      }
      reader.readAsText(file)
    }
  }
  // For tracking questions with errors that need fixing
  const [questionsWithErrors, setQuestionsWithErrors] = useState([])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (fileExtension !== 'txt') {
      toast.error('Please upload a .txt file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      setFileContent(content)
      parseFileContent(content)
    }
    reader.onerror = () => {
      toast.error('Error reading file')
    }
    reader.readAsText(file)
  }

  const parseFileContent = (content) => {
    try {
      // Reset states
      setImportStatus('Parsing file...')
      setParsedQuestions([])
      setParsingErrors([])
      setQuestionsWithErrors([])
      setEntityChecks({
        classExists: null,
        subjectExists: null,
        examExists: null
      })
      setReviewStep(false)

      // First extract metadata (class, subject, exam)
      const classMatch = content.match(/Class\s*=\s*"([^"]+)"/i)
      const subjectMatch = content.match(/Subject-name\s*=\s*"([^"]+)"/i)
      const examMatch = content.match(/Exam-name\s*=\s*"([^"]+)"/i)

      if (!classMatch || !subjectMatch || !examMatch) {
        setParsingErrors((prev) => [
          ...prev,
          {
            line: 0,
            error: 'Missing required metadata: Class, Subject-name, or Exam-name',
            severity: 'error'
          }
        ])
      }

      const metadata = {
        class: classMatch ? classMatch[1].trim() : '',
        subject: subjectMatch ? subjectMatch[1].trim() : '',
        exam: examMatch ? examMatch[1].trim() : ''
      }
      setFileMetadata(metadata)

      // Split content into lines for more precise error reporting
      const lines = content.split('\n')
      const questions = []
      const errors = []
      const questionErrors = []

      // Find all question blocks
      let currentLine = 0
      while (currentLine < lines.length) {
        const line = lines[currentLine].trim()

        // Look for question pattern (Q1., Q2., etc.)
        const questionMatch = line.match(/^Q(\d+)\.\s*(.+)$/i)

        if (questionMatch) {
          const questionNumber = questionMatch[1]
          const questionText = questionMatch[2].trim()

          // Initialize question object
          const questionObj = {
            questionNumber,
            question: questionText,
            incorrect_answers: ['', '', ''],
            correct_answer: '',
            class_name: metadata.class,
            subject: metadata.subject,
            exam_name: metadata.exam,
            options: { A: '', B: '', C: '', D: '' }, // For validation
            answerLetter: '', // For validation
            hasErrors: false // Track if this question has errors
          }

          // Look for options and answer in subsequent lines
          let optionsFound = { A: false, B: false, C: false, D: false }
          let answerFound = false
          let nextLine = currentLine + 1
          let startLineNumber = currentLine + 1

          // Track line numbers for error reporting
          const optionLineNumbers = {}

          while (nextLine < lines.length) {
            const optionLine = lines[nextLine].trim()

            // Check if we've reached the next question
            if (optionLine.match(/^Q\d+\./)) break

            // Look for option pattern (A., B., etc.)
            const optionMatch = optionLine.match(/^([A-D])\.\s*(.+)$/i)
            if (optionMatch) {
              const optionLetter = optionMatch[1].toUpperCase()
              const optionText = optionMatch[2].trim()

              optionsFound[optionLetter] = true
              questionObj.options[optionLetter] = optionText
              optionLineNumbers[optionLetter] = nextLine + 1
            }

            // Look for answer pattern
            const answerMatch = optionLine.match(/^Answer:\s*([A-D])$/i)
            if (answerMatch) {
              answerFound = true
              const answerLetter = answerMatch[1].toUpperCase()
              questionObj.answerLetter = answerLetter
            }

            nextLine++
          }

          // Validate question has all required components
          let isValid = true
          let hasFixableErrors = false
          const questionErrorList = []

          // Check if question text is empty
          if (!questionText.trim()) {
            errors.push({
              line: currentLine + 1,
              error: `Question ${questionNumber}: Missing question text`,
              severity: 'error'
            })
            questionErrorList.push({
              type: 'question_missing',
              message: 'Missing question text'
            })
            isValid = false
            hasFixableErrors = true
          }

          // Check if all options are present
          for (const letter of ['A', 'B', 'C', 'D']) {
            if (!optionsFound[letter]) {
              errors.push({
                line: startLineNumber,
                error: `Question ${questionNumber}: Missing option ${letter}`,
                severity: 'error'
              })
              questionErrorList.push({
                type: 'option_missing',
                letter: letter,
                message: `Missing option ${letter}`
              })
              isValid = false
              hasFixableErrors = true
            }
          }

          // Check if answer is present
          if (!answerFound) {
            errors.push({
              line: startLineNumber,
              error: `Question ${questionNumber}: Missing answer`,
              severity: 'error'
            })
            questionErrorList.push({
              type: 'answer_missing',
              message: 'Missing answer'
            })
            isValid = false
            hasFixableErrors = true
          } else {
            // Check if answer letter matches an option
            const answerLetter = questionObj.answerLetter
            if (!optionsFound[answerLetter]) {
              errors.push({
                line: startLineNumber,
                error: `Question ${questionNumber}: Answer letter "${answerLetter}" doesn't have a corresponding option`,
                severity: 'error'
              })
              questionErrorList.push({
                type: 'answer_no_option',
                letter: answerLetter,
                message: `Answer letter "${answerLetter}" doesn't have a corresponding option`
              })
              isValid = false
              hasFixableErrors = true
            } else {
              // Set correct answer and incorrect answers based on answer letter
              questionObj.correct_answer = questionObj.options[answerLetter]

              // Set incorrect answers
              const incorrectAnswers = []
              for (const letter of ['A', 'B', 'C', 'D']) {
                if (letter !== answerLetter && questionObj.options[letter]) {
                  incorrectAnswers.push(questionObj.options[letter])
                }
              }

              // Fill with empty strings if there are less than 3 incorrect answers
              while (incorrectAnswers.length < 3) {
                incorrectAnswers.push('')
              }

              questionObj.incorrect_answers = incorrectAnswers
            }
          }

          // Warning for unusually short or long options
          for (const letter of ['A', 'B', 'C', 'D']) {
            const optionText = questionObj.options[letter]
            if (optionText && optionText.length < 2) {
              errors.push({
                line: optionLineNumbers[letter] || startLineNumber,
                error: `Question ${questionNumber}: Option ${letter} is too short "${optionText}"`,
                severity: 'warning'
              })
              questionErrorList.push({
                type: 'option_too_short',
                letter: letter,
                message: `Option ${letter} is too short`
              })
              hasFixableErrors = true
            }
            if (optionText && optionText.length > 200) {
              errors.push({
                line: optionLineNumbers[letter] || startLineNumber,
                error: `Question ${questionNumber}: Option ${letter} is unusually long (${optionText.length} chars)`,
                severity: 'warning'
              })
              questionErrorList.push({
                type: 'option_too_long',
                letter: letter,
                message: `Option ${letter} is unusually long`
              })
            }
          }

          // Warning for question without question mark
          if (!questionText.includes('?')) {
            errors.push({
              line: currentLine + 1,
              error: `Question ${questionNumber}: May not be a proper question (missing question mark)`,
              severity: 'warning'
            })
            questionErrorList.push({
              type: 'question_no_mark',
              message: 'Question may not be properly formatted (missing question mark)'
            })
          }

          // Add question to the list even if it has errors (we'll fix them later)
          questionObj.hasErrors = !isValid || hasFixableErrors
          questions.push(questionObj)

          // Add to the list of questions with errors
          if (questionObj.hasErrors) {
            questionErrors.push({
              questionIndex: questions.length - 1,
              questionNumber,
              errors: questionErrorList
            })
          }

          currentLine = nextLine
        } else {
          currentLine++
        }
      }

      setParsedQuestions(questions)
      setParsingErrors(errors)
      setQuestionsWithErrors(questionErrors)

      if (questions.length === 0) {
        setImportStatus('No valid questions found. Please check the file format.')
      } else {
        const errorCount = errors.filter((e) => e.severity === 'error').length
        const warningCount = errors.filter((e) => e.severity === 'warning').length
        const fixableCount = questionErrors.length

        setImportStatus(
          `Found ${questions.length} questions (${fixableCount} need review), with ${errorCount} errors and ${warningCount} warnings. Checking entities...`
        )

        // Check if entities exist
        checkEntities(metadata)
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      setImportStatus('Error parsing file. Please check format.')
      toast.error('Failed to parse file')
    }
  }

  const checkEntities = async (metadata) => {
    if (!serverInfo.ip || !serverInfo.port) {
      toast.error('No server connection')
      return
    }

    try {
      // Check class
      const classesResponse = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/classes`
      )
      const classExists = classesResponse.data.some(
        (c) => c.name.toLowerCase() === metadata.class.toLowerCase()
      )

      // Check subject
      const subjectsResponse = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/subject`
      )
      const subjectExists = subjectsResponse.data.some(
        (s) => s.name.toLowerCase() === metadata.subject.toLowerCase()
      )

      // Check exam
      const examsResponse = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`
      )
      const examExists = examsResponse.data.some(
        (e) => e.exam_name.toLowerCase() === metadata.exam.toLowerCase()
      )

      setEntityChecks({
        classExists,
        subjectExists,
        examExists
      })

      setImportStatus('Entity check complete. Please review questions before import.')
    } catch (error) {
      console.error('Error checking entities:', error)
      setImportStatus('Error checking entities. Please check server connection.')
      toast.error('Failed to check entities')
    }
  }

  const createEntity = async (entityType) => {
    if (!serverInfo.ip || !serverInfo.port) {
      toast.error('No server connection')
      return
    }

    try {
      let endpoint = ''
      let payload = {}

      // Convert entity names to uppercase
      const className = fileMetadata.class.toUpperCase()
      const subjectName = fileMetadata.subject.toUpperCase()
      const examName = fileMetadata.exam.toUpperCase()

      if (entityType === 'class') {
        endpoint = 'api/classes'
        payload = { name: className }
      } else if (entityType === 'subject') {
        endpoint = 'api/subject'
        payload = { name: subjectName }
      } else if (entityType === 'exam') {
        endpoint = 'api/ExamCombination'
        payload = {
          exam_name: examName,
          subjects: [subjectName],
          class_name: className
        }
      }

      await axios.post(`http://${serverInfo.ip}:${serverInfo.port}/${endpoint}`, payload)

      // Update entity check status
      setEntityChecks((prev) => ({
        ...prev,
        [`${entityType}Exists`]: true
      }))

      // Update metadata in state to use the uppercase version
      setFileMetadata((prev) => {
        const updated = { ...prev }
        if (entityType === 'class') updated.class = className
        if (entityType === 'subject') updated.subject = subjectName
        if (entityType === 'exam') updated.exam = examName
        return updated
      })

      // Update class_name, subject, and exam_name in all parsed questions
      setParsedQuestions((prev) => {
        return prev.map((q) => ({
          ...q,
          class_name: className,
          subject: subjectName,
          exam_name: examName
        }))
      })

      toast.success(`Created ${entityType} "${payload.name || payload.exam_name}" successfully`)
      log(
        `${new Date().toLocaleTimeString()} Created ${entityType}: ${payload.name || payload.exam_name}`
      )
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error)
      toast.error(`Failed to create ${entityType}`)
    }
  }

  const continueToReview = () => {
    if (parsedQuestions.length === 0) {
      toast.error('No valid questions to import')
      return
    }

    // Check if required entities exist
    if (!entityChecks.classExists || !entityChecks.subjectExists || !entityChecks.examExists) {
      toast.error('Please create all required entities before continuing')
      return
    }

    setReviewStep(true)
  }

  const editQuestion = (index) => {
    setEditingQuestionIndex(index)
  }

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...parsedQuestions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }

    // If updating the question, check if it has a question mark
    if (field === 'question') {
      updatedQuestions[index].hasErrors = !value.includes('?') || updatedQuestions[index].hasErrors
    }

    setParsedQuestions(updatedQuestions)
  }

  const updateOption = (index, optionIndex, value) => {
    const updatedQuestions = [...parsedQuestions]
    const updatedIncorrectAnswers = [...updatedQuestions[index].incorrect_answers]
    updatedIncorrectAnswers[optionIndex] = value
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      incorrect_answers: updatedIncorrectAnswers
    }
    setParsedQuestions(updatedQuestions)
  }

  const updateOptionByLetter = (index, letter, value) => {
    const updatedQuestions = [...parsedQuestions]
    const updatedOptions = { ...updatedQuestions[index].options }
    updatedOptions[letter] = value

    // Check if this is the correct answer
    if (updatedQuestions[index].answerLetter === letter) {
      updatedQuestions[index].correct_answer = value
    } else {
      // Find this option in incorrect_answers and update it
      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(letter)
      const answerIndex = ['A', 'B', 'C', 'D'].indexOf(updatedQuestions[index].answerLetter)

      let incorrectIndex = letterIndex
      if (letterIndex >= answerIndex) incorrectIndex -= 1

      if (incorrectIndex >= 0 && incorrectIndex < 3) {
        const updatedIncorrectAnswers = [...updatedQuestions[index].incorrect_answers]
        updatedIncorrectAnswers[incorrectIndex] = value
        updatedQuestions[index].incorrect_answers = updatedIncorrectAnswers
      }
    }

    updatedQuestions[index].options = updatedOptions
    setParsedQuestions(updatedQuestions)
  }

  const setCorrectAnswer = (index, letter) => {
    const updatedQuestions = [...parsedQuestions]
    const question = updatedQuestions[index]

    // Update answerLetter
    question.answerLetter = letter

    // Set the correct answer to the value of this option
    question.correct_answer = question.options[letter]

    // Update incorrect_answers to be all other options
    const incorrectAnswers = []
    for (const optLetter of ['A', 'B', 'C', 'D']) {
      if (optLetter !== letter && question.options[optLetter]) {
        incorrectAnswers.push(question.options[optLetter])
      }
    }

    // Fill with empty strings if there are less than 3 incorrect answers
    while (incorrectAnswers.length < 3) {
      incorrectAnswers.push('')
    }

    question.incorrect_answers = incorrectAnswers

    setParsedQuestions(updatedQuestions)
  }

  const addNewOption = (index, letter) => {
    setNewOptionData({
      questionIndex: index,
      optionLetter: letter,
      optionText: ''
    })
    setShowAddOptionModal(true)
  }

  const saveNewOption = () => {
    const { questionIndex, optionLetter, optionText } = newOptionData

    if (!optionText.trim()) {
      toast.error('Option text cannot be empty')
      return
    }

    const updatedQuestions = [...parsedQuestions]
    const question = updatedQuestions[questionIndex]

    // Update options
    question.options[optionLetter] = optionText

    // If there's no answer letter set, set this as the answer
    if (!question.answerLetter) {
      question.answerLetter = optionLetter
      question.correct_answer = optionText
    } else if (question.answerLetter === optionLetter) {
      // If this is already the correct answer, update it
      question.correct_answer = optionText
    } else {
      // Otherwise, it's an incorrect answer
      const incorrectAnswers = [...question.incorrect_answers]

      // Find an empty slot
      const emptyIndex = incorrectAnswers.findIndex((a) => !a.trim())
      if (emptyIndex !== -1) {
        incorrectAnswers[emptyIndex] = optionText
      } else {
        // Replace the last one if no empty slots
        incorrectAnswers[2] = optionText
      }

      question.incorrect_answers = incorrectAnswers
    }

    // Update question with errors list
    updateQuestionsWithErrors()

    setParsedQuestions(updatedQuestions)
    setShowAddOptionModal(false)
  }

  const updateQuestionsWithErrors = () => {
    const errorsList = []

    parsedQuestions.forEach((q, idx) => {
      const questionErrors = []

      // Check for missing question text
      if (!q.question.trim()) {
        questionErrors.push({
          type: 'question_missing',
          message: 'Missing question text'
        })
      }

      // Check for missing options
      for (const letter of ['A', 'B', 'C', 'D']) {
        if (!q.options[letter]) {
          questionErrors.push({
            type: 'option_missing',
            letter: letter,
            message: `Missing option ${letter}`
          })
        }
      }

      // Check for missing answer
      if (!q.answerLetter) {
        questionErrors.push({
          type: 'answer_missing',
          message: 'Missing answer'
        })
      }

      // Add to the list if there are errors
      if (questionErrors.length > 0) {
        errorsList.push({
          questionIndex: idx,
          questionNumber: q.questionNumber,
          errors: questionErrors
        })
      }
    })

    setQuestionsWithErrors(errorsList)
  }

  const saveQuestionEdit = () => {
    if (editingQuestionIndex !== null) {
      // Check if the question has all required fields
      const question = parsedQuestions[editingQuestionIndex]

      // Check if question text is provided
      if (!question.question.trim()) {
        toast.error('Question text cannot be empty')
        return
      }

      // Check if all options are provided
      for (const letter of ['A', 'B', 'C', 'D']) {
        if (!question.options[letter]) {
          toast.error(`Option ${letter} cannot be empty`)
          return
        }
      }

      // Check if answer letter is provided
      if (!question.answerLetter) {
        toast.error('Please select a correct answer')
        return
      }

      // Update question with errors list
      updateQuestionsWithErrors()

      setEditingQuestionIndex(null)
    }
  }

  const addMissingQuestionMark = (index) => {
    const updatedQuestions = [...parsedQuestions]
    let question = updatedQuestions[index].question.trim()

    if (!question.endsWith('?')) {
      question = question + '?'
      updatedQuestions[index].question = question
      setParsedQuestions(updatedQuestions)
      toast.success('Added question mark')
    }
  }

  const fixAllQuestionErrors = () => {
    if (questionsWithErrors.length === 0) return

    const updatedQuestions = [...parsedQuestions]

    questionsWithErrors.forEach((qError) => {
      const question = updatedQuestions[qError.questionIndex]

      // Add question mark if missing
      if (!question.question.includes('?')) {
        question.question = question.question.trim() + '?'
      }

      // Fix missing options
      for (const letter of ['A', 'B', 'C', 'D']) {
        if (!question.options[letter]) {
          question.options[letter] = `Default option ${letter}`
        }
      }

      // Set answer letter if missing
      if (!question.answerLetter) {
        question.answerLetter = 'A'
      }

      // Set correct answer and incorrect answers
      question.correct_answer = question.options[question.answerLetter]

      const incorrectAnswers = []
      for (const optLetter of ['A', 'B', 'C', 'D']) {
        if (optLetter !== question.answerLetter) {
          incorrectAnswers.push(question.options[optLetter])
        }
      }

      // Fill with empty strings if there are less than 3 incorrect answers
      while (incorrectAnswers.length < 3) {
        incorrectAnswers.push('')
      }

      question.incorrect_answers = incorrectAnswers.slice(0, 3)
      question.hasErrors = false
    })

    setParsedQuestions(updatedQuestions)
    setQuestionsWithErrors([])
    toast.success('Fixed all question errors')
  }

  const importQuestions = async () => {
    if (!serverInfo.ip || !serverInfo.port || parsedQuestions.length === 0) {
      toast.error('Nothing to import or no server connection')
      return
    }

    // Check if there are still questions with errors
    if (questionsWithErrors.length > 0) {
      const proceed = window.confirm(
        `There are still ${questionsWithErrors.length} questions with errors. Do you want to fix them automatically before importing?`
      )

      if (proceed) {
        fixAllQuestionErrors()
      } else {
        return
      }
    }

    setImporting(true)
    setImportProgress(0)
    setImportStatus('Starting import...')

    try {
      let successCount = 0
      let failCount = 0

      // Import questions in batches for better performance
      for (let i = 0; i < parsedQuestions.length; i += batchSize) {
        const batch = parsedQuestions.slice(i, i + batchSize)

        // Create an array of promises for concurrent requests
        const promises = batch.map((question) => {
          // Create a clean question object without temporary validation fields
          const { options, answerLetter, questionNumber, hasErrors, ...cleanQuestion } = question

          return axios
            .post(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`, cleanQuestion)
            .then(() => {
              successCount++
              return true
            })
            .catch((error) => {
              console.error('Error importing question:', error)
              failCount++
              return false
            })
        })

        // Wait for all promises in this batch to resolve
        await Promise.all(promises)

        // Update progress
        const progress = Math.round(((i + batch.length) / parsedQuestions.length) * 100)
        setImportProgress(progress)
        setImportStatus(`Imported ${i + batch.length}/${parsedQuestions.length} questions...`)
      }

      if (failCount > 0) {
        toast(`Imported ${successCount} questions. ${failCount} failed.`, {
          icon: '⚠️'
        })
      } else {
        toast.success(`Successfully imported all ${successCount} questions`)
      }

      log(`${new Date().toLocaleTimeString()} Imported ${successCount} questions from file`)

      // Reset and refresh
      setImporting(false)
      setShowImportDialog(false)
      setParsedQuestions([])
      setFileContent('')
      setReviewStep(false)
      setQuestionsWithErrors([])
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Force refresh by incrementing the refresh trigger
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error during import:', error)
      toast.error('Error during import process')
      setImporting(false)
    }
  }

  const resetImporter = () => {
    setFileContent('')
    setParsedQuestions([])
    setParsingErrors([])
    setReviewStep(false)
    setEditingQuestionIndex(null)
    setQuestionsWithErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const HandleClose = () => {
    setShowImportDialog(false)
  }
  return (
    <>
      <button
        onClick={() => setShowImportDialog(true)}
        className="flex items-center px-3 py-1 text-[10px] bg-green-600 text-white rounded-full hover:bg-green-600"
      >
        <TbFileImport className="mr-1" />
        Import Questions
      </button>

      {/* Import Dialog */}
      {showImportDialog && (
        <Dailog
          im={<TbFileImport />}
          title={'Import Questions from Text File'}
          onClose={HandleClose}
          children={
            <div className="bg-white dark:bg-gray-900  max-w-4xl w-full max-h-[90vh]">
              <div className="space-y-3 p-3 text-[10px] overflow-y-auto max-h-[calc(90vh-100px)]">
                {!fileContent ? (
                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">
                      Upload a text file containing questions in the specified format:
                      <br />
                      <p className="px-2 bg-yellow-400/20 border-l-2 border-yellow-600 py-1 italic my-1">
                        {' '}
                        Make sure the you follow a specfic case for the words
                      </p>
                    </p>
                    <div className="bg-black p-2 border-l-4 border-gray-400  rounded-md  text-white dark:text-gray-400">
                      <pre className="italic text-[8px]">
                        {`Class = "class_name"
Subject-name = "subject_name"
Exam-name = "exam_name"

Q1. What is the correct answer to this question?
A. First option
B. Second option
C. Third option
D. Fourth option
Answer: B

Q2. Another sample question?
A. Option A
B. Option B
C. Option C
D. Option D
Answer: A
`}
                      </pre>
                    </div>
                    <div className="flex flex-col">
                      <div
                        ref={dropZoneRef}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-md p-3 flex flex-col items-center justify-center transition-colors ${
                          isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <TbFileImport className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            Drag & drop your text file here, or
                          </p>
                          <input
                            type="file"
                            accept=".txt"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer px-3 py-1 text-[10px] bg-blue-500 text-white rounded-full hover:bg-blue-600 inline-flex items-center"
                          >
                            <TbFileImport className="mr-1" />
                            Browse Files
                          </label>
                          <p className="text-gray-500 dark:text-gray-400 text-[9px] mt-2">
                            Only .txt files are supported
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center mt-3 text-[10px]">
                        <input
                          type="checkbox"
                          id="validationMode"
                          checked={validationMode}
                          onChange={() => setValidationMode(!validationMode)}
                          className="mr-1"
                        />
                        <label htmlFor="validationMode">Enable validation</label>
                      </div>
                    </div>
                  </div>
                ) : !reviewStep ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold">Metadata and Validation</h3>
                      <button
                        onClick={resetImporter}
                        className="px-2 py-1 bg-gray-300/20 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Import Again
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col">
                        <label className="text-gray-700 dark:text-gray-300">Class:</label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={fileMetadata.class}
                            onChange={(e) =>
                              setFileMetadata({ ...fileMetadata, class: e.target.value })
                            }
                            className="border p-1 rounded-full flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          {entityChecks.classExists === false && (
                            <button
                              onClick={() => createEntity('class')}
                              className="ml-1 px-1 py-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
                            >
                              <FiPlus className="mr-0.5" size={8} />
                              Create
                            </button>
                          )}
                          {entityChecks.classExists !== null && (
                            <span className="ml-1">
                              {entityChecks.classExists ? (
                                <BiCheckCircle className="text-green-500" />
                              ) : (
                                <BiErrorCircle className="text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-gray-700 dark:text-gray-300">Subject:</label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={fileMetadata.subject}
                            onChange={(e) =>
                              setFileMetadata({ ...fileMetadata, subject: e.target.value })
                            }
                            className="border p-1 rounded-full flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          {entityChecks.subjectExists === false && (
                            <button
                              onClick={() => createEntity('subject')}
                              className="ml-1 px-1 py-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
                            >
                              <FiPlus className="mr-0.5" size={8} />
                              Create
                            </button>
                          )}
                          {entityChecks.subjectExists !== null && (
                            <span className="ml-1">
                              {entityChecks.subjectExists ? (
                                <BiCheckCircle className="text-green-500" />
                              ) : (
                                <BiErrorCircle className="text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-gray-700 dark:text-gray-300">Exam:</label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={fileMetadata.exam}
                            onChange={(e) =>
                              setFileMetadata({ ...fileMetadata, exam: e.target.value })
                            }
                            className="border p-1 rounded-full flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          {entityChecks.examExists === false && (
                            <button
                              onClick={() => createEntity('exam')}
                              className="ml-1 px-1 py-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
                            >
                              <FiPlus className="mr-0.5" size={8} />
                              Create
                            </button>
                          )}
                          {entityChecks.examExists !== null && (
                            <span className="ml-1">
                              {entityChecks.examExists ? (
                                <BiCheckCircle className="text-green-500" />
                              ) : (
                                <BiErrorCircle className="text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-2 rounded-md mt-3">
                      <div className="flex items-center">
                        <BiInfoCircle className="text-yellow-600 dark:text-yellow-400 mr-1" />
                        <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                          Import Status
                        </span>
                      </div>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">{importStatus}</p>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-bold mb-1"> Questions ({parsedQuestions.length})</h3>
                      <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 dark:border-gray-700">
                        {parsedQuestions.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1">
                            {parsedQuestions.map((q, idx) => (
                              <li key={idx} className={q.hasErrors ? 'text-red-500' : ''}>
                                Q{q.questionNumber}: {q.question.substring(0, 50)}
                                {q.question.length > 50 ? '...' : ''}
                                {q.hasErrors && (
                                  <span className="text-red-500 ml-1">(has errors)</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">
                            No questions parsed yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {parsingErrors.length > 0 && (
                      <div className="mt-3">
                        <h3 className="font-bold mb-1 flex items-center">
                          <FiAlertTriangle className="text-red-500 mr-1" />
                          Parsing Issues ({parsingErrors.length})
                        </h3>
                        <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 dark:border-gray-700">
                          <ul className="list-disc pl-4 space-y-1">
                            {parsingErrors.map((error, idx) => (
                              <li
                                key={idx}
                                className={
                                  error.severity === 'error'
                                    ? 'text-red-500'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }
                              >
                                Line {error.line}: {error.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={resetImporter}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={continueToReview}
                        disabled={
                          parsedQuestions.length === 0 ||
                          !entityChecks.classExists ||
                          !entityChecks.subjectExists ||
                          !entityChecks.examExists
                        }
                        className="px-3 py-1 bg-blue-500 text-white rounded-full shadow  hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Continue to Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold">Review Questions Before Import</h3>
                      <div className="flex space-x-2">
                        {questionsWithErrors.length > 0 && (
                          <button
                            onClick={fixAllQuestionErrors}
                            className="px-2 py-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 flex items-center"
                          >
                            <BiCheckCircle className="mr-1" />
                            Auto-Fix All Errors
                          </button>
                        )}
                        <button
                          onClick={() => setReviewStep(false)}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Back
                        </button>
                      </div>
                    </div>

                    {questionsWithErrors.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-2 rounded-md">
                        <div className="flex items-center">
                          <MdError className="text-red-600 dark:text-red-400 mr-1" />
                          <span className="text-red-800 dark:text-red-300 font-medium">
                            {questionsWithErrors.length} questions need attention
                          </span>
                        </div>
                        <ul className="list-disc pl-5 mt-1 text-red-700 dark:text-red-300">
                          {questionsWithErrors.slice(0, 3).map((qErr, idx) => (
                            <li key={idx}>
                              Question {qErr.questionNumber}:{' '}
                              {qErr.errors.map((e) => e.message).join(', ')}
                              <button
                                onClick={() => editQuestion(qErr.questionIndex)}
                                className="ml-2 text-blue-500 hover:text-blue-700 underline"
                              >
                                Fix
                              </button>
                            </li>
                          ))}
                          {questionsWithErrors.length > 3 && (
                            <li>...and {questionsWithErrors.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3">
                      <h3 className="font-bold mb-1">
                        Questions to Import ({parsedQuestions.length})
                      </h3>

                      {editingQuestionIndex !== null ? (
                        <div className="border  rounded-md p-3 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                          <h4 className="font-bold mb-2">
                            Editing Question {parsedQuestions[editingQuestionIndex].questionNumber}
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                                Question:
                              </label>
                              <div className="flex items-center">
                                <textarea
                                  value={parsedQuestions[editingQuestionIndex].question}
                                  onChange={(e) =>
                                    updateQuestion(editingQuestionIndex, 'question', e.target.value)
                                  }
                                  className="border p-1 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                  rows={2}
                                />
                                {!parsedQuestions[editingQuestionIndex].question.includes('?') && (
                                  <button
                                    onClick={() => addMissingQuestionMark(editingQuestionIndex)}
                                    className="ml-1 px-1 py-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center text-[8px]"
                                  >
                                    Add ?
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {['A', 'B', 'C', 'D'].map((letter) => (
                                <div key={letter}>
                                  <div className="flex items-center mb-1">
                                    <input
                                      type="radio"
                                      id={`option${letter}`}
                                      name="correctAnswer"
                                      checked={
                                        parsedQuestions[editingQuestionIndex].answerLetter ===
                                        letter
                                      }
                                      onChange={() =>
                                        setCorrectAnswer(editingQuestionIndex, letter)
                                      }
                                      className="mr-1"
                                    />
                                    <label
                                      htmlFor={`option${letter}`}
                                      className="text-gray-700 dark:text-gray-300"
                                    >
                                      Option {letter} (correct answer)
                                    </label>
                                  </div>
                                  <div className="flex items-center">
                                    {parsedQuestions[editingQuestionIndex].options[letter] ? (
                                      <input
                                        type="text"
                                        value={
                                          parsedQuestions[editingQuestionIndex].options[letter]
                                        }
                                        onChange={(e) =>
                                          updateOptionByLetter(
                                            editingQuestionIndex,
                                            letter,
                                            e.target.value
                                          )
                                        }
                                        className="border p-1 rounded-full w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                      />
                                    ) : (
                                      <button
                                        onClick={() => addNewOption(editingQuestionIndex, letter)}
                                        className="flex items-center px-2 py-1 w-full border border-dashed border-gray-400 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 justify-center"
                                      >
                                        <FiPlus className="mr-1" size={8} />
                                        Add Option {letter}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={() => setEditingQuestionIndex(null)}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveQuestionEdit}
                                className="px-2 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto border rounded dark:border-gray-700">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-md">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-2 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  #
                                </th>
                                <th className="px-2 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Question
                                </th>
                                <th className="px-2 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Correct Answer
                                </th>
                                <th className="px-2 py-1 text-left text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                              {parsedQuestions.map((q, idx) => (
                                <tr
                                  key={idx}
                                  className={q.hasErrors ? 'bg-red-50 dark:bg-red-900/20' : ''}
                                >
                                  <td className="px-2 py-1 whitespace-nowrap text-[9px] text-gray-500 dark:text-gray-400">
                                    {q.questionNumber}
                                  </td>
                                  <td className="px-2 py-1 text-[9px] text-gray-900 dark:text-gray-200">
                                    {q.question.substring(0, 50)}
                                    {q.question.length > 50 ? '...' : ''}
                                  </td>
                                  <td className="px-2 py-1 text-[9px] text-gray-900 dark:text-gray-200">
                                    {q.correct_answer.substring(0, 30)}
                                    {q.correct_answer.length > 30 ? '...' : ''}
                                  </td>
                                  <td className="px-2 py-1 whitespace-nowrap text-right text-[9px]">
                                    <button
                                      onClick={() => editQuestion(idx)}
                                      className="px-1 py-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
                                    >
                                      <BiEdit className="mr-0.5" size={8} />
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => setReviewStep(false)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Back
                      </button>
                      <button
                        onClick={importQuestions}
                        disabled={importing}
                        className="px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                      >
                        {importing ? (
                          <>
                            <TbLoader3 className="animate-spin mr-1" />
                            Importing... ({importProgress}%)
                          </>
                        ) : (
                          'Import Questions'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        ></Dailog>
      )}

      {/* Add New Option Modal */}
      {showAddOptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-[10px]">
          <div className="bg-white dark:bg-gray-900 rounded-full border p-3 max-w-md w-full">
            <h3 className="font-bold mb-2">Add Option {newOptionData.optionLetter}</h3>
            <textarea
              value={newOptionData.optionText}
              onChange={(e) => setNewOptionData({ ...newOptionData, optionText: e.target.value })}
              className="border p-1 rounded-full w-full mb-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows={3}
              placeholder={`Enter option ${newOptionData.optionLetter} text...`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddOptionModal(false)}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveNewOption}
                className="px-2 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                Save Option
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default QuestionImporter
