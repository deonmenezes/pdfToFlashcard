import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { MatchingQuestion } from './matching-question-type';

interface MatchingSectionProps {
  matchingQuestions: MatchingQuestion[];
}

export const MatchingSection: React.FC<MatchingSectionProps> = ({ matchingQuestions }) => {
  const [currentMatchingIndex, setCurrentMatchingIndex] = useState<number>(0);
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [activeLeftItem, setActiveLeftItem] = useState<number | null>(null);
  const [matchingCompleted, setMatchingCompleted] = useState<boolean>(false);
  const [matchingResults, setMatchingResults] = useState<boolean[]>([]);

  const handleLeftItemClick = (index: number) => {
    if (matchingCompleted) return;
    setActiveLeftItem(index);
  };

  const handleRightItemClick = (index: number) => {
    if (activeLeftItem === null || matchingCompleted) return;
    
    const newSelectedMatches = [...selectedMatches];
    newSelectedMatches[activeLeftItem] = index;
    setSelectedMatches(newSelectedMatches);
    
    if (newSelectedMatches.filter(match => match !== undefined).length === matchingQuestions[currentMatchingIndex].leftItems.length) {
      const results = newSelectedMatches.map((match, idx) => 
        match === matchingQuestions[currentMatchingIndex].correctMatches[idx]
      );
      setMatchingResults(results);
      setMatchingCompleted(true);
    }
    
    setActiveLeftItem(null);
  };

  const resetMatching = () => {
    setSelectedMatches([]);
    setActiveLeftItem(null);
    setMatchingCompleted(false);
    setMatchingResults([]);
  };

  const nextMatching = () => {
    if (currentMatchingIndex < matchingQuestions.length - 1) {
      resetMatching();
      setCurrentMatchingIndex(currentMatchingIndex + 1);
    }
  };

  const prevMatching = () => {
    if (currentMatchingIndex > 0) {
      resetMatching();
      setCurrentMatchingIndex(currentMatchingIndex - 1);
    }
  };

  return (
    <motion.div 
      key="matching"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <motion.div 
        key={currentMatchingIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
              Matching Question {currentMatchingIndex + 1} of {matchingQuestions.length}
            </span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4">
              {matchingQuestions[currentMatchingIndex]?.question}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Match each item on the left with its corresponding item on the right.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between mt-6 relative">
            <div className="w-full md:w-5/12 space-y-4">
              {matchingQuestions[currentMatchingIndex]?.leftItems.map((item, index) => {
                const matchedRightIndex = selectedMatches[index];
                return (
                  <motion.div
                    key={`left-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border transition-all relative ${
                      activeLeftItem === index
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md"
                        : matchedRightIndex !== undefined
                        ? matchingCompleted
                          ? matchingResults[index]
                            ? "bg-green-50 dark:bg-green-900/30 border-green-500"
                            : "bg-red-50 dark:bg-red-900/30 border-red-500"
                          : "bg-purple-50 dark:bg-purple-900/30 border-purple-500"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => handleLeftItemClick(index)}
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 dark:text-white">{item}</span>
                      
                      {matchedRightIndex !== undefined && !matchingCompleted && (
                        <span 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full"
                          style={{ 
                            backgroundColor: `hsl(${matchedRightIndex * 60}, 70%, 50%)` 
                          }}
                        />
                      )}
                      
                      {matchingCompleted && (
                        <span className="ml-auto">
                          {matchingResults[index] ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                            >
                              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                            >
                              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.div>
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="w-full md:w-5/12 space-y-4 mt-8 md:mt-0">
              {matchingQuestions[currentMatchingIndex]?.rightItems.map((item, index) => {
                const isMatched = selectedMatches.includes(index);
                const matchedLeftIndex = isMatched ? selectedMatches.findIndex(match => match === index) : -1;
                return (
                  <motion.div
                    key={`right-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border transition-all relative ${
                      isMatched
                        ? matchingCompleted
                          ? matchingResults[matchedLeftIndex]
                            ? "bg-green-50 dark:bg-green-900/30 border-green-500"
                            : "bg-red-50 dark:bg-red-900/30 border-red-500"
                          : "bg-purple-50 dark:bg-purple-900/30 border-purple-500"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => handleRightItemClick(index)}
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm font-medium mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-gray-800 dark:text-white">{item}</span>
                      
                      {isMatched && !matchingCompleted && (
                        <span 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full"
                          style={{ 
                            backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          {matchingCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                Results: {matchingResults.filter(Boolean).length} of {matchingResults.length} correct
              </h4>
              <div className="mt-4">
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                  onClick={resetMatching}
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <div className="flex justify-between items-center mt-8 px-4">
        <Button 
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            currentMatchingIndex > 0 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={prevMatching}
          disabled={currentMatchingIndex === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="flex space-x-1">
          {matchingQuestions.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all ${
                index === currentMatchingIndex 
                  ? "w-8 bg-blue-500" 
                  : "w-2 bg-gray-300 dark:bg-gray-600"
              }`}
            ></div>
          ))}
        </div>
        
        <Button 
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            currentMatchingIndex < matchingQuestions.length - 1 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={nextMatching}
          disabled={currentMatchingIndex === matchingQuestions.length - 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </motion.div>
  );
};