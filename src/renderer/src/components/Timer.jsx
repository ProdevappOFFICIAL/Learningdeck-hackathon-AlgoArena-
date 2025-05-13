import { useState, useEffect } from "react";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 5 * 60 * 1000 + 2000;

export default function Timer() {
  const [timeLeft, setTimeLeft] = useState(FIVE_DAYS_MS);

  // Load the saved time when the component mounts
  useEffect(() => {
    async function loadTimer() {
      const savedData = await window.api.getTimer();
      const elapsed = Date.now() - savedData.lastSaved;
      const newTime = Math.max(savedData.remainingTime - elapsed, 0);
      setTimeLeft(newTime);
    }
    loadTimer();
  }, []);

  // Update timer every second
  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(prev - 1000, 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  // Save timer every 10 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      window.api.saveTimer(timeLeft);
    }, 10000);
    return () => clearInterval(saveInterval);
  }, [timeLeft]);

  const formatTime = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
   
      <p className="flex justify-between items-center text-[8px] space-x-2 ">
        <p className="p-[5px] bg-blue-600 bg-blue-400 rounded text-white">10D</p><p>:</p>
        <p  className="p-[5px] bg-blue-600 bg-blue-400 rounded text-white">24H</p><p>:</p>
        <p  className="p-[5px] bg-blue-600 bg-blue-400 rounded text-white">24H</p><p>:</p>
        <p  className="p-[5px] bg-blue-600 bg-blue-400 rounded text-white">60M</p><p>:</p>
        <p  className="p-[5px] bg-blue-600 bg-blue-400 rounded text-white">00S</p>
      </p>
   
  );
}

/*     {exam === 'Updating...' ? (
        <Dialog
          title="Local server configuration"
          onClose={HanCX}
          im={<FiSettings />}
          children={
            <div className="flex flex-col  border-t text-[10px] px-3 ">
              <div className="flex flex-col text-[10px] ">
 
                <div className="hidden w-full items-center justify-between p-2 ">
                  {' '}
                  SERVER-DEVICE:{' '}
                
                  <p
                  className="flex items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                   
                  >
                    MY COMPUTER <BiLock className='ml-1 text-[12px]'/>
                  </p>
                  
                </div>
                <div className="flex flex-col">
                <div className="flex w-full items-center justify-between p-2 ">
                  {' '}
                  SERVER-DEVICE:{' '}
            <select
                 className="flex items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
               
                value={selectedIP}
                onChange={e => setSelectedIP(e.target.value)}
            >
                {ips.map(ip => (
                    <option key={ip} value={ip}>{ip}</option>
                ))}
            </select>
</div>
<div className="flex w-full items-center justify-between p-2 ">
                  {' '}
                  SERVER-PORT:{' '}
            <input
                type="number"
                className=" w-11 items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
               
                value={port}
                onChange={e => setPort(parseInt(e.target.value))}
            />
            </div>

         
        </div>
                <div className="flex w-full items-center justify-between p-2 ">
                  {' '}
                  SERVER_NAME:{' '}
                  <p
                  className="px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                   
                  >
                    NEW_EXAMS_SERVER
                  </p>
                </div>
                <div className="flex w-full items-center justify-between p-2 ">
                  {' '}
                WEB_DIRECTORY
                
                  <div    onClick={importFolder} className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200 text-[10px]">
                  Select a folder
                </div>
                </div>
                <div className="hidden w-full items-center justify-between p-2 ">
                  {' '}
                  SERVER PASSWORD:{' '}
                  <input className="text-gray-600 p-1 rounded  border" defaultValue={'3000'} />
                </div>
                <div className="hidden w-full items-center justify-between p-2 ">
                  {' '}
                  PORT:{' '}
                  <input
                    className="text-gray-600 p-1 rounded  border"
                    defaultValue={'80 0R 4040'}
                    disabled={true}
                  />
                </div>

                <div className="hidden w-full items-center justify-between p-2 ">
                  ADVANCED SETTINGS : <input type="checkbox" onClick={()=> setActive(!active)} />
                </div>
                {active?(<div className="flex flex-col w-full items-center bg-gray-300/20 rounded-md border">

                <div className="flex w-full items-center justify-between p-2 ">
                  EXPOSE_API : <input type="checkbox" checked />
                </div>
                <div className="flex w-full justify-between p-2">
                  EXPOSED_API_URL : <input className="text-gray-600 p-1 rounded  border" />
                </div>
                </div>):(<div></div>)}

        

                <div className="flex w-full justify-between  pt-[10px]  ">
                  {' '}
                  <div></div>
                  <div className="flex space-x-2">
                    {loading ? (
                      <div
                        className="flex items-center px-2 py-1 rounded  border text-[10px] bg-blue-600 bg-blue-400 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                        onClick={HanP}
                      >
                        <LoaderIcon color="white" />
                      </div>
                    ) : (
                      <div
                        className="flex px-2 py-1 rounded  border text-[10px] bg-blue-600 bg-blue-400 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                        onClick={HanP}
                      >
                        START SERVER{' '}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full justify-between  pt-[10px]  ">
                {' '}
                <div></div>
                <div className="flex space-x-2">
                  <div
                    onClick={HanCX}
                    className=" hidden px-2 py-1 rounded border text-[10px] bg-zinc-600 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                  >
                    IMPORT{' '}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      ) : (
        <div></div>
      )}
        
      
      
      
      
      
      
      
      import { useState, useEffect } from 'react'
      import {
        BsArrowRight,
        BsCloudDownload,
        BsDownload,
        BsGearWideConnected,
        BsInfoCircle
      } from 'react-icons/bs'
      import { FiSettings } from 'react-icons/fi'
      import Dialog from '../components/dailog'
      import {
        BiChevronRight,
        BiCopy,
        BiImport,
        BiLoader,
        BiLock,
        BiMoon,
        BiServer,
        BiVideoOff,
        BiWifi,
        BiWifiOff,
        BiX
      } from 'react-icons/bi'
      import axios from 'axios'
      import toast, { LoaderIcon, Toaster } from 'react-hot-toast'
      import { SiJson, SiServerless, SiTether } from 'react-icons/si'
      import { LuDatabaseBackup, LuFileJson, LuNetwork, LuServerOff } from 'react-icons/lu'
      import TabsComponent from '../components/tabs'
      import { motion } from 'framer-motion'
      import useLogger from '../hook/useLogger'
      import { MdCloudSync, MdOutlineCloudSync, MdSync } from 'react-icons/md'
      import { VscAccount } from 'react-icons/vsc'
      import { FcGoogle } from 'react-icons/fc'
      import Timer from '../components/Timer'
      import Carousel from '../components/carousel'
      import { Lock } from 'lucide-react'
      
      const Dash = () => {
        const [op, seop] = useState(false)
        const [opp, seopp] = useState(false)
        const [exam, setExam] = useState('Updating...')
        const [question, setQuestion] = useState('Updating...')
        const [user, setUser] = useState('Updating...')
        const { log } = useLogger()
        const [message, setMessage] = useState('')
        const [use, setUse] = useState({ username: '', password: '' })
        const [active, setActive] = useState(false)
        const [loading, setLoading] = useState(true)
      
        // Server Info State
        const [serverInfo, setServerInfo] = useState({ ip: '', port: '' });
        const [serverInfoLoaded, setServerInfoLoaded] = useState(false);
      
        // Get server info when component mounts
        useEffect(() => {
          const fetchServerInfo = async () => {
            try {
              const info = await window.api.getServerInfo();
              setServerInfo(info);
              setServerInfoLoaded(true);
            } catch (error) {
              console.error('Error fetching server info:', error);
            }
          };
          
          fetchServerInfo();
        }, []);
      
        const [serverUrl, setServerUrl] = useState(null);
        const [ips, setIps] = useState([]);
        const [selectedIP, setSelectedIP] = useState('localhost');
        const [port, setPort] = useState(3000);
      
        const importFolder = async () => {
          const url = await window.api.selectFolder();
          if (url) setServerUrl(url);
        };
      
        useEffect(() => {
          // Fetch available local network IPs
          window.api.getLocalIPs().then(setIps);
      
          // Get previously selected IP and port
          window.api.getServerInfo().then(({ ip, port }) => {
            setSelectedIP(ip);
            setPort(port);
          });
        }, []);
      
        useEffect(() => {
          const fetchUser = async () => {
            const data = await window.api.checkUser()
            if (data) {
              setUse(data)
            }
          }
          fetchUser()
        }, [])
        
        const importDatabase = async () => {
          log(`${new Date().toLocaleTimeString()}  Importing Database...`)
          const result = await window.api.ipcRenderer.invoke('import-db')
          setMessage(result.message)
          log(`${new Date().toLocaleTimeString()}  ${result.message}`)
          window.location.reload()
          // toast(result.message)
        }
        
        const HanC = () => {
          seopp(true)
        }
        
        const HanCX = () => {
          seopp(false)
        }
      
      
      
        // Replace the current useEffect for fetching dashboard data with this
      useEffect(() => {
        const fetchData = async () => {
          try {
            // Only proceed if serverInfo is loaded
            if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
              return; // Exit early if server info isn't ready
            }
            
            setExam('Updating...');
            setQuestion('Updating...');
            setUser('Updating...');
            
            const [examResponse, questionResponse, userResponse] = await Promise.all([
              axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`),
              axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/Question`),
              axios.get(`http://${serverInfo.ip}:${serverInfo.port}/api/User`)
            ]);
            
            setExam(examResponse.data.length);
            setQuestion(questionResponse.data.length);
            setUser(userResponse.data.length);
          } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setExam('Error');
            setQuestion('Error');
            setUser('Error');
          }
        };
        
        fetchData();
      }, [serverInfoLoaded, serverInfo]);
      
      
        const [nameOrg, setNameOrg] = useState("");
        const [iconBase64, setIconBase64] = useState("");
        const [isUpdating, setIsUpdating] = useState(false);
        const [status, setStatus] = useState("");
        const [isEditing, setIsEditing] = useState(false);
      
        const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Information`;
      
        useEffect(() => {
          const fetchData = async () => {
            try {
              const res = await fetch(API_URL);
              if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                  const firstData = data[0];
                  setNameOrg(firstData.name_org);
                  setIconBase64(firstData.icon);
                  setIsUpdating(true);
                }
              }
            } catch (error) {
              console.error("Error fetching data:", error);
            }
          };
          fetchData();
        }, []);
      
        const handleFileChange = (e) => {
          if (!isEditing) return;
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => setIconBase64(reader.result);
          file && reader.readAsDataURL(file);
        };
      
        const handleSubmit = async () => {
          if (!serverInfoLoaded || !serverInfo.ip || !serverInfo.port) {
            setStatus("❌ Server information not loaded");
            return;
          }
          
          const API_URL = `http://${serverInfo.ip}:${serverInfo.port}/api/Information`;
          const payload = {
            id: 1,
            name_org: nameOrg,
            icon: iconBase64,
          };
        
          try {
            setStatus("Saving...");
            const res = await fetch(`${API_URL}/${isUpdating ? "1" : ""}`, {
              method: isUpdating ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
        
            if (res.ok) {
              setStatus(`✅ ${isUpdating ? "Updated!" : "Added!"}`);
              setIsUpdating(true);
              setIsEditing(false);
            } else {
              setStatus("❌ Failed to save");
            }
          } catch (error) {
            console.error("Error:", error);
            setStatus("❌ Error saving");
          }
        };
        const HanP = () => {
          setLoading(true)
          window.api.sendServerInfo(selectedIP, port);
          setTimeout(() => {
            window.api.startServer()
            window.location.reload()
          }, 1000); // Added timeout value
        }
      
      
        return (
          <div className="flex flex-col w-full h-full   bg-white dark:bg-gray-900 dark:bg-black">
            <div className="flex items-center justify-between border-b p-3 ">
              Welcome back, {use.username}
              <div className="flex items-center space-x-2 text-[10px]">
              
                <div className="hidden sm:flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border cursor-pointer border-zinc-300 dark:text-zinc-200 text-[10px]">
                  <FcGoogle className="mr-1" /> Sign in with google
                </div>
                <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-2 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200">
                  <LuDatabaseBackup onClick={HanC} />
              
                </div>
              </div>
            </div>
            {!serverInfoLoaded ? (
            <div className="flex items-center justify-center h-screen">
              <div className="flex flex-col items-center space-y-4">
                <BiLoader className="animate-spin text-4xl text-blue-500" />
                <p>Loading server information...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end  w-full space-y-4 text-[10px]">
                    <div className="flex w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER-NAME:{' '}
                      
                       
                          <input
                type="text"
                placeholder="Organization Name"
                value={nameOrg}
                onChange={(e) => setNameOrg(e.target.value)}
                className="flex max-w-sm w-full items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                         
              />
                      </div>
                      <div className="flex w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER-ICON:{' '}
                      
                    
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex max-w-sm w-full items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                     
              />
                        
                      </div>
            
      
      
              {iconBase64 && (
                <img
                  src={iconBase64}
                  alt="Preview"
                  className="w-20 h-20 object-contain rounded-full"
                />
              )}
      
              <button
                onClick={handleSubmit}
                className="flex w-fit items-end justify-end bg-blue-600 bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 mx-4 rounded-md transition text-[10px]"
              >
                Update Info {status && <LoaderIcon className='ml-2'/>}
              </button>
      
              
            </div>
        
              )}
      
      <div className="flex flex-col  border-t text-[10px] px-3 ">
                    <div className="flex flex-col text-[10px] ">
       
                      <div className="hidden w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER-DEVICE:{' '}
                      
                        <p
                        className="flex items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                         
                        >
                          MY COMPUTER <BiLock className='ml-1 text-[12px]'/>
                        </p>
                        
                      </div>
                      <div className="flex flex-col">
                      <div className="flex w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER-DEVICE:{' '}
                  <select
                       className="flex items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                     
                      value={selectedIP}
                      onChange={e => setSelectedIP(e.target.value)}
                  >
                      {ips.map(ip => (
                          <option key={ip} value={ip}>{ip}</option>
                      ))}
                  </select>
      </div>
      <div className="flex w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER-PORT:{' '}
                  <input
                      type="number"
                      className=" w-11 items-center px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                     
                      value={port}
                      onChange={e => setPort(parseInt(e.target.value))}
                  />
                  </div>
      
               
              </div>
                      <div className="flex w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER_NAME:{' '}
                        <p
                        className="px-2 py-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-500"
                         
                        >
                          NEW_EXAMS_SERVER
                        </p>
                      </div>
                      <div className="flex w-full items-center justify-between p-2 ">
                        {' '}
                      WEB_DIRECTORY
                      
                        <div    onClick={importFolder} className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200 text-[10px]">
                        Select a folder
                      </div>
                      </div>
                      <div className="hidden w-full items-center justify-between p-2 ">
                        {' '}
                        SERVER PASSWORD:{' '}
                        <input className="text-gray-600 p-1 rounded  border" defaultValue={'3000'} />
                      </div>
                      <div className="hidden w-full items-center justify-between p-2 ">
                        {' '}
                        PORT:{' '}
                        <input
                          className="text-gray-600 p-1 rounded  border"
                          defaultValue={'80 0R 4040'}
                          disabled={true}
                        />
                      </div>
      
                      <div className="hidden w-full items-center justify-between p-2 ">
                        ADVANCED SETTINGS : <input type="checkbox" onClick={()=> setActive(!active)} />
                      </div>
                      {active?(<div className="flex flex-col w-full items-center bg-gray-300/20 rounded-md border">
      
                      <div className="flex w-full items-center justify-between p-2 ">
                        EXPOSE_API : <input type="checkbox" checked />
                      </div>
                      <div className="flex w-full justify-between p-2">
                        EXPOSED_API_URL : <input className="text-gray-600 p-1 rounded  border" />
                      </div>
                      </div>):(<div></div>)}
      
              
      
                      <div className="flex w-full justify-between  pt-[10px]  ">
                        {' '}
                        <div></div>
                        <div className="flex space-x-2">
                          {loading ? (
                            <div
                              className="flex items-center px-2 py-1 rounded  border text-[10px] bg-blue-600 bg-blue-400 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                              onClick={HanP}
                            >
                              <LoaderIcon color="white" />
                            </div>
                          ) : (
                            <div
                              className="flex px-2 py-1 rounded  border text-[10px] bg-blue-600 bg-blue-400 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                              onClick={HanP}
                            >
                              START SERVER{' '}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
      
                    <div className="flex w-full justify-between  pt-[10px]  ">
                      {' '}
                      <div></div>
                      <div className="flex space-x-2">
                        <div
                          onClick={HanCX}
                          className=" hidden px-2 py-1 rounded border text-[10px] bg-zinc-600 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                        >
                          IMPORT{' '}
                        </div>
                      </div>
                    </div>
                  </div>
        
            {opp && (
              <Dialog
                title="Import Local DB"
                onClose={HanCX}
                im={<FiSettings />}
                children={
                  <div className="flex flex-col bg-zinc-300/20 border-t text-[10px] p-3">
                    <div className="flex flex-col items-center justify-center ">
                      <LuFileJson
                        onClick={importDatabase}
                        width={60}
                        height={60}
                        className=" w-10 h-10"
                      />
                      {message && <p className="mt-3 text-gray-700">{message}</p>}
                    </div>
      
                    <div className="flex w-full justify-between  pt-[10px]  ">
                      {' '}
                      <div></div>
                      <div className="flex space-x-2">
                        <div
                          onClick={HanCX}
                          className=" hidden px-2 py-1 rounded border text-[10px] bg-zinc-600 text-white hover:border-white hover:border-[1px] hover:cursor-pointer "
                        >
                          IMPORT{' '}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            )}
      
      
            <div className=" flex  space-x-4 justify-between items-center p-3 ">
              <motion.div
                className="flex flex-col w-full   h-[100px] border rounded-md items-center justify-between p-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
              >
                <div className="flex items-center justify-between w-full px-2  h-[20px] border rounded-md text-[8px] sm:text-[11px] p-[2px] bg-blue-300/20">
                  <BsInfoCircle className="mr-1" /> NO OF EXAMS:{' '}
                  {exam === 'Updating...' ? (
                    <div>
                      <LoaderIcon />
                    </div>
                  ) : (
                      <div className='px-2 text-white bg-blue-600 bg-blue-400 rounded-full '>{exam}</div>
                  )}{' '}
                
                </div>
                <div className="flex items-center justify-between w-full px-2  h-[20px] border rounded-md text-[8px] sm:text-[11px] p-[2px] bg-blue-300/20">
                  <BsInfoCircle className="mr-1" /> NO OF QUES:{' '}
                  {question === 'Updating...' ? (
                    <div>
                      <LoaderIcon />
                    </div>
                  ) : (
                    <div>{question}</div>
                  )}
                
                </div>
                <div className="flex items-center justify-between  w-full px-2 h-[20px] border rounded-md text-[8px] sm:text-[11px] p-[2px] bg-blue-300/20">
                  <BsInfoCircle className="mr-1" /> NO OF STUDENTS:{' '}
                  {user === 'Updating...' ? (
                    <div>
                      <LoaderIcon />
                    </div>
                  ) : (
                      <div className='px-2 text-white bg-blue-600 bg-blue-400 rounded-full '>{user}</div>
                  )}
                
                </div>
              </motion.div>
      
              <motion.div
                className="flex flex-col w-full   h-[100px] border rounded-md items-center justify-between p-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
              >
                <div className="flex items-center justify-between w-full px-2  h-[20px] border rounded-md text-[8px] sm:text-[11px]  p-[2px] bg-blue-300/20">
                  <BsInfoCircle className="mr-1" /> NO OF BATCH:{' '}
                  {exam === 'Updating...' ? (
                    <div>
                      <LoaderIcon />
                    </div>
                  ) : (
                      <div className='px-2 text-white bg-blue-600 bg-blue-400 rounded-full '>{exam}</div>
                  )}{' '}
                
                </div>
      
                <div className="flex items-center justify-between  w-full px-2 h-[20px] border rounded-md text-[8px] sm:text-[11px] p-[2px] bg-blue-300/20">
                  <BsInfoCircle className="mr-1" /> NO OF SUBJECTS:{' '}
                  {exam === 'Updating...' ? (
                    <div>
                      <LoaderIcon />
                    </div>
                  ) : (
                      <div className='px-2 text-white bg-blue-600 bg-blue-400 rounded-full '>{exam}</div>
                  )}{' '}
                
                </div>
                <div className="flex items-center justify-between  w-full px-2 h-[20px] border rounded-md text-[8px] sm:text-[11px] p-[2px] bg-blue-300/20">
                  <BsInfoCircle className="mr-1" /> NO OF CLASSES:{' '}
                  {exam === 'Updating...' ? (
                    <div>
                      <LoaderIcon />
                    </div>
                  ) : (
                      <div className='px-2 text-white bg-blue-600 bg-blue-400 rounded-full '>{exam}</div>
                  )}{' '}
                
                </div>
              </motion.div>
           
            </div>
            <div className="flex flex-col w-full p-3 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
                className="hidden flex-col justify-between w-full   space-y-2 border rounded-md items-center justify-center p-2"
              >
                <div className="flex items-center justify-between  w-full px-2  border rounded-md text-[8px] sm:text-[10px] p-1">
                  <div className="flex items-center space-x-4">
                    <SiServerless className="mr-1" />{' '}
                    <div className="px-2 py-1 rounded bg-gray-300/20 text-black  ">
                      https://${serverInfo.ip}:${serverInfo.port}/api/lds-ID-7e6a09c7a8a8d8c9a1a/dash-8c9a1a7e6a09c7a8a8d
                    </div>
                  </div>
                  {exam === 'Updating...' ? (
                    <div className="flex items-center space-x-4 justify-center">
                      {' '}
                      Server is Offline <div className="bg-red-600 rounded-full p-[4px] ml-2"></div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 justify-center">
                      {' '}
                      Server is Online <div className="bg-blue-600 bg-blue-400 rounded-full p-[4px] ml-2"></div>
                    </div>
                  )}
                  <BiCopy className="p-[3px] bg-zinc-300/20 rounded w-4 h-4  " />
                </div>
                <div className="flex items-center justify-between  w-full px-2  border rounded-md text-[8px] sm:text-[10px] p-1">
                  <div className="flex items-center space-x-4">
                    <SiServerless className="mr-1" />{' '}
                    <div className="px-2 py-1 rounded bg-gray-300/20 text-black  ">
                      https://${serverInfo.ip}:${serverInfo.port}/api/lds-ID-7e6a09c7a8a8d8c9a1a/examID-8c9a1a7e6a09c7a8a8d
                    </div>{' '}
                  </div>
                  {exam === 'Updating...' ? (
                    <div className="flex items-center space-x-4 justify-center">
                      Server is Offline
                      <div className="bg-red-600 rounded-full p-[4px] ml-2"></div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 justify-center">
                      {' '}
                      Server is Online <div className="bg-blue-600 bg-blue-400 rounded-full p-[4px] ml-2"></div>
                    </div>
                  )}
                  <BiCopy className="p-[3px] bg-zinc-300/20 rounded w-4 h-4  " />
                </div>
                <div className="flex items-center justify-between  w-full px-2  border rounded-md text-[8px] sm:text-[10px] p-1">
                  <div className="flex items-center space-x-4">
                    <SiServerless className="mr-1" />{' '}
                    <div className="px-2 py-1 rounded bg-gray-300/20 text-black  ">
                      https://${serverInfo.ip}:${serverInfo.port}/api/lds-ID-7e6a09c7a8a8d8c9a1a/examID-9c7a8a8d8c9a1a7e6a0
                    </div>{' '}
                  </div>
                  {exam === 'Updating...' ? (
                    <div className="flex items-center space-x-4 justify-center">
                      {' '}
                      Server is Offline <div className="bg-red-600 rounded-full p-[4px] ml-2"></div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 justify-center">
                      {' '}
                      Server is Online <div className="bg-blue-600 bg-blue-400 rounded-full p-[4px] ml-2"></div>
                    </div>
                  )}
                  <BiCopy className="p-[3px] bg-zinc-300/20 rounded w-4 h-4  " />
                </div>
              </motion.div>
      
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1 }}
                className="flex flex-col w-full  border rounded-md items-center justify-center  "
              >
                <TabsComponent />
              </motion.div>
            </div>
          </div>
        )
      }
      
      export default Dash
      
      
      */