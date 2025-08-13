"use client";
import { FaTachometerAlt, FaUserTimes } from "react-icons/fa";

export default function AdminSidebar({ setView, setShowAbsent }) {
  return (
    <aside className="w-64 bg-gradient-to-b from-white via-gray-100 to-gray-200 text-gray-800 flex flex-col shadow-lg">
      <div className="p-6 flex items-center gap-3 border-b border-gray-300">
        <div className="bg-gray-800 p-2 rounded-lg shadow-md">
          <FaTachometerAlt className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">DESINERZ ACADEMY</h2>
          <p className="text-xs text-gray-600">Govt. Regd. & ISO Certified</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setShowAbsent(false)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 transition text-white font-medium shadow-md"
        >
          <FaTachometerAlt /> Dashboard
        </button>
        <button
          onClick={() => setShowAbsent(true)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 transition text-white font-medium shadow-md"
        >
          <FaUserTimes /> Absent Today
        </button>
      </nav>
    </aside>
  );
}
