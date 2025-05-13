import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Monitor, Smartphone, Server, Laptop, Info, Lock, Unlock, Globe, Clock } from 'lucide-react';
import { BiDevices, BiLock } from 'react-icons/bi';
import Dialog from '../components/dailog';
import { FiUnlock } from 'react-icons/fi';
import { LuRefreshCw } from 'react-icons/lu';

export default function DeviceMonitor() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' });
  const [serverInfoLoaded, setServerInfoLoaded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [updateCountdown, setUpdateCountdown] = useState(10);
  
  // Device limit configuration
  const [deviceLimit, setDeviceLimit] = useState(10);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Refresh interval in seconds
  const REFRESH_INTERVAL = 10;

  // Memoize excludedIPs based on serverInfo
  const excludedIPs = useMemo(() => {
    return [serverInfo.ip].filter(Boolean);
  }, [serverInfo.ip]);

  // Load server info first
  useEffect(() => {
    const getServerInfo = async () => {
      try {
        const info = await window.api.getServerInfo();
        setServerInfo(info);
        setServerInfoLoaded(true);
      } catch (error) {
        console.error('Error fetching server info:', error);
        setServerInfoLoaded(true); // Still mark as loaded even on error
      }
    };

    getServerInfo();
  }, []);

  // Fetch devices function
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await window.api.getConnectedDevices();
      
      // Filter out excluded IPs
      const processedDevices = data
        .filter(device => !excludedIPs.includes(device.ip));
      
      // Auto-block devices if active count exceeds limit
      const activeDevices = processedDevices.filter(device => device.status === 'active');
      if (activeDevices.length > deviceLimit) {
        // Sort by newest first to block the most recently connected devices
        const devicesToBlock = [...activeDevices]
          .sort((a, b) => {
            if (!a.firstSeen || !b.firstSeen) return 0;
            return new Date(a.firstSeen) - new Date(b.firstSeen) ? -1 : 1; // Oldest first
          })
          .slice(0, activeDevices.length - deviceLimit); // Block oldest devices to maintain the limit
        
        // Auto-block excess devices
        for (const device of devicesToBlock) {
          try {
            await window.api.blockDevice(device.id);
            device.status = 'blocked';
            device.autoBlocked = true;
          } catch (err) {
            console.error(`Failed to auto-block device ${device.id}:`, err);
          }
        }
      }
      
      setDevices(processedDevices);
      setError(null);
      setLastUpdateTime(new Date());
      setUpdateCountdown(REFRESH_INTERVAL);
    } catch (err) {
      setError('Failed to fetch connected devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time data refresh
  useEffect(() => {
    if (serverInfoLoaded) {
      // Initial fetch
      fetchDevices();
      
      // Set up refresh interval - more frequent for real-time updates
      const fetchIntervalId = setInterval(fetchDevices, REFRESH_INTERVAL * 1000);
      
      // Set up countdown timer for visual feedback
      const countdownIntervalId = setInterval(() => {
        setUpdateCountdown(prev => prev > 0 ? prev - 1 : REFRESH_INTERVAL);
      }, 1000);
      
      return () => {
        clearInterval(fetchIntervalId);
        clearInterval(countdownIntervalId);
      };
    }
  }, [serverInfoLoaded, excludedIPs, deviceLimit]);

  const blockDevice = async (deviceId) => {
    try {
      setIsBlocking(true);
      await window.api.blockDevice(deviceId);
      // Update the device status in the list
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, status: 'blocked' } : d
      ));
    } catch (err) {
      setError(`Failed to block device: ${err.message}`);
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockDevice = async (deviceId) => {
    try {
      setIsBlocking(true);
      await window.api.unblockDevice(deviceId);
      // Update the device status in the list
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, status: 'active', autoBlocked: false } : d
      ));
    } catch (err) {
      setError(`Failed to unblock device: ${err.message}`);
    } finally {
      setIsBlocking(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };
  
  const viewDeviceDetails = (device) => {
    setSelectedDevice(device);
    setShowDetailModal(true);
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'tablet':
        return <Laptop className="w-6 h-6" />;
      case 'desktop':
        return <Monitor className="w-6 h-6" />;
      case 'server':
        return <Server className="w-6 h-6" />;
      default:
        return <Globe className="w-6 h-6" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="inline w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2 py-1 font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="inline w-3 h-3 mr-1" />
            Blocked
          </span>
        );
      case 'idle':
        return (
          <span className="px-2 py-1 font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="inline w-3 h-3 mr-1" />
            Idle
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 font-medium rounded-full bg-gray-100 text-gray-800">
            <AlertCircle className="inline w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const filteredDevices = devices.filter(device => {
    // Filter by status
    if (filterStatus !== 'all' && device.status !== filterStatus) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !device.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !device.ip.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Show loading state until server info is loaded
  if (!serverInfoLoaded) {
    return (
      <div className="container mx-auto px-4 py-6 text-[10px]">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading server information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4  text-[10px]">
      <div className="flex items-center justify-between mb-6">
        <div></div>
        <div className="flex space-x-2">
          <div className="bg-gray-100 dark:bg-gray-600 dark:text-white   px-3 py-1 rounded-full flex items-center text-gray-700">
            <LuRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
            <span>Updating in {updateCountdown}s</span>
          </div>
          <button
            onClick={() => setShowLimitModal(true)}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            <BiDevices className="mr-1 w-4 h-4" />
            Set Device Limit
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search by name or IP..."
            className="w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:border-gray-300/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/2">
          <select
            className="w-full px-4 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500  dark:bg-transparent dark:border-gray-300/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="idle">Idle</option>
          </select>
        </div>
      </div>

      <div className=" border rounded overflow-hidden  dark:bg-transparent dark:border-gray-300/20">
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        )}
        {filteredDevices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No devices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50  dark:bg-gray-700   dark:border-gray-300/20 ">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Last Request
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className=" divide-y divide-gray-200 dark:divide-gray-300/20 ">
                {filteredDevices.map((device) => {
                  // Add a subtle highlight to auto-blocked devices
                  let rowClass = "dark:hover:bg-gray-600 hover:bg-gray-300/20";
                  if (device.autoBlocked) rowClass = "bg-red-50 dark:hover:bg-red-800 hover:bg-red-300/20";
                  
                  return (
                    <tr key={device.id} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-transparent rounded-full flex items-center justify-center hover:bg-gray-800">
                            {getDeviceIcon(device.type)}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-gray-200">{device.name}</div>
                            <div className="text-gray-500">{device.type || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-gray-400">{device.ip}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(device.status)}
                        {device.autoBlocked && (
                          <span className="ml-2  text-red-600">(Auto-blocked)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {device.lastRequest ? new Date(device.lastRequest).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewDeviceDetails(device)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Info className="w-5 h-5" />
                          </button>
                          {device.status === 'blocked' ? (
                            <button
                              onClick={() => unblockDevice(device.id)}
                              className="text-green-600 hover:text-green-900"
                              disabled={isBlocking}
                            >
                              <Unlock className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => blockDevice(device.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isBlocking}
                            >
                              <Lock className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Detail Modal */}
      {showDetailModal && selectedDevice && (
        <Dialog 
          title={"Device Details"} 
          im={<BiDevices/>} 
          onClose={closeDetailModal} 
          children={
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-[10px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className=""></h2>
              </div>

              {selectedDevice.autoBlocked && (
                <div className="p-4 bg-red-50 border-red-500 text-red-700 border-l-4 mb-4">
                  <p className="font-bold flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Auto-blocked Device
                  </p>
                  <p>This device was automatically blocked because the system exceeded the device limit of {deviceLimit} active devices.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded border">
                  <h3 className="font-semibold text-gray-700 mb-2">Basic Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{selectedDevice.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{selectedDevice.type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span>{getStatusBadge(selectedDevice.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">IP Address:</span>
                      <span className="font-medium">{selectedDevice.ip}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded border">
                  <h3 className="font-semibold text-gray-700 mb-2">Usage Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">First Seen:</span>
                      <span className="font-medium">
                        {selectedDevice.firstSeen ? new Date(selectedDevice.firstSeen).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Request:</span>
                      <span className="font-medium">
                        {selectedDevice.lastRequest ? new Date(selectedDevice.lastRequest).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Requests:</span>
                      <span className="font-medium">
                        {selectedDevice.recentRequests ? selectedDevice.recentRequests.length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Browser:</span>
                      <span className="font-medium">
                        {selectedDevice.browser || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Operating System:</span>
                      <span className="font-medium">
                        {selectedDevice.os || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDevice.recentRequests && selectedDevice.recentRequests.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Recent Requests</h3>
                  <div className="border rounded overflow-hidden max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-3 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-3 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">Path</th>
                          <th className="px-3 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedDevice.recentRequests.slice().reverse().map((req, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap ">
                              {new Date(req.timestamp).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap ">
                              {req.method}
                            </td>
                            <td className="px-3 py-2  truncate max-w-xs">
                              {req.path}
                            </td>
                            <td className={`px-3 py-2 whitespace-nowrap  ${req.status >= 400 ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                              {req.status || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                {selectedDevice.status === 'blocked' ? (
                  <button
                    onClick={() => {
                      unblockDevice(selectedDevice.id);
                      setShowDetailModal(false);
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center"
                    disabled={isBlocking}
                  >
                    <FiUnlock className="w-4 h-4 mr-2" />
                    Unblock Device
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      blockDevice(selectedDevice.id);
                      setShowDetailModal(false);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center"
                    disabled={isBlocking}
                  >
                    <BiLock className="w-4 h-4 mr-2" />
                    Block Device
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Device Limit Modal */}
      {showLimitModal && (
        <Dialog 
          title={"Device Limit Configuration"} 
          im={<BiDevices/>} 
          onClose={() => setShowLimitModal(false)} 
          children={
            <div className="bg-white rounded-lg p-6 w-full max-w-md text-[10px]">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Set the maximum number of active devices allowed. When this limit is exceeded, 
                  new devices will be automatically blocked.
                </p>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Device Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deviceLimit}
                    onChange={(e) => setDeviceLimit(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
                  <p className="font-bold">Current Status</p>
                  <p>Active devices: {devices.filter(d => d.status === 'active').length}</p>
                  <p>Auto-blocked devices: {devices.filter(d => d.autoBlocked).length}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    fetchDevices(); // Refresh to apply new limit
                  }}
                  className="px-4 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  Save & Apply
                </button>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-1 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Security Overview Cards */}
      <div className="hidden mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Active Devices</h3>
            <Monitor className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {devices.filter(d => d.status === 'active').length}
          </p>
          <p className=" text-gray-500 mt-1">
            Connected to the network
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Blocked Devices</h3>
            <Lock className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {devices.filter(d => d.status === 'blocked').length}
          </p>
          <p className=" text-gray-500 mt-1">
            {devices.filter(d => d.autoBlocked).length > 0 ? 
              `${devices.filter(d => d.autoBlocked).length} auto-blocked` : 
              'Prevented from accessing'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Device Limit</h3>
            <BiDevices className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {deviceLimit}
          </p>
          <p className=" text-gray-500 mt-1">
            Maximum active devices
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Last Update</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-md font-bold text-gray-900">
            {lastUpdateTime.toLocaleTimeString()}
          </p>
          <div className="flex items-center mt-1">
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
            <p className=" text-gray-500">
              Next update in {updateCountdown}s
            </p>
          </div>
          {/* Progress bar for countdown */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${(updateCountdown / REFRESH_INTERVAL) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}