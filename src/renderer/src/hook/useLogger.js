import { useEffect, useState } from "react";

export default function useLogger() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    window.api.getLogs().then(setLogs);

    const handleLogUpdate = (newLog) => {
      setLogs((prevLogs) => [...prevLogs, newLog]);
    };

    window.api.removeLogUpdate(handleLogUpdate);
    window.api.onLogUpdate(handleLogUpdate);

    return () => {
      window.api.removeLogUpdate(handleLogUpdate);
    };
  }, []);

  return {
    logs,
    log: (message, level = "info") => window.api.log(message, level),
    clearLogs: () => {
      window.api.clearLogs();
      setLogs([]); // Clear logs in UI immediately
    },
  };
}
