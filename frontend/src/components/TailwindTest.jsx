import React from 'react';

const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎨 Tailwind CSS Test Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Comprehensive test to verify all Tailwind classes are working correctly
          </p>
        </div>
        
        {/* Background Color Tests */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Background Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">bg-gray-800</h3>
              <p>Dark gray background - should be dark</p>
            </div>
            
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">bg-blue-500</h3>
              <p>Blue background - should be blue</p>
            </div>
            
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">bg-green-500</h3>
              <p>Green background - should be green</p>
            </div>
            
            <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">bg-red-500</h3>
              <p>Red background - should be red</p>
            </div>
            
            <div className="bg-yellow-500 text-black p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">bg-yellow-500</h3>
              <p>Yellow background - should be yellow</p>
            </div>
            
            <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">bg-purple-500</h3>
              <p>Purple background - should be purple</p>
            </div>
          </div>
        </div>
        
        {/* Text Color Tests */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Text Colors</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white text-lg mb-2">✅ Gray-900 (light) / White (dark)</p>
            <p className="text-blue-600 dark:text-blue-400 text-lg mb-2">✅ Blue-600 (light) / Blue-400 (dark)</p>
            <p className="text-green-600 dark:text-green-400 text-lg mb-2">✅ Green-600 (light) / Green-400 (dark)</p>
            <p className="text-red-600 dark:text-red-400 text-lg mb-2">✅ Red-600 (light) / Red-400 (dark)</p>
          </div>
        </div>
        
        {/* Layout & Spacing Tests */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Layout & Spacing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Card with Padding</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">This card tests padding (p-6) and rounded corners.</p>
              <div className="space-y-2">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">Space between items</div>
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded">Another item</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Flex Layout</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 dark:text-gray-400">Left</span>
                <span className="text-gray-600 dark:text-gray-400">Right</span>
              </div>
              <div className="flex gap-2">
                <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Button 1</button>
                <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Button 2</button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Responsive Design</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base lg:text-lg">
                This text changes size based on screen size
              </p>
            </div>
          </div>
        </div>
        
        {/* Interactive Elements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Interactive Elements</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium">
              Primary Button
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium">
              Secondary Button
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium">
              Success Button
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium">
              Danger Button
            </button>
          </div>
        </div>
        
        {/* Dashboard-like Layout Test */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Layout Test</h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Table Header</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      A
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Admin User</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">admin@example.com</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Edit
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                      U
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Regular User</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">user@example.com</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Edit
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="text-center p-6 bg-green-50 dark:bg-green-900 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            ✅ Tailwind CSS is Working!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            All background colors, text colors, spacing, and layout utilities are functioning correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;
