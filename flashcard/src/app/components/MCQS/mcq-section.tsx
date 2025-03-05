import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { MCQ } from './mcq-types';

interface MCQSectionProps {
  mcqs: MCQ[];
}

export const MCQSection: React.FC<MCQSectionProps> = ({ mcqs }) => {
  const [currentMCQIndex, setCurrentMCQIndex] = useState<number>(0);
  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState<number | null>(null);
  const [showMCQCorrectAnswer, setShowMCQCorrectAnswer] = useState<boolean>(false);

  const nextMCQ = () => {
    if (currentMCQIndex < mcqs.length - 1) {
      setSelectedMCQAnswer(null);
      setShowMCQCorrectAnswer(false);
      setTimeout(() => {
        setCurrentMCQIndex(currentMCQIndex + 1);
      }, 300);
    }
  };

  const prevMCQ = () => {
    if (currentMCQIndex > 0) {
      setSelectedMCQAnswer(null);
      setShowMCQCorrectAnswer(false);
      setTimeout(() => {
        setCurrentMCQIndex(currentMCQIndex - 1);
      }, 300);
    }
  };

  const handleMCQAnswerSelect = (index: number) => {
    setSelectedMCQAnswer(index);
    setShowMCQCorrectAnswer(true);
  };

  return (
    <motion.div 
      key="mcq"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <motion.div 
        key={currentMCQIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
              Question {currentMCQIndex + 1} of {mcqs.length}
            </span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4">
              {mcqs[currentMCQIndex]?.question}
            </h3>
          </div>
          
          <div className="space-y-3">
            {mcqs[currentMCQIndex]?.options.map((option, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className={`p-4 rounded-lg cursor-pointer border transition-all ${
                  selectedMCQAnswer === index
                    ? index === mcqs[currentMCQIndex].correctAnswer
                      ? "bg-green-50 dark:bg-green-900/30 border-green-500 shadow-md"
                      : "bg-red-50 dark:bg-red-900/30 border-red-500 shadow-md"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
                }`}
                onClick={() => !selectedMCQAnswer && handleMCQAnswerSelect(index)}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-800 dark:text-white">{option}</span>
                  
                  {selectedMCQAnswer !== null && (
                    <span className="ml-auto">
                      {index === mcqs[currentMCQIndex].correctAnswer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                        >
                          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                      {selectedMCQAnswer === index && index !== mcqs[currentMCQIndex].correctAnswer && (
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
            ))}
          </div>
          
          {showMCQCorrectAnswer && selectedMCQAnswer !== mcqs[currentMCQIndex].correctAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Correct Answer:</h4>
              <p className="text-gray-800 dark:text-white">
                {mcqs[currentMCQIndex].options[mcqs[currentMCQIndex].correctAnswer]}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <div className="flex justify-between items-center mt-8 px-4">
        <Button 
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            currentMCQIndex > 0 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={prevMCQ}
          disabled={currentMCQIndex === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="flex space-x-1">
          {mcqs.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all ${
                index === currentMCQIndex 
                  ? "w-8 bg-blue-500" 
                  : "w-2 bg-gray-300 dark:bg-gray-600"
              }`}
            ></div>
          ))}
        </div>
        
        <Button 
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            currentMCQIndex < mcqs.length - 1 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={nextMCQ}
          disabled={currentMCQIndex === mcqs.length - 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </motion.div>
  );
};