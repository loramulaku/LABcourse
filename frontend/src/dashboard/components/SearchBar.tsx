import React from "react";
import { useSidebar } from "../context/SidebarContext";
import { Search, Menu } from "lucide-react";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, toggleSidebar } = useSidebar();

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Butoni për toggle sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Input për search - Full width */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search across all data..."
          className="w-full rounded-xl border border-white/30 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 py-3 pl-12 pr-4 text-sm 
                     text-gray-900 placeholder-gray-500 backdrop-blur-sm
                     focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 focus:bg-white/70 dark:focus:bg-gray-700/70
                     dark:text-white dark:placeholder-gray-400 transition-all duration-300"
        />
      </div>
    </div>
  );
};

export default SearchBar;
