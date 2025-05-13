import '../renderer/src/assets/main.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../renderer/src/App'
import '../renderer/src/components/drag.css'
import ButtomBar from '../renderer/src/components/buttomBar'
import Header from './src/components/Header'
import { TbAlertCircle } from 'react-icons/tb'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <main className="flex flex-col h-screen w-screen bg-white dark:bg-gray-900  select-none">
      <Header />
      <div className=" w-full items-center justify-center border-t "></div>

      <App />
      <ButtomBar />
    </main>
  </React.StrictMode>
)
