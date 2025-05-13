import { useState, useEffect, useRef } from 'react';
import { IoWifiSharp } from 'react-icons/io5';
import { LuWifiOff } from 'react-icons/lu';
import { LoaderIcon } from 'react-hot-toast';
import { FiLock, FiRefreshCw } from 'react-icons/fi';
import { IoCheckmarkCircle } from 'react-icons/io5';
import Dialog from '../components/dailog';
import useLogger from '../hook/useLogger';

const WiFiNetwork = ({ network, onConnect, currentSSID }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleConnect = () => {
    if (network.secured && !showPasswordInput) {
      setShowPasswordInput(true);
      return;
    }

    if (network.secured && !password) {
      return; // Don't proceed if no password is provided for secured network
    }

    setIsConnecting(true);
    onConnect(network, password)
      .then(() => {
        setShowPasswordInput(false);
        setPassword('');
      })
      .catch(() => {
        // Handle connection failure
      })
      .finally(() => {
        setIsConnecting(false);
      });
  };

  const isConnected = currentSSID === network.ssid;

  return (
    <div className="flex flex-col w-full border-b dark:border-gray-700 py-2 last:border-b-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {network.signalStrength > 70 ? (
            <IoWifiSharp className="text-blue-600 mr-2" />
          ) : network.signalStrength > 40 ? (
            <IoWifiSharp className="text-blue-400 mr-2" />
          ) : (
            <IoWifiSharp className="text-gray-400 mr-2" />
          )}
          <div className="flex flex-col">
            <span className="text-[12px] font-medium">{network.ssid}</span>
            <span className="text-[10px] text-gray-500 flex items-center">
              {network.secured && <FiLock className="mr-1" size={10} />}
              {network.signalStrength}% signal strength
            </span>
          </div>
        </div>
        
        {isConnected ? (
          <div className="flex items-center text-green-500 text-[10px]">
            <IoCheckmarkCircle className="mr-1" />
            Connected
          </div>
        ) : isConnecting ? (
          <div className="flex items-center text-blue-500 text-[10px]">
            <LoaderIcon className="mr-1" />
            Connecting...
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="px-2 py-1 text-[10px] bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          >
            Connect
          </button>
        )}
      </div>

      {showPasswordInput && (
        <div className="flex items-center mt-2 pl-6">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter WiFi password"
            className="w-full text-[10px] border dark:border-gray-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex ml-2">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-[10px] text-gray-500 hover:text-gray-700 mr-2"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            <button
              onClick={handleConnect}
              disabled={!password}
              className={`px-2 py-1 text-[10px] ${
                password ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300"
              } text-white rounded-full transition-colors`}
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const WiFiDialog = ({ onClose }) => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSSID, setCurrentSSID] = useState('');
  const { log } = useLogger();
  const [scanningNetworks, setScanningNetworks] = useState(false);

  const scanWiFiNetworks = () => {
    setScanningNetworks(true);
    setLoading(true);
    
    // Call the preload method to scan networks
    window.api.scanWiFiNetworks()
      .then(networks => {
        setNetworks(networks);
        log(`${new Date().toLocaleTimeString()} Found ${networks.length} WiFi networks`);
      })
      .catch(error => {
        console.error('Error scanning WiFi networks:', error);
        log(`${new Date().toLocaleTimeString()} Error scanning WiFi networks: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
        setScanningNetworks(false);
      });
  };

  const checkCurrentConnection = () => {
    window.api.getCurrentWiFiConnection()
      .then(connection => {
        if (connection && connection.ssid) {
          setCurrentSSID(connection.ssid);
          log(`${new Date().toLocaleTimeString()} Currently connected to: ${connection.ssid}`);
        }
      })
      .catch(error => {
        console.error('Error checking current WiFi connection:', error);
      });
  };

  useEffect(() => {
    scanWiFiNetworks();
    checkCurrentConnection();
    
    // Set up interval to refresh the current connection status
    const intervalId = setInterval(checkCurrentConnection, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleConnectToNetwork = (network, password) => {
    log(`${new Date().toLocaleTimeString()} Connecting to ${network.ssid}...`);
    
    return window.api.connectToWiFiNetwork(network.ssid, password)
      .then(() => {
        log(`${new Date().toLocaleTimeString()} Successfully connected to ${network.ssid}`);
        setCurrentSSID(network.ssid);
        return Promise.resolve();
      })
      .catch(error => {
        log(`${new Date().toLocaleTimeString()} Failed to connect to ${network.ssid}: ${error.message}`);
        return Promise.reject(error);
      });
  };

  return (
  <div className="flex flex-col w-full border p-2 mt-2 rounded-md">
     
        <div className="flex items-center justify-end gap-1 text-blue-700">
          {scanningNetworks ? "Scanning..." : `${networks.length} networks found`}
          <FiRefreshCw
            onClick={scanWiFiNetworks}
            size={18}
            className={`p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ${scanningNetworks ? "animate-spin" : ""}`}
          />
        </div>
    
        <div className="flex flex-col  dark:border-gray-700 text-[10px] px-3 py-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <LoaderIcon size={16} />
              <span className="ml-2">Scanning for networks...</span>
            </div>
          ) : networks.length > 0 ? (
            networks.map((network, index) => (
              <WiFiNetwork
                key={`${network.ssid}-${index}`}
                network={network}
                onConnect={handleConnectToNetwork}
                currentSSID={currentSSID}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-gray-500">
              <LuWifiOff className="mb-2" size={24} />
              <span>No WiFi networks found</span>
              <button
                onClick={scanWiFiNetworks}
                className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
        </div>
    
  );
};

export default WiFiDialog;