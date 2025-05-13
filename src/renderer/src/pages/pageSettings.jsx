import { Settings } from 'lucide-react'

const PageSettings = () => {
  return (
    <div className="flex flex-col w-full h-full  space-y-2 bg-white dark:bg-gray-900 dark:bg-black">
      <div className="flex items-center justify-between border-b p-3 ">
        Page settings
        <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200"></div>
      </div>

      <div className="hidden sm:flex flex-col w-full p-3">
        <div className="flex items-center justify-between w-full space-x-4 text-[10px]">
          <div className="px-4 rounded-full py-1 bg-gray-600/20 border border-gray-300 dark:border-gray-700" />
          <div className="flex items-center justify-center h-[100px] w-full border rounded-md ">
            AuthenticationPage <Settings className="ml-2" width={10} height={10} />
          </div>
          <div className="px-4 rounded-full py-1 bg-gray-600/20 border border-gray-300 dark:border-gray-700" />
          <div className="flex  items-center justify-center h-[100px] w-full border rounded-md">
            SchoolInfoPage <Settings className="ml-2" width={10} height={10} />
          </div>
          <div className="px-4 rounded-full py-1 bg-gray-600/20 border border-gray-300 dark:border-gray-700" />
          <div className="flex  items-center justify-center h-[100px] w-full border rounded-md">
            ExamInfoPage <Settings className="ml-2" width={10} height={10} />
          </div>
          <div className="px-4 rounded-full py-1 bg-gray-600/20 border border-gray-300 dark:border-gray-700" />
          <div className="flex  items-center justify-center h-[100px] w-full border rounded-md">
            ExamPage <Settings className="ml-2" width={10} height={10} />
          </div>
          <div className="px-4 rounded-full py-1 bg-gray-600/20 border border-gray-300 dark:border-gray-700" />
          <div className="flex  items-center justify-center h-[100px] w-full border rounded-md">
            ResultPage <Settings className="ml-2" width={10} height={10} />
          </div>

          <div className="px-4 rounded-full py-1 bg-gray-600/20 border border-gray-300 dark:border-gray-700" />
        </div>
      </div>
    </div>
  )
}

export default PageSettings
