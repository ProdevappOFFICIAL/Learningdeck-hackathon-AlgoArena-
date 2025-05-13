import { motion } from "framer-motion";

const SkeletonLoader = ({ isLoading, children }) => {
  if (!isLoading) return children;

  return (
    <motion.div
      className="w-full space-y-4"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
    >
      <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
     
    </motion.div>
  );
};

export default SkeletonLoader;
