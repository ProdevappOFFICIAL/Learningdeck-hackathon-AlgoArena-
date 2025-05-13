import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, MoreHorizontal, ArrowUpDown } from "lucide-react";

const data = [
  { id: "1", amount: 316, status: "success", email: "ken99@yahoo.com" },
  { id: "2", amount: 242, status: "success", email: "Abe45@gmail.com" },
  { id: "3", amount: 837, status: "processing", email: "Monserrat44@gmail.com" },
  { id: "4", amount: 874, status: "success", email: "Silas22@gmail.com" },
  { id: "5", amount: 721, status: "failed", email: "carmella@hotmail.com" },
];

export default function Security() {
  const [sortBy, setSortBy] = useState("email");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sortedData = [...data].sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search email..."
          className="border p-2 rounded-lg w-1/3 focus:ring-2 focus:ring-blue-400 transition-all"
        />
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Columns <ChevronDown size={16} />
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">
                <button
                  onClick={() => setSortBy("email")}
                  className="flex items-center gap-2"
                >
                  Email <ArrowUpDown size={16} />
                </button>
              </th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <motion.tbody
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {sortedData.map((row) => (
              <motion.tr
                key={row.id}
                className="border-b hover:bg-gray-50 transition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <td className="p-3 capitalize">{row.status}</td>
                <td className="p-3 lowercase">{row.email}</td>
                <td className="p-3 text-right font-medium">
                  ${row.amount.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
