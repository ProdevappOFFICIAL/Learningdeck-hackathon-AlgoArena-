import { useState, useEffect } from 'react'
import { LoaderIcon } from 'react-hot-toast'
import { BiUpload } from 'react-icons/bi'
import { FcAddDatabase,  } from 'react-icons/fc'
import { LuArrowDown10, LuBookOpenText, LuLogs, LuShapes, LuSparkles } from 'react-icons/lu'
import { SiServerless, SiSession } from 'react-icons/si'
import { VscServerProcess,  } from 'react-icons/vsc'
import axios from 'axios'
import { MdDelete, MdSecurity } from 'react-icons/md'
import useLogger from '../hook/useLogger'
import Dropdown from './dropdown'
import QuestionsDashboard from '../pages/QuestionsDashboard.jsx'
import { PiDevicesDuotone } from 'react-icons/pi'
import DeviceMonitor from '../pages/DeviceMonitor.jsx'

// Inside a React component:

const TabsComponent = () => {
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })

  useEffect(() => {
    window.api.getServerInfo().then(setServerInfo)
  }, [])

  const [serverInfoLoaded, setServerInfoLoaded] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only proceed if serverInfo is loaded
        if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
          return // Exit early if server info isn't ready
        }

        const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Information`
        const res = await fetch(API_URL)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            const firstData = data[0]
            setNameOrg(firstData.name_org)
            setIconBase64(firstData.icon)
            setIsUpdating(true)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [serverInfoLoaded, serverInfo]) // Add these dependencies

  // Replace the current useEffect for fetching dashboard data with this
  // Fix the serverInfo loading by adding serverInfoLoaded state
  useEffect(() => {
    window.api
      .getServerInfo()
      .then((info) => {
        setServerInfo(info)
        setServerInfoLoaded(true) // Set this to true when server info is loaded
      })
      .catch((error) => {
        console.error('Error fetching server info:', error)
      })
  }, [])

  // Consolidate your organization info fetching into a single useEffect
  useEffect(() => {
    const fetchOrgInfo = async () => {
      try {
        // Only proceed if serverInfo is loaded
        if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
          return // Exit early if server info isn't ready
        }

        const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Information`
        const res = await fetch(API_URL)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            const firstData = data[0]
            setNameOrg(firstData.name_org)
            setIconBase64(firstData.icon)
            setIsUpdating(true)
          }
        }
      } catch (error) {
        console.error('Error fetching organization data:', error)
      }
    }

    fetchOrgInfo()
  }, [serverInfoLoaded, serverInfo]) // Add these dependencies

  // Update subject API call
  useEffect(() => {
    if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
      return // Exit early if server info isn't ready
    }

    fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Subject`)
      .then((res) => res.json())
      .then((data) => setSubjects(data))
      .catch((error) => console.error('Error fetching subjects:', error))
  }, [serverInfoLoaded, serverInfo])

  // Update classes API call
  useEffect(() => {
    if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
      return // Exit early if server info isn't ready
    }

    fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Classes`)
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch((error) => console.error('Error fetching Classes:', error))
  }, [serverInfoLoaded, serverInfo])

  const [nameOrg, setNameOrg] = useState('')
  const [iconBase64, setIconBase64] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Information`)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            const firstData = data[0]
            setNameOrg(firstData.name_org)
            setIconBase64(firstData.icon)
            setIsUpdating(true)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (limit to 5MB for example)
    if (file.size > 5 * 1024 * 1024) {
      setStatus('❌ Image size too large (max 5MB)')
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const base64String = event.target.result
        console.log('Base64 conversion successful', base64String.substring(0, 50) + '...')
        setIconBase64(base64String)
        setStatus('✅ Image loaded successfully')
      } catch (error) {
        console.error('Error converting image:', error)
        setStatus('❌ Failed to process image')
      }
    }

    reader.onerror = () => {
      console.error('FileReader error')
      setStatus('❌ Error reading file')
    }

    // This is the correct method to read a file as a data URL (base64)
    reader.readAsDataURL(file)
  }
  const handleSubmit = async () => {
    if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
      setStatus('❌ Server information not loaded')
      return
    }

    const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Information`
    const payload = {
      id: 1,
      name_org: nameOrg,
      icon: iconBase64
    }

    try {
      setStatus('Saving...')
      const res = await fetch(`${API_URL}/${isUpdating ? '1' : ''}`, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setStatus(`✅ ${isUpdating ? 'Updated!' : 'Added!'}`)
        setIsUpdating(true)
        setIsEditing(false)
      } else {
        setStatus('❌ Failed to save')
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('❌ Error saving')
    }
  }

  const [activeTab, setActiveTab] = useState('devicemonitor')
  const [batchNo, setBatchNo] = useState('') // initial batch number
  const [exam, setExam] = useState('Updating...')
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [classes, setClasses] = useState([])
  const [newClasses, setNewClasses] = useState('')
  const { logs, log, clearLogs } = useLogger()
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || "Subjects");

  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || "Classes");
  // Add new subject to the JSON server and update the dropdown
  // Fix addSubject function
  const addSubject = async () => {
    if (!newSubject.trim() || !serverInfoLoaded) return

    const newSubjectObj = { id: subjects.length + 1, name: newSubject }
    const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Subject`

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubjectObj)
      })

      if (response.ok) {
        setSubjects([...subjects, newSubjectObj])
        log(`${new Date().toLocaleTimeString()} Created a new subject: ${newSubject}`)
        setNewSubject('')
      } else {
        console.error('Failed to add subject')
      }
    } catch (error) {
      console.error('Error adding subject:', error)
    }
  }

  const API_URL_2 = `http://${serverInfo.ip}:${serverInfo.port}/api/Classes`
  // Fetch subjects from JSON API server
  useEffect(() => {
    fetch(API_URL_2)
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch((error) => console.error('Error fetching Classes:', error))
  }, [])

  // Add new subject to the JSON server and update the dropdown
  const addClasses = async () => {
    if (!newClasses.trim()) return

    const newClassObj = { id: classes.length + 1, name: newClasses }

    try {
      const response = await fetch(API_URL_2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClassObj)
      })

      if (response.ok) {
        setClasses([...classes, newClassObj]) // Update dropdown
        setNewClasses('') // Clear input field
        log(`${new Date().toLocaleTimeString()}  Created a new classes: ${newClasses}`)
        // window.location.reload();
      } else {
        console.error('Failed to add classes')
      }
    } catch (error) {
      console.error('Error adding classes:', error)
    }
  }

  let id = 1

  // Add a new log

  useEffect(() => {
    axios
      .get(`http://${serverInfo.ip}:${serverInfo.port}/api/Batch/${id}`)
      .then((response) => {
        setBatchNo(response.data.batch_no)
      })
      .catch((error) => {
        console.error('Error fetching batch data:', error)
      })
  }, [id])

  useEffect(() => {
    async function getAllExam() {
      const value = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`
      )
      setExam(value.data.length)
    }
    getAllExam()
  })

  // 1. Add deleteSubject function
const deleteSubject = async (subjectToDelete) => {
  if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) return;

  try {
    const subjectId = subjects.find(s => s.name === subjectToDelete)?.id;
    if (!subjectId) return;

    const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Subject/${subjectId}`;
    
    const response = await fetch(API_URL, {
      method: 'DELETE',
    });

    if (response.ok) {
      // Update local state by removing the deleted subject
      setSubjects(subjects.filter(s => s.name !== subjectToDelete));
      log(`${new Date().toLocaleTimeString()} Deleted subject: ${subjectToDelete}`);
      
      // Reset selected subject if the deleted one was selected
      if (selectedSubject === subjectToDelete) {
        setSelectedSubject(subjects[0]?.name || "Subjects");
      }
    } else {
      console.error('Failed to delete subject');
    }
  } catch (error) {
    console.error('Error deleting subject:', error);
  }
};

// 2. Add deleteAllSubjects function
const deleteAllSubjects = async () => {
  if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port || !window.confirm('Are you sure you want to delete all subjects?')) return;

  try {
    // Delete each subject one by one
    const deletePromises = subjects.map(subject => {
      const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Subject/${subject.id}`;
      return fetch(API_URL, { method: 'DELETE' });
    });

    await Promise.all(deletePromises);
    setSubjects([]);
    setSelectedSubject("Subjects");
    log(`${new Date().toLocaleTimeString()} Deleted all subjects`);
  } catch (error) {
    console.error('Error deleting all subjects:', error);
  }
};
const deleteClass = async (classToDelete) => {
  if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) return;

  try {
    const classId = classes.find(c => c.name === classToDelete)?.id;
    if (!classId) return;

    const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Classes/${classId}`;
    
    const response = await fetch(API_URL, {
      method: 'DELETE',
    });

    if (response.ok) {
      // Update local state by removing the deleted class
      setClasses(classes.filter(c => c.name !== classToDelete));
      log(`${new Date().toLocaleTimeString()} Deleted class: ${classToDelete}`);
      
      // Reset selected class if the deleted one was selected
      if (selectedClass === classToDelete) {
        setSelectedClass(classes[0]?.name || "Classes");
      }
    } else {
      console.error('Failed to delete class');
    }
  } catch (error) {
    console.error('Error deleting class:', error);
  }
};

// 2. Add deleteAllClasses function
const deleteAllClasses = async () => {
  if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port || !window.confirm('Are you sure you want to delete all classes?')) return;

  try {
    // Delete each class one by one
    const deletePromises = classes.map(classItem => {
      const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Classes/${classItem.id}`;
      return fetch(API_URL, { method: 'DELETE' });
    });

    await Promise.all(deletePromises);
    setClasses([]);
    setSelectedClass("Classes");
    log(`${new Date().toLocaleTimeString()} Deleted all classes`);
  } catch (error) {
    console.error('Error deleting all classes:', error);
  }
};

  // Function to handle updating the batch_no
  const handleUpdateBatchNo = () => {
    try {
      axios.put(`http://${serverInfo.ip}:${serverInfo.port}/api/Batch/${id}`, {
        batch_no: batchNo
      })
      console.log('Changed to Batch' + batchNo)
    } catch (error) {
      console.error('Error updating batch number:', error)
    }
  }

  return (
    <div className="flex flex-col pb-4 w-full px-3 text-[10px] bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
      {!serverInfoLoaded ? (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <LoaderIcon />
          </div>
        </div>
      ) : (
        <div className=''>
          <div className="flex items-center justify-between ">
            <div className="flex h-full  items-start  justify-items-center border-gray-300 dark:border-gray-700 space-x-4">
              <div className="flex flex-col items-center pr-3.5 border-r dark:border-gray-700 ">
                <button
                  className={`flex items-center py-2 text-center ${
                    activeTab === 'devicemonitor'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('devicemonitor')}
                >
                  <PiDevicesDuotone className="mr-1" /> Device monitor
                </button>
                {activeTab === 'devicemonitor' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="flex flex-col items-center pr-3.5 border-r dark:border-gray-700 ">
                <button
                  className={`flex items-center py-2 text-center ${
                    activeTab === 'session'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('session')}
                >
                  <SiSession className="mr-1" /> Server
                </button>
                {activeTab === 'session' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>
           

              <div className="flex flex-col items-center  pr-3.5 border-r dark:border-gray-700   ">
                <button
                  className={`flex items-center  py-2 text-center ${
                    activeTab === 'ques'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('ques')}
                >
                  <LuBookOpenText className="mr-1" /> Questions Dashboard
                </button>
                {activeTab === 'ques' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="flex flex-col items-center  pr-3.5 border-r dark:border-gray-700   ">
                <button
                  className={`flex items-center  py-2 text-center ${
                    activeTab === 'subject'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('subject')}
                >
                  <LuBookOpenText className="mr-1" /> Subjects
                </button>
                {activeTab === 'subject' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="flex flex-col items-center  pr-3.5 border-r dark:border-gray-700   ">
                <button
                  className={`flex items-center py-2 text-center ${
                    activeTab === 'classes'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('classes')}
                >
                  <LuShapes className="mr-1" /> Classes
                </button>
                {activeTab === 'classes' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>
              <div className="hidden flex-col items-center pr-3.5 border-r dark:border-gray-700   ">
                <button
                  className={`flex items-center  py-2 text-center ${
                    activeTab === 'endpoints'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('endpoints')}
                >
                  <VscServerProcess className="mr-1" /> Endpoints
                </button>
                {activeTab === '' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="hidden flex-col items-center pr-3.5  border-0 sm:border-r dark:border-gray-700  ">
                <button
                  className={`flex items-center  py-2 text-center ${
                    activeTab === 'security'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('security')}
                >
                  <MdSecurity className="mr-1" /> <div className="flex">Security</div>
                </button>
                {activeTab === 'security' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="hidden  flex-col pr-3.5 items-center border-r dark:border-gray-700  ">
                <button
                  className={`flex items-center  py-2 text-center ${
                    activeTab === 'ai'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('ai')}
                >
                  <LuSparkles className="mr-1" /> AI Security
                </button>
                {activeTab === 'ai' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>

              <div className="md:hidden lg:flex flex-col items-center   ">
                <button
                  className={`flex items-center  py-2 text-center ${
                    activeTab === 'logs'
                      ? ' border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('logs')}
                >
                  <LuLogs className="mr-1" /> Logs{' '}
                  <div className="bg-blue-600 bg-blue-400 rounded-full px-[6px] py-[1px] ml-2 text-white text-[8px] ">
                    {' '}
                    {logs.length}
                  </div>
                </button>
                {activeTab === 'logs' ? (
                  <div className=" p-[2px]  px-[10px] bg-blue-600 bg-blue-400  rounded-full"></div>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
            {activeTab === 'batch' && <FcAddDatabase className="w-4 h-4" />}
            {activeTab === 'session' && <FcAddDatabase className="w-4 h-4" />}
            {activeTab === 'subject' &&   <div className="flex space-x-2">
            <button
              onClick={() => deleteSubject(selectedSubject)}
              disabled={!selectedSubject || selectedSubject === "Subjects"}
            className="flex px-3 py-1 gap-1 bg-red-400/20 border items-center text-red-600 rounded-full hover:bg-red-300/40 disabled:opacity-50"
              title="Delete selected subject"
            >
              <MdDelete size={14} /> Delete selected subject
            </button>
            <button
              onClick={deleteAllSubjects}
              disabled={subjects.length === 0}
              className="flex px-3 py-1 gap-1 bg-red-400/20 border items-center text-red-600 rounded-full hover:bg-red-300/40 disabled:opacity-50"
              title="Delete all subjects"
            >
              <MdDelete size={14} /> Delete all subjects
            </button>
          </div>}
          {activeTab === 'classes' &&   <div className="flex space-x-2">
            <button
              onClick={() => deleteClass(selectedClass)}
              disabled={!selectedClass || selectedClass === "Classes"}
            className="flex px-3 py-1 gap-1 bg-red-400/20 border items-center text-red-600 rounded-full hover:bg-red-300/40 disabled:opacity-50"
              title="Delete selected class"
            >
              <MdDelete size={14} /> Delete selected class
            </button>
            <button
            onClick={deleteAllClasses}
            disabled={classes.length === 0}
              className="flex px-3 py-1 gap-1 bg-red-400/20 border items-center text-red-600 rounded-full hover:bg-red-300/40 disabled:opacity-50"
              title="Delete all classes"
            >
              <MdDelete size={14} /> Delete all classes
            </button>
            
          </div>}
          </div>

          <div className="py-4 px-2  rounded-b-md">
            {activeTab === 'devicemonitor' && (
              <div className="flex flex-col w-full space-y-4 text-[10px]">
                {exam === 'Updating...' ? (
                  <div className="flex items-center justify-center py-8">
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="flex flex-col w-full">
                   <DeviceMonitor/>
               </div>
                )}
              </div>
            )}
  {activeTab === 'session' && (
              <div className="flex flex-col w-full space-y-4 text-[10px]">
                {exam === 'Updating...' ? (
                  <div className="flex items-center justify-center py-8">
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="flex flex-col w-full">
                    {/* Server Name Input */}
                    <div className="w-full max-w-md space-y-2">
                      <label className="block text-gray-500 font-medium ">Server Name</label>
                      <input
                        type="text"
                        placeholder="Organization Name"
                        value={nameOrg}
                        onChange={(e) => setNameOrg(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-black dark:bg-transparent dark:border-gray-600 "
                      />
                    </div>

                    {/* Server Icon Upload */}
                    <div className="flex items-center justify-between">
                      <div className="w-full max-w-md space-y-2">
                        <label className="block text-gray-500 font-medium ">Server Icon</label>

                        {/* Hidden Input */}
                        <input
                          type="file"
                          accept="image/*"
                          id="upload-icon"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {/* Styled Upload Button */}
                        <label
                          htmlFor="upload-icon"
                          className="flex items-center w-fit gap-1 inline-block cursor-pointer px-3 py-1 bg-blue-300/20 dark:bg-blue-600/20  border border-gray-300 dark:border-gray-700 rounded-full text-blue-700 hover:bg-gray-200 transition"
                        >
                          <BiUpload /> Upload Image
                        </label>
                      </div>
                      {iconBase64 && (
                        <img
                          src={iconBase64}
                          alt="Preview"
                          className="w-20 h-20 object-contain rounded-full border"
                        />
                      )}
                    </div>

                    {/* Icon Preview */}

                    {/* Submit Button */}
                    <div className="w-full flex justify-end items-center mt-2">
                      <button
                        onClick={handleSubmit}
                        className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-600 bg-blue-400 rounded-full  hover:bg-blue-500 text-white text-[10px] transition-all shadow"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'batch' && (
              <div className="flex flex-col">
                {exam === 'Updating...' ? (
                  <div className="flex items-center space-x-4 justify-center">
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      Batch :{' '}
                      <select
                        className=" px-2 py-1 border rounded-md uppercasetext-black dark:bg-transparent dark:border-gray-600"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                      >
                        <option value="1"> BATCH 1</option>
                        <option value="2"> BATCH 2</option>
                        <option value="3"> BATCH 3</option>
                        <option value="4"> BATCH 4</option>
                        <option value="5"> BATCH 5</option>
                      </select>{' '}
                    </div>

                    <div className="flex items-center justify-between italic">
                      Current assigned batch
                      <div className="bg-blue-600 bg-blue-400 rounded-full px-[6px] py-[1px] ml-2 text-white text-[8px]  not-italic">
                        {batchNo}
                      </div>{' '}
                    </div>
                    <div className="flex items-center justify-between">
                      <div />
                      <button
                        onClick={handleUpdateBatchNo}
                        className=" py-[4px] px-[10px] rounded-md  bg-blue-600 bg-blue-400 text-white "
                      >
                        Save Changes{' '}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

{activeTab === 'ques' && (
              <div className="flex flex-col">
                {exam === 'Updating...' ? (
                  <div className="flex items-center space-x-4 justify-center">
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                <QuestionsDashboard/>
                  </div>
                )}
              </div>
            )}

{activeTab === 'subject' && (
  <div className="flex flex-col">
    {exam === 'Updating...' ? (
      <div className="flex items-center space-x-4 justify-center">
        <LoaderIcon />
      </div>
    ) : (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between font-medium w-full">
          <div className="flex items-center justify-between w-full">
            Subject :
            <Dropdown
              options={subjects.map((s) => s.name)}
              selected={selectedSubject}
              setSelected={setSelectedSubject}
              renderLabel={(name) => name}
              className="uppercase ml-2"
              buttonClassName="py-1 px-2 border rounded-md text-black dark:bg-transparent dark:border-gray-600"
              optionClassName="uppercase text-[12px]"
              maxHeight="150px"
            />
          </div>
        
        </div>
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add new subject"
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-transparent dark:border-gray-600"
          />
          <button
            onClick={addSubject}
            className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-600 bg-blue-400 rounded-full focus:bg-blue-300 hover:bg-blue-500 text-white text-[10px] transition-all shadow"
          >
            Add
          </button>
        </div>
      </div>
    )}
  </div>
)}
            {activeTab === 'classes' && (
              <div className="flex flex-col">
                {exam === 'Updating...' ? (
                  <div className="flex items-center space-x-4 justify-center">
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between font-medium">
                      Classes :{' '}
                    

<Dropdown
  options={classes.map((c) => c.name)}
  selected={selectedClass}
  setSelected={setSelectedClass}
  renderLabel={(name) => name}
  className="uppercase"
  buttonClassName="py-1 px-2 border rounded-md text-black dark:bg-transparent dark:border-gray-600"
  optionClassName="uppercase text-[12px]"
  maxHeight="150px"
/>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={newClasses}
                        onChange={(e) => setNewClasses(e.target.value)}
                        placeholder="Add new classes"
                        className=" px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400  text-gray-700 dark:bg-transparent dark:border-gray-600"
                      />
                      <button
                        onClick={addClasses}
                        className=" py-[4px] px-[10px] rounded-md  bg-blue-600 bg-blue-400 text-white "
                      >
                        Add{' '}
                      </button>
                    </div>
                  </div>
                )}{' '}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex flex-col w-full   space-y-2 border rounded-md p-2  h-2/5 overflow-y-auto">
                <div className="flex items-center justify-between border p-[4px] rounded-md bg-gray-400/20 border-gray-300 dark:border-gray-700   ">
                  {' '}
                  All Platforms{' '}
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Force fullscreen mode/Kiosk mode <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Force submit current exam <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Return a server down page <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Show user result when submit button clicked <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Disable a specific user authentication
                  <input type="checkbox" />{' '}
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Disable Timer across all devices
                  <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Show Each question answer
                  <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Redirect to authentication when submit button clicked <input type="checkbox" />{' '}
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md bg-gray-400/20 border-gray-300 dark:border-gray-700 mt-5   ">
                  {' '}
                  Desktop App Specific{' '}
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Close all applications <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Disable navigation buttons <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md bg-gray-400/20 border-gray-300 dark:border-gray-700 mt-5   ">
                  {' '}
                  Mobile App Specific{' '}
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Close all applications <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Disable navigation buttons <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between border p-[4px] rounded-md  ">
                  {' '}
                  Use device camera for cctv-security <input type="checkbox" />
                </div>
              </div>
            )}
            {activeTab === 'logs' && (
              <div className="flex flex-col">
                {exam === 'Updating...' ? (
                  <div className="flex items-center space-x-4 justify-center">
                    <LoaderIcon />
                  </div>
                ) : (
                  <div className="flex flex-col w-full p-2  border rounded max-h-[200px] sm:max-h-[300px] overflow-y-autotext-black dark:bg-transparent dark:border-gray-600">
                    <div className="flex w-full items-center justify-between">
                      Logs <div className="flex" />
                      <button
                        className="p-2 bg-red-300/20 text-red-600 rounded-full ml-2"
                        onClick={clearLogs}
                      >
                        <MdDelete />
                      </button>
                    </div>
                    <button
                      className="hidden p-2 bg-blue-500 text-white rounded-md mb-2"
                      onClick={() => log('New log entry')}
                    >
                      Add Log
                    </button>

                    <div className="mt-4 bg-white p-1 rounded border text-black dark:bg-transparent dark:border-gray-600 ">
                      {logs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-300">No logs available.</p>
                      ) : (
                        <ul className="list-disc   p-1 rounded ">
                          {logs.map((log, index) => (
                            <ul
                              key={index}
                              className=" flex text-[10px] border-t border-btext-black dark:bg-transparent dark:border-gray-600 m-1 p-[1px]"
                            >
                              {log.message}
                            </ul>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TabsComponent

/* {activeTab === "logs" && <p>logs</p>}*/
