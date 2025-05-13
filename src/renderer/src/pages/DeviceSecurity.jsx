import React, { useState, useEffect } from 'react';
import DeviceMonitor from './DeviceMonitor';
import { Settings, Shield, Activity } from 'lucide-react';

function DeviceMonitorPage() {
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [currentServer, setCurrentServer] = useState({ ip: 'localhost', port: 80 });
  const [stats, setStats] = useState({
    active: 0,
    blocked: 0,
    total: 0
  });

  useEffect(() => {
    // Get security status on component mount
    async function getInitialData() {
      try {
        const isSecurityEnabled = await window.api.getSecurityStatus();
        setSecurityEnabled(isSecurityEnabled);
        
        const serverInfo = await window.api.getServerInfo();
        setCurrentServer(serverInfo);
        
        // Get initial stats from devices
        updateStats();
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    }
    
    getInitialData();
    
    // Set up interval to refresh stats
    const intervalId = setInterval(updateStats, 10000);
    return () => clearInterval(intervalId);
  }, []);
  
  const updateStats = async () => {
    try {
      const devices = await window.api.getConnectedDevices();
      
      const stats = {
        active: devices.filter(d => d.status === 'active').length,
        blocked: devices.filter(d => d.status === 'blocked').length,
        total: devices.length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };
  
  const toggleSecurity = () => {
    const newStatus = !securityEnabled;
    window.api.toggleSecurity(newStatus);
    setSecurityEnabled(newStatus);
  };

  return (
    <div className="min-h-screen bg-gray-50 border-l">
          <div className="flex items-center justify-between border-b dark:border-gray-600 p-3">
              <span className=" ">Server Configuration</span>
      
             
            </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Security settings and server info */}
     
        
        {/* Device Monitor */}
        <div className="bg-white rounded border w-full">
        
          <DeviceMonitor />
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-gray-500">
          <p>API Device Monitor v1.0.0 | Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default DeviceMonitorPage;