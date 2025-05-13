'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { FcAddDatabase, FcDeleteDatabase } from 'react-icons/fc'
import { FiMaximize } from 'react-icons/fi'
import useLogger from '../hook/useLogger'
import '../assets/scrollbar.css'
import { LuBookOpenText, LuEyeClosed, LuShapes } from 'react-icons/lu'
import { IoIosTimer } from 'react-icons/io'
import { MdDeleteOutline, MdSettings } from 'react-icons/md'
import { TbEdit, TbLoader3 } from 'react-icons/tb'
import Dialog from '../components/dailog'
import Dropdown from '../components/dropdown'
import { BsEye, BsEyeSlash } from 'react-icons/bs'

const Exams = () => {
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [form, setForm] = useState({ exam_name: '', class_name: '', minutes: '', visible: true })
  const [isEditing, setIsEditing] = useState(false)
  const { log } = useLogger()

  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
  const [serverInfoLoaded, setServerInfoLoaded] = useState(false)

  // First fetch the server info
  useEffect(() => {
    const getServerInfo = async () => {
      try {
        const info = await window.api.getServerInfo()
        setServerInfo(info)
        setServerInfoLoaded(true)
      } catch (error) {
        console.error('Error fetching server info:', error)
      }
    }

    getServerInfo()
  }, [])

  // Then fetch exams once server info is loaded
  useEffect(() => {
    if (serverInfoLoaded && serverInfo.ip && serverInfo.port) {
      fetchExams()
    }
  }, [serverInfoLoaded, serverInfo])

  // Fetch exams from the API
  async function fetchExams() {
    try {
      const response = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`
      )
      setExams(response.data)
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  // Fetch classes from the API
  async function fetchClasses() {
    if (!serverInfo.ip || !serverInfo.port) return

    try {
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/classes`)
      setClasses(response.data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  // Handle input change
  function handleInputChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle checkbox/toggle change
  function handleToggleChange(e) {
    const { name, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: checked }))
  }

  // Open the add/edit modal
  function handleAddClick() {
    setSelectedExam(null)
    setForm({ exam_name: '', class_name: '', minutes: '', visible: true })
    setIsEditing(false)
    fetchClasses() // Fetch classes when opening the dialog
    setShowDialog(true)
  }

  function handleEditClick(exam) {
    setSelectedExam(exam)
    setForm({ 
      exam_name: exam.exam_name, 
      class_name: exam.class_name, 
      minutes: exam.minutes, 
      visible: exam.visible !== undefined ? exam.visible : true
    })
    setIsEditing(true)
    fetchClasses() // Fetch classes when opening the dialog
    setShowDialog(true)
  }

  const HandleCloseDailog = () => {
    setShowDialog(false)
  }

  // Save or update an exam
  async function handleSaveExam() {
    if (!serverInfo.ip || !serverInfo.port) {
      console.error('Server info not available')
      return
    }

    try {
      if (isEditing && selectedExam) {
        await axios.put(
          `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination/${selectedExam.id}`,
          form
        )
        log(`${new Date().toLocaleTimeString()}  Edited exam ${form.exam_name}`)
      } else {
        await axios.post(`http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`, form)
        log(`${new Date().toLocaleTimeString()}  Created new exam successfully  ${form.exam_name}`)
      }
      setShowDialog(false)
      fetchExams()
    } catch (error) {
      console.error('Error saving exam:', error)
    }
  }

  // Delete an exam
  async function handleDeleteClick(examId) {
    if (!serverInfo.ip || !serverInfo.port) {
      console.error('Server info not available')
      return
    }

    try {
      await axios.delete(`http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination/${examId}`)
      log(`${new Date().toLocaleTimeString()}  Deleted exam  ${form.exam_name}`)
      fetchExams()
    } catch (error) {
      log(`${new Date().toLocaleTimeString()}  Error deleting exam: `, error)
    }
  }

  // Toggle visibility for an exam
  async function handleVisibilityToggle(exam) {
    if (!serverInfo.ip || !serverInfo.port) {
      console.error('Server info not available')
      return
    }

    const updatedExam = { ...exam, visible: !exam.visible }
    
    try {
      await axios.put(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination/${exam.id}`,
        updatedExam
      )
      log(`${new Date().toLocaleTimeString()} Changed visibility for exam ${exam.exam_name}`)
      fetchExams()
    } catch (error) {
      console.error('Error updating exam visibility:', error)
    }
  }

  // Toggle selected status for an exam (radio button behavior)
  async function handleSelectedToggle(exam) {
    if (!serverInfo.ip || !serverInfo.port) {
      console.error('Server info not available')
      return
    }

    // Get all exams of the same class
    const classExams = exams.filter(e => e.class_name === exam.class_name)
    
    // Update all exams in this class: deselect all, then select only the clicked one
    try {
      // First, update all exams in this class to be deselected
      for (const classExam of classExams) {
        if (classExam.selected && classExam.id !== exam.id) {
          await axios.put(
            `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination/${classExam.id}`,
            { ...classExam, selected: false }
          )
        }
      }
      
      // Then, toggle the selected status of the clicked exam
      const newSelectedStatus = !exam.selected
      await axios.put(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination/${exam.id}`,
        { ...exam, selected: newSelectedStatus }
      )
      
      log(`${new Date().toLocaleTimeString()} ${newSelectedStatus ? 'Selected' : 'Deselected'} exam ${exam.exam_name}`)
      fetchExams()
    } catch (error) {
      console.error('Error updating exam selection:', error)
    }
  }

  // Loading state while server info is being fetched
  if (!serverInfoLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full dark:bg-black dark:text-gray-600">
        <TbLoader3 className="animate-spin text-2xl"/>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full space-y-2 dark:bg-gray-900 animated-scrollbar text-gray-800 dark:text-gray-400">
      <div className="flex items-center justify-between border-b dark:border-gray-600 p-3">
        <span className=" ">Exams</span>

        <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:border-gray-600 dark:text-zinc-200">
          <FcDeleteDatabase />
          <FcAddDatabase onClick={handleAddClick} className="cursor-pointer" />
        </div>
      </div>

      {/* Exams Table */}
      <div className="hidden lg:block w-full overflow-hidden">
        <div className="border-b dark:border-gray-600 bg-white dark:bg-gray-900 w-full">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-[10px]">
              <thead className="border-b dark:border-gray-600 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">
                    <div className="flex items-center gap-1">
                      <LuBookOpenText className="text-[12px]" />
                      Exams
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-medium ">
                    <div className="flex items-center gap-1">
                      <LuShapes className="text-[12px]" />
                      Classes
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-medium ">
                    <div className="flex items-center gap-1">
                      <IoIosTimer className="text-[12px]" />
                      Time (minutes)
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-medium ">
                    <div className="flex items-center gap-1">
                      <BsEye className="text-[12px]" />
                      Visibility
                    </div>
                  </th>
                  
                  <th className="px-4 py-2 text-left font-medium ">
                    <div className="flex items-center gap-1">
                      {' '}
                      <MdSettings className="text-[12px]" />
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="[&_tr:last-child]:border-0">
                {exams.length === 0 ? (
                  <tr className="border-b transition-colors">
                    <td colSpan="6" className="p-4 text-center ">
                      No exams available
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="border-b transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-gray-50 dark:text-gray-300"
                    >
                      <td className="px-4 text-left align-middle font-medium">
                        {exam.exam_name}
                      </td>
                      <td className="px-4 text-left align-middle font-medium uppercase border-l dark:border-gray-600">
                        {exam.class_name}
                      </td>
                      <td className="px-4 text-left align-middle font-medium border-l dark:border-gray-600">
                        {exam.minutes}
                      </td>
                      <td className="hidden px-4 text-left align-middle font-medium border-l dark:border-gray-600">
                        <div 
                          className="relative inline-flex h-4 w-7 cursor-pointer rounded-full bg-gray-200 dark:bg-gray-700 transition-colors ease-in-out duration-200"
                          onClick={() => handleVisibilityToggle(exam)}
                        >
                          <span 
                            className={`${
                              exam.visible ? 'translate-x-3' : 'translate-x-0'
                            } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-400 shadow-md transition-transform duration-200 ease-in-out`}
                          />
                          <span className="sr-only">Toggle visibility</span>
                        </div>
                      </td>
                      <td className="px-4 text-left align-middle font-medium border-l dark:border-gray-600">
                        <div className="flex items-center">
                          <div 
                            className={`w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center cursor-pointer ${
                              exam.selected ? 'bg-blue-500 border-blue-500' : 'bg-transparent'
                            }`}
                            onClick={() => handleSelectedToggle(exam)}
                          >
                            {exam.selected && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-left align-middle font-medium border-l dark:border-gray-600 py-2">
                        <div className="flex items-center space-x-2 text-[10px]">
                          <button
                            onClick={() => handleEditClick(exam)}
                            className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-green-600 rounded-full focus:bg-blue-300 hover:bg-green-500 text-white text-[10px] transition-all"
                          >
                            <TbEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exam.id)}
                            className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-red-600 rounded-full focus:bg-blue-300 hover:bg-red-500 text-white text-[10px] transition-all"
                          >
                            <MdDeleteOutline className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex lg:hidden items-center justify-center w-full h-full text-gray-600 text-[10px] p-4">
        <div className="flex items-center space-x-2">
          <FiMaximize className="mr-1" />
          <span>Maximize the window to view full table details</span>
        </div>
      </div>

      {/* Add/Edit Exam Dialog - Modal with Shadcn styling */}
      {showDialog && (
        <Dialog
          title={isEditing ? 'Edit Exam' : 'Add Exam'}
          im={<TbEdit />}
          onClose={HandleCloseDailog}
          children={
            <div className="flex flex-col text-[10px] px-3 pb-3">
              <div className="flex flex-col space-y-3 py-3">
                {/* Exam Name */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="exam_name" className="font-medium">
                    Exam Name
                  </label>
                  <input
                    id="exam_name"
                    type="text"
                    name="exam_name"
                    value={form.exam_name}
                    onChange={handleInputChange}
                    placeholder="Enter exam name"
                    className="h-8 w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900 px-2 py-1 text-[10px] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 dark:focus-visible:ring-gray-300"
                  />
                </div>

                {/* Class */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="class_name" className="font-medium">
                    Class
                  </label>
                  <Dropdown
                    options={classes.map((cls) => cls.name)}
                    selected={form.class_name}
                    setSelected={(value) =>
                      handleInputChange({ target: { name: 'class_name', value } })
                    }
                    renderLabel={(value) => (value ? value.toUpperCase() : 'Select Class')}
                    className="w-full"
                    buttonClassName="h-8 w-full text-[10px] px-2 py-1 border border-gray-200 rounded-md bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                  />
                </div>

                {/* Time */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="minutes" className="font-medium">
                    Time (minutes)
                  </label>
                  <input
                    id="minutes"
                    type="number"
                    name="minutes"
                    value={form.minutes}
                    onChange={handleInputChange}
                    placeholder="Enter time in minutes"
                    className="h-8 w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900 px-2 py-1 text-[10px] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:placeholder:text-gray-500 dark:focus-visible:ring-gray-300"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="visible" className="font-medium">
                    Visible
                  </label>
                  <div className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors ease-in-out duration-200 focus:outline-none">
                    <input 
                      type="checkbox" 
                      id="visible"
                      name="visible"
                      checked={form.visible}
                      onChange={handleToggleChange}
                      className="sr-only"
                    />
                    <span 
                      aria-hidden="true"
                      className={`${
                        form.visible ? 'translate-x-4' : 'translate-x-0'
                      } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-400 shadow-sm transition-transform duration-200 ease-in-out`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                <button
                  onClick={() => setShowDialog(false)}
                  className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-300/20 rounded-full focus:bg-blue-300 hover:bg-blue-50 text-blue-600 text-[10px] transition-all shadow"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExam}
                  className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-600 bg-blue-400 rounded-full focus:bg-blue-300 hover:bg-blue-500 text-white text-[10px] transition-all shadow"
                >
                  {isEditing ? 'Update Exam' : 'Add Exam'}
                </button>
              </div>
            </div>
          }
        ></Dialog>
      )}
    </div>
  )
}

export default Exams