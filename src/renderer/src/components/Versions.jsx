import { useState } from 'react'

function Versions() {
  const [versions] = useState(window.api.process.versions)

  return (
    <div
                                className="flex w-fit hover:cursor-pointer items-center px-3 py-1 bg-blue-600 bg-blue-400 rounded-full focus:bg-blue-300 hover:bg-blue-500 text-white text-[10px] transition-all shadow"
                                onClick={HanP}
                              >
                                <VscDebugStart className="mr-1" /> Start server{' '}
                              </div>
  )
}

export default Versions
