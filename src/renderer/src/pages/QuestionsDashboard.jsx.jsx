import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import toast, { LoaderIcon, Toaster } from 'react-hot-toast'
import { ChevronDown, ChevronRight, Book, FileText, Users, Award } from 'lucide-react'
import _ from 'lodash'

function QuestionsDashboard() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
  const [serverConnected, setServerConnected] = useState(false)
  
  // Category organization
  const [examGroups, setExamGroups] = useState({})
  const [subjectGroups, setSubjectGroups] = useState({})
  const [classGroups, setClassGroups] = useState({})
  
  // Expanded states
  const [expandedExams, setExpandedExams] = useState({})
  const [expandedSubjects, setExpandedSubjects] = useState({})
  const [expandedClasses, setExpandedClasses] = useState({})
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('exams') // 'exams', 'subjects', 'classes'

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
    }
  }, [serverConnected])

  // Group the questions by different categories
  useEffect(() => {
    if (questions.length > 0) {
      // Group by exam
      const byExam = _.groupBy(questions, 'exam_name')
      setExamGroups(byExam)
      
      // Group by subject
      const bySubject = _.groupBy(questions, 'subject')
      setSubjectGroups(bySubject)
      
      // Group by class
      const byClass = _.groupBy(questions, 'class_name')
      setClassGroups(byClass)
    }
  }, [questions])

  const fetchQuestions = async () => {
    if (!serverInfo.ip || !serverInfo.port) return
    
    setLoading(true)
    try {
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`)
      setQuestions(response.data)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const toggleExamExpand = (exam) => {
    setExpandedExams(prev => ({
      ...prev,
      [exam]: !prev[exam]
    }))
  }

  const toggleSubjectExpand = (subject) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }))
  }

  const toggleClassExpand = (className) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }))
  }

  // Show loading state if we're still initializing the connection
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full py-10">
        <LoaderIcon/>
        <p className="mt-2 text-gray-600">Connecting to server...</p>
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

  // Questions by Exam View
  const ExamsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(examGroups).length > 0 ? (
          Object.entries(examGroups).map(([exam, questions]) => (
            <div key={exam} className="bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExamExpand(exam)}
              >
                <div className="flex items-center space-x-2">
                  <Award className="text-blue-500" size={16} />
                  <h3 className=" font-semibold">{exam || 'Unnamed Exam'}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {questions.length} questions
                  </span>
                </div>
               
              </div>
        
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-6 text-gray-500">
            No exam data found
          </div>
        )}
      </div>
    </div>
  )

  // Questions by Subject View
  const SubjectsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(subjectGroups).length > 0 ? (
          Object.entries(subjectGroups).map(([subject, questions]) => (
            <div key={subject} className="bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSubjectExpand(subject)}
              >
                <div className="flex items-center space-x-2">
                  <Book className="text-green-500" size={16} />
                  <h3 className=" font-semibold">{subject || 'Unnamed Subject'}</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {questions.length} questions
                  </span>
                </div>
              
              </div>
              
          
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-6 text-gray-500">
            No subject data found
          </div>
        )}
      </div>
    </div>
  )

  // Questions by Class View
  const ClassesView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(classGroups).length > 0 ? (
          Object.entries(classGroups).map(([className, questions]) => (
            <div key={className} className="bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleClassExpand(className)}
              >
                <div className="flex items-center space-x-2">
                  <Users className="text-purple-500" size={16} />
                  <h3 className=" font-semibold">{className || 'Unnamed Class'}</h3>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {questions.length} questions
                  </span>
                </div>
              
              </div>
              
            
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-6 text-gray-500">
            No class data found
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col w-full h-full  bg-gray-50 dark:bg-gray-900 text-[10px]">
      <Toaster />


      {/* Tab Navigation */}
      <div className="px-4 pb-2">
        <div className="flex border-b dark:border-gray-700">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'exams'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('exams')}
          >
            Exams
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'subjects'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('subjects')}
          >
            Subjects
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'classes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('classes')}
          >
            Classes
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoaderIcon />
        
        </div>
      ) : (
        <div className="p-4">
          {activeTab === 'exams' && <ExamsView />}
          {activeTab === 'subjects' && <SubjectsView />}
          {activeTab === 'classes' && <ClassesView />}
        </div>
      )}
    </div>
  )
}

export default QuestionsDashboard