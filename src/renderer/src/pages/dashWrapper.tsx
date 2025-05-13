import { BellRing } from "lucide-react";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { LuBellRing, LuDatabaseBackup } from "react-icons/lu";
import { MdOutlineCloudSync } from "react-icons/md";

   const DashWrapper = () => {
    return ( 

        <div className="flex items-center justify-between border-l border-b p-1 bg-yellow-300/20 text-[10px] italic ">
        LearningDeck just launched Virtual Lab
        <div className="flex items-center space-x-2 text-[10px]">
            <p className="text-blue-600 underline hover:cursor-pointer">ReadMore</p>
          
        <LuBellRing/>
        </div>
      </div>
     );
   }
    
   export default DashWrapper;