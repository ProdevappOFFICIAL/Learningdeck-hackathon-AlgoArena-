import { useState, useEffect } from 'react'
import axios from 'axios'
import { User, ChevronUp, ChevronDown, Users, Trash2, Edit2, AlertTriangle } from 'lucide-react'
import { FcAddDatabase, FcDeleteDatabase } from 'react-icons/fc'
import { FiMaximize } from 'react-icons/fi'
import { BiFile } from 'react-icons/bi'

function StudentList() {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [error, setError] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [no, setNo] = useState('')
  const [base64, setBase64] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showPromoteAllDialog, setShowPromoteAllDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [host, setHost] = useState('')
  const [classes, setClasses] = useState([])
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' });
  const [isProcessing, setIsProcessing] = useState(false);
      
  useEffect(() => {
    window.api.getServerInfo().then(setServerInfo);
  }, []);

  const [userData, setUserData] = useState({
    img: '',
    user_name: '',
    user_email: '',
    user_password: '',
    class_name: ''
  })

  // Define the class progression sequences - moved outside the functions for reuse
  const jsssProgression = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];
  const gradeProgression = [
    'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5',
    'GRADE 6', 'GRADE 7', 'GRADE 8', 'GRADE 9', 'GRADE 10',
    'GRADE 11', 'GRADE 12'
  ];

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setBase64(base64String)
        setUserData({
          ...userData,
          img: base64String
        })
      }
      reader.readAsDataURL(file) // Convert the file to base64
    } else {
     // toast('Please upload a valid image file.')
    }
  }

  useEffect(() => {
    async function fetchData() {
      // Only proceed if we have valid server info
      if (!serverInfo.ip || !serverInfo.port) return;
      
      try {
        // Fetch students
        const studentsResponse = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/User`)
        setStudents(studentsResponse.data)
        setNo(studentsResponse.data.length)
        setFilteredStudents(studentsResponse.data)

        // Fetch classes
        const classesResponse = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/classes`)
        setClasses(classesResponse.data)
        
        // Fetch batch information
        axios
          .get(`http://${serverInfo.ip}:${serverInfo.port}/api/Batch`)
          .then((response) => {
            const BatchData = response.data.find((hosts) => hosts.host)
            if (BatchData) {
              setHost(BatchData.host)
            }
          })
          .catch((error) => {
            //console.error("Error with Batch number", error);
          })
      } catch (err) {
        setError('Failed to fetch data. Please try again.')
      }
    }
    
    fetchData()
  }, [serverInfo.ip, serverInfo.port]) // Add serverInfo as dependencies

  const onTextFieldChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    })
  }

  const handleClassChange = (e) => {
    const selected = e.target.value
    setSelectedClass(selected)
    setFilteredStudents(
      selected ? students.filter((student) => student.class_name === selected) : students
    )
  }

  const handleClassSelectChange = (e) => {
    setUserData({
      ...userData,
      class_name: e.target.value
    })
  }

  const handleSignupOrUpdate = async () => {
    try {
      if (!serverInfo.ip || !serverInfo.port) {
        //toast('Server info not available.')
        return
      }

      if (isEdit) {
        await axios.put(`http://${serverInfo.ip}:${serverInfo.port}/api/User/${userData.id}`, userData) // Update by `id`
      //  toast('Student details updated.')
      } else {
        // Set the new ID based on the current total count of students
        const newId = students.length + 1
        const newStudent = { ...userData, id: newId.toString() }

        await axios.post(`http://${serverInfo.ip}:${serverInfo.port}/api/User`, newStudent) // Add new student
       // toast('New student added.')
      }
      setIsEdit(false)
      setUserData({
        img: '',
        user_name: '',
        user_email: '',
        user_password: '',
        class_name: ''
      })
      setBase64(null)
      setShowAddDialog(false)

      // Refresh student list
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/User`)
      setStudents(response.data)
      setFilteredStudents(
        selectedClass
          ? response.data.filter((student) => student.class_name === selectedClass)
          : response.data
      )
    } catch (error) {
      console.error('Error adding or updating student:', error) // Log full error details
      //toast('Error adding or updating student.')
    }
  }

  const handleEditClick = (student) => {
    setUserData(student)
    setBase64(student.img)
    setIsEdit(true)
    setShowAddDialog(true)
  }

  const handleDeleteClick = (student) => {
    setStudentToDelete(student)
    setShowDeleteConfirmDialog(true)
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete || !serverInfo.ip || !serverInfo.port) return;
    
    try {
      await axios.delete(`http://${serverInfo.ip}:${serverInfo.port}/api/User/${studentToDelete.id}`);
      
      // Update state to reflect the deletion
      const updatedStudents = students.filter(s => s.id !== studentToDelete.id);
      setStudents(updatedStudents);
      setFilteredStudents(
        selectedClass
          ? updatedStudents.filter((s) => s.class_name === selectedClass)
          : updatedStudents
      );
      
      setShowDeleteConfirmDialog(false);
      setStudentToDelete(null);
      // toast('Student deleted successfully.');
    } catch (error) {
      console.error('Error deleting student:', error);
      // toast('Failed to delete student.');
    }
  }
  
  const handleDeleteAllStudents = () => {
    setShowDeleteAllDialog(true);
  }
  
  const confirmDeleteAllStudents = async () => {
    setIsProcessing(true);
    try {
      const studentsToDelete = selectedClass 
        ? students.filter(student => student.class_name === selectedClass)
        : students;
      
      // Delete students in sequence
      for (const student of studentsToDelete) {
        try {
          await axios.delete(`http://${serverInfo.ip}:${serverInfo.port}/api/User/${student.id}`);
        } catch (error) {
          console.error(`Error deleting student ID ${student.id}:`, error);
        }
      }
      
      // Refresh student list
      const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/User`);
      setStudents(response.data);
      setFilteredStudents(
        selectedClass
          ? response.data.filter((student) => student.class_name === selectedClass)
          : response.data
      );
      
      // toast(`Deleted ${studentsToDelete.length} students successfully.`);
    } catch (error) {
      console.error('Error in bulk deletion:', error);
      // toast('Error during bulk deletion.');
    } finally {
      setIsProcessing(false);
      setShowDeleteAllDialog(false);
    }
  }

  const showImage = (imageUrl) => {
    setCurrentImageUrl(imageUrl)
    setShowImageDialog(true)
  }

  // Helper function to get the next class in progression
  const getNextClass = (currentClass) => {
    // Standardize the class format for comparison
    const classUpper = currentClass.toUpperCase();
    
    // Determine which progression to use
    let progressionArray = (classUpper.includes('JS') || classUpper.includes('SS')) 
      ? jsssProgression 
      : gradeProgression;
    
    const currentIndex = progressionArray.findIndex(c => c === classUpper);
    
    // If class found in the progression and not at the maximum level
    if (currentIndex !== -1 && currentIndex < progressionArray.length - 1) {
      return progressionArray[currentIndex + 1];
    }
    
    return null; // No next class available
  };

  // Helper function to get the previous class in progression
  const getPrevClass = (currentClass) => {
    // Standardize the class format for comparison
    const classUpper = currentClass.toUpperCase();
    
    // Determine which progression to use
    let progressionArray = (classUpper.includes('JS') || classUpper.includes('SS')) 
      ? jsssProgression 
      : gradeProgression;
    
    const currentIndex = progressionArray.findIndex(c => c === classUpper);
    
    // If class found in the progression and not at the minimum level
    if (currentIndex > 0) {
      return progressionArray[currentIndex - 1];
    }
    
    return null; // No previous class available
  };

  // Function to promote student to next class


  // Function to demote student to previous class
  const demoteClass = async (student) => {
    const prevClass = getPrevClass(student.class_name);
    
    if (prevClass) {
      try {
        // Update student's class in the database
        const updatedStudent = { ...student, class_name: prevClass };
        await axios.put(`http://${serverInfo.ip}:${serverInfo.port}/api/User/${student.id}`, updatedStudent);
        
        // Update state to reflect changes without requiring full page refresh
        const updatedStudents = students.map(s => 
          s.id === student.id ? updatedStudent : s
        );
        setStudents(updatedStudents);
        setFilteredStudents(
          selectedClass
            ? updatedStudents.filter((s) => s.class_name === selectedClass)
            : updatedStudents
        );
        
        // toast('Student demoted successfully.');
      } catch (error) {
        console.error('Error demoting student:', error);
        // toast('Failed to demote student.');
      }
    } else {
      // toast('Student already at minimum class level or invalid class.');
    }
  };

// Modify the getNextClass and promoteClass functions

// Add a new state for tracking class creation dialog
const [showCreateClassDialog, setShowCreateClassDialog] = useState(false);
const [classToCreate, setClassToCreate] = useState('');

// Function to promote student to next class
const promoteClass = async (student) => {
  const nextClass = getNextClass(student.class_name);
  
  if (nextClass) {
    // Check if the class exists in the system
    const classExists = classes.some(cls => cls.name.toUpperCase() === nextClass.toUpperCase());
    
    if (!classExists) {
      // Class doesn't exist - ask if user wants to create it
      setClassToCreate(nextClass);
      setShowCreateClassDialog(true);
      return;
    }
    
    try {
      // Update student's class in the database
      const updatedStudent = { ...student, class_name: nextClass };
      await axios.put(`http://${serverInfo.ip}:${serverInfo.port}/api/User/${student.id}`, updatedStudent);
      
      // Update state to reflect changes without requiring full page refresh
      const updatedStudents = students.map(s => 
        s.id === student.id ? updatedStudent : s
      );
      setStudents(updatedStudents);
      setFilteredStudents(
        selectedClass
          ? updatedStudents.filter((s) => s.class_name === selectedClass)
          : updatedStudents
      );
      
      // toast('Student promoted successfully.');
    } catch (error) {
      console.error('Error promoting student:', error);
      // toast('Failed to promote student.');
    }
  } else {
    // toast('Student already at maximum class level or invalid class.');
  }
};

// Function to bulk promote all students with class existence check
const promoteAllStudents = async () => {
  setIsProcessing(true);
  try {
    let studentsToUpdate = selectedClass 
      ? students.filter(student => student.class_name === selectedClass)
      : students;
    
    // First check if all target classes exist
    const targetClasses = new Set();
    const missingClasses = [];
    
    studentsToUpdate.forEach(student => {
      const nextClass = getNextClass(student.class_name);
      if (nextClass) {
        targetClasses.add(nextClass);
        
        // Check if this class exists in the system
        const classExists = classes.some(cls => cls.name.toUpperCase() === nextClass.toUpperCase());
        if (!classExists && !missingClasses.includes(nextClass)) {
          missingClasses.push(nextClass);
        }
      }
    });
    
    // If we have missing classes, ask user if they want to create them
    if (missingClasses.length > 0) {
      setIsProcessing(false);
      // Show dialog or confirm to create missing classes
      if (confirm(`The following classes need to be created: ${missingClasses.join(', ')}. Would you like to create them?`)) {
        // Logic to create multiple classes
        for (const className of missingClasses) {
          try {
            await createNewClass(className);
          } catch (error) {
            console.error(`Error creating class ${className}:`, error);
          }
        }
        // Reload classes
        const classesResponse = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/classes`);
        setClasses(classesResponse.data);
        // Continue with promotion after classes are created
        promoteAllStudents();
        return;
      } else {
        // User declined to create classes
        setShowPromoteAllDialog(false);
        return;
      }
    }
    
    let updateCount = 0;
    let skipCount = 0;
    
    // Process students in batches to prevent overwhelming the server
    for (const student of studentsToUpdate) {
      const nextClass = getNextClass(student.class_name);
      
      if (nextClass) {
        try {
          const updatedStudent = { ...student, class_name: nextClass };
          await axios.put(`http://${serverInfo.ip}:${serverInfo.port}/api/User/${student.id}`, updatedStudent);
          updateCount++;
        } catch (error) {
          console.error(`Error promoting student ID ${student.id}:`, error);
        }
      } else {
        skipCount++;
      }
    }
    
    // Refresh student list after bulk update
    const response = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/User`);
    setStudents(response.data);
    setFilteredStudents(
      selectedClass
        ? response.data.filter((student) => student.class_name === selectedClass)
        : response.data
    );
    
    // toast(`Promoted ${updateCount} students. ${skipCount} students skipped (already at maximum level).`);
  } catch (error) {
    console.error('Error in bulk promotion:', error);
    // toast('Error during bulk promotion.');
  } finally {
    setIsProcessing(false);
    setShowPromoteAllDialog(false);
  }
};

// Function to create a new class
const createNewClass = async (className) => {
  try {
    // Generate a new ID based on existing classes
    const newId = classes.length > 0 
      ? Math.max(...classes.map(c => parseInt(c.id))) + 1 
      : 1;
      
    const newClass = {
      id: newId.toString(),
      name: className,
      // Add any other required fields for your class API
    };
    
    await axios.post(`http://${serverInfo.ip}:${serverInfo.port}/api/classes`, newClass);
    
    // Refresh classes list
    const classesResponse = await axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/classes`);
    setClasses(classesResponse.data);
    
    // toast(`Class ${className} created successfully.`);
    return true;
  } catch (error) {
    console.error('Error creating class:', error);
    // toast(`Failed to create class ${className}.`);
    return false;
  }
};

// Function to handle class creation from dialog
const handleCreateClass = async () => {
  const success = await createNewClass(classToCreate);
  setShowCreateClassDialog(false);
  
  if (success) {
    // Find the student we were trying to promote
    // This assumes we're working with a single student when this dialog appears
    const studentToPromote = students.find(s => getNextClass(s.class_name) === classToCreate);
    if (studentToPromote) {
      // Try promoting again now that the class exists
      promoteClass(studentToPromote);
    }
  }
};

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      <div className="flex items-center justify-between border-b p-3">
        <span className="text-gray-800 dark:text-white">Student</span>
        <div className="flex items-center space-x-2">
          <select
            id="classSelect"
            value={selectedClass}
            onChange={handleClassChange}
            className="p-1 text-[10px] border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name.toUpperCase()}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200">
            <Trash2 
              size={16}
              onClick={handleDeleteAllStudents}
              className="cursor-pointer text-red-500"
              title="Delete All Students"
            />
            <FcAddDatabase
              onClick={() => {
                setIsEdit(false)
                setUserData({
                  img: '',
                  user_name: '',
                  user_email: '',
                  user_password: '',
                  class_name: ''
                })
                setBase64(null)
                setShowAddDialog(true)
              }}
              className="cursor-pointer"
              title="Add New Student"
            />
            <Users 
              size={16}
              onClick={() => setShowPromoteAllDialog(true)}
              className="cursor-pointer ml-2 text-blue-500"
              title="Promote All Students"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-full py-2 overflow-x-auto text-[10px]">
      <div className="bg-white dark:bg-gray-900 dark:bg-gray-950 w-full">
          <div className="relative w-full overflow-auto">
          <table className="min-w-full">
            <thead className="text-gray-600 dark:bg-gray-900">
              <tr className="rounded-t-lg">
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Passport</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Name</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Email</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Classname</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Password</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Class Level</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((data) => (
                  <tr
                    key={data.id}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="w-16 py-1 px-1 border-b">
                      <div
                        className="rounded-full p-1 cursor-pointer flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent triggering row click
                          showImage(data.img)
                        }}
                      >
                        {data.img ? (
                          <img src={data.img} alt="Student" className="w-6 h-6 rounded-full" />
                        ) : (
                          <User size={12} />
                        )}
                      </div>
                    </td>
                    <td className="w-1/6 py-1 px-1 border-b truncate">{data.user_name}</td>
                    <td className="w-1/6 py-1 px-1 border-b truncate">{data.user_email}</td>
                    <td className="w-1/6 py-1 px-1 border-b uppercase truncate">{data.class_name}</td>
                    <td className="w-1/6 py-1 px-1 border-b truncate">{data.user_password}</td>
                    <td className="w-1/6 py-1 px-1 border-b">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            promoteClass(data);
                          }}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                          title="Promote to next class"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            demoteClass(data);
                          }}
                          className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center justify-center"
                          title="Demote to previous class"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="w-1/6 py-1 px-1 border-b">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(data);
                          }}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                          title="Edit student"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(data);
                          }}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                          title="Delete student"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-2">
                    No students to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
   <div className="flex lg:hidden items-center justify-center w-full h-full text-gray-600 text-[10px]">
      <FiMaximize className="mr-1"/>  Maximize the window to view full table details
    </div>
      {/* Add/Edit Student Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-900 rounded max-w-md w-full max-h-[90vh] overflow-y-auto text-[10px]">
          <div className="flex justify-between items-center mb-3 border-b p-2 bg-gray-300/20">
              <h2 className="text-[10px]">{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[10px] p-4">
              <div className="flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-center gap-3">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-600 bg-gray-100 flex items-center justify-center">
                    {base64 ? (
                      <img src={base64} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} />
                    )}
                  </div>
                </div>
              </div>

              <div className='flex flex-col w-full bg-gray-300/20 border p-2 rounded-md'>
                <label className="block mb-1" htmlFor="name">
                  Student Passport
                </label>
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 bg-blue-400 flex items-center gap-1"
                  >
                  <BiFile size={12} />
                    <span>Choose Image</span>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    id="file-upload"
                    className="hidden"
                    onChange={handleImageChange}
                  />
              </div>

              <div className='flex flex-col w-full bg-gray-300/20 border p-2 rounded-md'>
                <label className="block mb-1" htmlFor="name">
                 Student Name
                </label>
                <input
                  className="w-full p-1 border rounded"
                  type="text"
                  name="user_name"
                  value={userData.user_name}
                  onChange={onTextFieldChange}
                  required
                />
              </div>

              <div className='flex flex-col w-full bg-gray-300/20 border p-2 rounded-md'>
                <label className="block mb-1" htmlFor="email">
                  Student Admission Number
                </label>
                <input
                  className="w-full p-1 border rounded"
                  type="text"
                  name="user_email"
                  value={userData.user_email}
                  onChange={onTextFieldChange}
                  required
                />
              </div>

              <div className='flex flex-col w-full bg-gray-300/20 border p-2 rounded-md'>
                <label className="block mb-1" htmlFor="password">
                  Student Password
                </label>
                <input
                  className="w-full p-1 border rounded"
                  type="text"
                  name="user_password"
                  value={userData.user_password}
                  onChange={onTextFieldChange}
                  required
                />
              </div>

              <div className='flex flex-col w-full bg-gray-300/20 border p-2 rounded-md'>
                <label className="block mb-1">Student Class</label>
                <select
                  name="class_name"
                  value={userData.class_name}
                  onChange={handleClassSelectChange}
                  className="p-1 border rounded w-full"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-3 py-1 bg-gray-300/20 border rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignupOrUpdate}
                  className="px-3 py-1 bg-blue-600 bg-blue-400 text-white rounded hover:bg-blue-700"
                >
                  {isEdit ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmDialog && studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-900 rounded max-w-md w-full text-[10px]">
            <div className="flex justify-between items-center mb-3 border-b p-2 bg-red-100 dark:bg-red-900/20">
              <h2 className="text-[10px] flex items-center">
                <AlertTriangle size={14} className="text-red-500 mr-2" />
                Confirm Delete
              </h2>
              <button
                onClick={() => {
                  setShowDeleteConfirmDialog(false)
                  setStudentToDelete(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="mb-4">
                Are you sure you want to delete student "{studentToDelete.user_name}" from {studentToDelete.class_name.toUpperCase()}?
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirmDialog(false)
                    setStudentToDelete(null)
                  }}
                  className="px-3 py-1 bg-gray-300/20 border rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStudent}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Students Dialog */}
      {showDeleteAllDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-900 rounded max-w-md w-full text-[10px]">
            <div className="flex justify-between items-center mb-3 border-b p-2 bg-red-100 dark:bg-red-900/20">
              <h2 className="text-[10px] flex items-center">
                <AlertTriangle size={14} className="text-red-500 mr-2" />
                Confirm Delete All Students
              </h2>
              <button
                onClick={() => setShowDeleteAllDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="mb-4">
                <span className="font-bold text-red-500">WARNING:</span> This will delete {selectedClass ? `all students in ${selectedClass.toUpperCase()}` : 'ALL students'}.
                This action cannot be undone and will permanently remove {selectedClass ? `all students in ${selectedClass.toUpperCase()}` : 'all students'} from the system.
              </p>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowDeleteAllDialog(false)}
                  className="px-3 py-1 bg-gray-300/20 border rounded hover:bg-gray-400"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAllStudents}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Delete All Students'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
          <div className="bg-transparent border-none text-white">
            <div className="flex justify-end mb-2">
              <button onClick={() => setShowImageDialog(false)} className="text-white text-xl">
                ✕
              </button>
            </div>
            <div className="mt-5">
              {currentImageUrl && (
                <img
                  alt="Student image"
                  className="rounded-full border-2 border-blue-600 max-h-64 max-w-64"
                  src={currentImageUrl}
                />
              )}
            </div>
          </div>
        </div>
      )}

{/* Create Class Dialog */}
{showCreateClassDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
    <div className="bg-white dark:bg-gray-900 rounded max-w-md w-full text-[10px]">
      <div className="flex justify-between items-center mb-3 border-b p-2 bg-blue-100 dark:bg-blue-900/20">
        <h2 className="text-[10px] flex items-center">
          Create New Class
        </h2>
        <button
          onClick={() => setShowCreateClassDialog(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <p className="mb-4">
          The class <span className="font-bold">{classToCreate}</span> doesn't exist in the system. 
          Would you like to create it?
        </p>
        
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={() => setShowCreateClassDialog(false)}
            className="px-3 py-1 bg-gray-300/20 border rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateClass}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
          >
            Create Class
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Promote All Students Dialog */}
      {showPromoteAllDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-900 rounded max-w-md w-full text-[10px]">
            <div className="flex justify-between items-center mb-3 border-b p-2 bg-gray-300/20">
              <h2 className="text-[10px]">Promote All Students</h2>
              <button
                onClick={() => setShowPromoteAllDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="mb-4">
                This will promote {selectedClass ? `all students in ${selectedClass.toUpperCase()}` : 'all students'} to their next class level.
                {selectedClass ? '' : ' You can filter by class first if you want to promote only specific classes.'}
              </p>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowPromoteAllDialog(false)}
                  className="px-3 py-1 bg-gray-300/20 border rounded hover:bg-gray-400"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={promoteAllStudents}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Promotion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList