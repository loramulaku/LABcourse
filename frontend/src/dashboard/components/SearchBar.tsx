import React from "react";
import { useSidebar } from "../context/SidebarContext";
import { Search, Menu } from "lucide-react";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, toggleSidebar } = useSidebar();


  return (
    <div className="flex items-center gap-3 w-full max-w-md">
      {/* Butoni për toggle sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Input për search */}
      <div className="relative flex-1">
        {/* Ikona e search-it në mes */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm 
                     text-gray-900 placeholder-gray-400 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                     dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
      </div>

     
     
       
  
    </div>
  );
};

export default SearchBar;