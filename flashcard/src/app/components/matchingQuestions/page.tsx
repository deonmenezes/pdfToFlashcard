'use client'
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MatchingQuestionProps {
  id: number;
  question: string;
  leftItems: string[];
  rightItems: string[];
  correctMatches: number[];
  onComplete?: (id: number, isCorrect: boolean) => void;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  id,
  question,
  leftItems,
  rightItems,
  correctMatches,
  onComplete
}) => {
  const [selectedLeftItem, setSelectedLeftItem] = useState<number | null>(null);
  const [matches, setMatches] = useState<number[]>(Array(leftItems.length).fill(-1));
  const [completed, setCompleted] = useState<boolean[]>(Array(leftItems.length).fill(false));
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [questionComplete, setQuestionComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  
  const leftItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset refs when items change
  useEffect(() => {
    leftItemRefs.current = leftItemRefs.current.slice(0, leftItems.length);
    rightItemRefs.current = rightItemRefs.current.slice(0, rightItems.length);
  }, [leftItems, rightItems]);

  const handleLeftItemClick = (index: number) => {
    if (completed[index]) return;
    setSelectedLeftItem(index);
  };

  const handleRightItemClick = (index: number) => {
    if (selectedLeftItem === null) return;
    
    // Check if this right item is already matched
    const existingMatchIndex = matches.findIndex(match => match === index);
    if (existingMatchIndex !== -1 && existingMatchIndex !== selectedLeftItem) {
      return;
    }

    const newMatches = [...matches];
    newMatches[selectedLeftItem] = index;
    setMatches(newMatches);

    const isCorrect = index === correctMatches[selectedLeftItem];
    const newCompleted = [...completed];
    newCompleted[selectedLeftItem] = true;
    setCompleted(newCompleted);

    // Check if all items are matched
    if (newCompleted.every(item => item)) {
      setQuestionComplete(true);
      setShowCorrectAnimation(true);
      if (onComplete) {
        const allCorrect = newMatches.every((match, i) => match === correctMatches[i]);
        onComplete(id, allCorrect);
      }
    }

    setSelectedLeftItem(null);
  };

  // Calculate connection paths
  const getConnectionPath = (leftIndex: number, rightIndex: number) => {
    if (!leftItemRefs.current[leftIndex] || !rightItemRefs.current[rightIndex]) return "";
    
    const leftRect = leftItemRefs.current[leftIndex]?.getBoundingClientRect();
    const rightRect = rightItemRefs.current[rightIndex]?.getBoundingClientRect();
    
    if (!leftRect || !rightRect) return "";
    
    // Calculate the center points of the right edge of the left box
    // and the left edge of the right box
    const leftX = leftRect.right;
    const leftY = leftRect.top + leftRect.height / 2;
    
    const rightX = rightRect.left;
    const rightY = rightRect.top + rightRect.height / 2;
    
    // Bezier curve control points
    const controlX1 = leftX + (rightX - leftX) * 0.4;
    const controlY1 = leftY;
    const controlX2 = rightX - (rightX - leftX) * 0.4;
    const controlY2 = rightY;
    
    return `M${leftX},${leftY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${rightX},${rightY}`;
  };

  return (
    <div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="mb-2 py-1 px-3 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full inline-block text-sm font-medium">
        Matching Question {currentIndex} of {2}
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        {question}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Match each item on the left with its corresponding item on the right.
      </p>
      
      <div className="flex flex-col md:flex-row justify-between gap-6 relative">
        {/* Connection lines - using SVG for precise control */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          style={{ zIndex: 0 }}
        >
          {matches.map((rightIndex, leftIndex) => {
            if (rightIndex === -1 || !completed[leftIndex]) return null;
            
            return (
              <motion.path
                key={`connection-${leftIndex}-${rightIndex}`}
                d={getConnectionPath(leftIndex, rightIndex)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 1,
                  stroke: "#10b981" // Green color for connections
                }}
                transition={{ duration: 0.5 }}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        
        {/* Left items */}
        <div className="flex flex-col space-y-4 w-full md:w-5/12 z-10">
          {leftItems.map((item, index) => (
            <div
              key={`left-${index}`}
              ref={(el) => {
                leftItemRefs.current[index] = el;
              }}
              className={`
                p-4 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-all
                ${completed[index]
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : selectedLeftItem === index
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }
              `}
              onClick={() => handleLeftItemClick(index)}
            >
              <div className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm
                  ${completed[index]
                    ? "bg-green-500 text-white"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  }
                `}>
                  {index + 1}
                </div>
                <span className="font-medium">{item}</span>
              </div>
              
              {completed[index] && (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-green-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
        
        {/* Right items */}
        <div className="flex flex-col space-y-4 w-full md:w-5/12 z-10">
          {rightItems.map((item, index) => (
            <div
              key={`right-${index}`}
              ref={(el) => {
                rightItemRefs.current[index] = el;
              }}
              className={`
                p-4 rounded-lg border-2 flex items-center cursor-pointer transition-all
                ${matches.includes(index)
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : selectedLeftItem !== null
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-500 dark:hover:border-blue-500"
                    : "border-gray-200 dark:border-gray-700"
                }
              `}
              onClick={() => handleRightItemClick(index)}
            >
              <div className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm
                  ${matches.includes(index)
                    ? "bg-green-500 text-white"
                    : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                  }
                `}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="font-medium">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Results display */}
      {questionComplete && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <div className="text-lg font-semibold text-blue-800 dark:text-blue-300">
            Results: {matches.filter((match, i) => match === correctMatches[i]).length} of {matches.length} correct
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MatchingQuestion;