import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../components/drag.css'
import { BiAccessibility } from 'react-icons/bi'
import toast, { LoaderIcon, Toaster } from 'react-hot-toast'
import { ImageIcon, Plus } from 'lucide-react'
const Login = () => {
  const [loa, seloa] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSignIn = async () => {
    const existingUser = await window.api.checkUser()

    if (existingUser) {
      if (existingUser.username === username && existingUser.password === password) {
        navigate('/home', { state: existingUser })
      } else {
        toast.error('Incorrect Credentials')
      }
    } else {
      await window.api.saveUser({ username, password })
      seloa(true)
      setTimeout(() => {
        navigate('/home', { state: { username, password } })
      }, 6000)
    }
  }

  return (
    <div className="non-draggable flex flex-col h-full w-full items-center justify-center relative  border-t  text-gray-400  space-y-4  ">
      <BiAccessibility />
      <div className="flex flex-col items-center justify-center  p-6 border rounded-md text-[10px] space-y-4 ">
        <Toaster />
        <p className="text-black">System Account</p>
        Welcome Please fill in the details to get started
        <div className="flex flex-col w-full space-y-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-[6px] rounded  border text-black text-[9px]"
            placeholder="Admin name"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-[6px] rounded  border text-black text-[9px] "
            placeholder="Admin password"
          />
            <input
           
            className="p-[6px] rounded  border text-black text-[9px] "
            placeholder="School name"
          />
        <button
            className="flex  w-full rounded-md px-1 py-[3px] items-center justify-start gap-x-1 border text-gray-600 hover:bg-gray-300/20 "
           
          >
         <ImageIcon className='text-gray-600' width={14} height={14}/>
          Admin profile image
          <div className='flex-1'/>
          <Plus className='text-gray-600' width={14} height={14}/>
          </button>

         <button
            className="flex  w-full rounded-md px-1 py-[3px] items-center justify-start gap-x-1 border text-gray-600 hover:bg-gray-300/20 "
           
          >
         <ImageIcon className='text-gray-600' width={14} height={14}/>
          School profile image
          <div className='flex-1'/>
          <Plus className='text-gray-600' width={14} height={14}/>
          </button>
        </div>
        {loa ? (
          <button className="flex w-full rounded-md px-1 py-2 items-center  justify-center bg-black text-white ">
            <LoaderIcon />
          </button>
        ) : (
          <button
            className="flex w-full rounded-md px-1 py-[3px] items-center  justify-center bg-blue-600 bg-blue-400 text-white hover:bg-blue-500 "
            onClick={handleSignIn}
          >
            {' '}
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

export default Login
