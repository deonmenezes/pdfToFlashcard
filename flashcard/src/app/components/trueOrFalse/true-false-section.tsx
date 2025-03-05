'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { TrueFalseQuestion } from './true-false-type';

interface TrueFalseSectionProps {
  trueFalseQuestions: TrueFalseQuestion[];
}

export const TrueFalseSection: React.FC<TrueFalseSectionProps> = ({ trueFalseQuestions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const nextQuestion = () => {
    if (currentIndex < trueFalseQuestions.length - 1) {
      setSlideDirection("right");
      setSelectedAnswer(null);
      setShowResult(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setSlideDirection("left");
      setSelectedAnswer(null);
      setShowResult(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswerSelect = (answer: boolean) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answer);
      setShowResult(true);
    }
  };

  const cardVariants = {
    enterFromRight: {
      x: 300,
      opacity: 0,
      scale: 0.8,
    },
    enterFromLeft: {
      x: -300,
      opacity: 0,
      scale: 0.8,
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exitToLeft: {
      x: -300,
      opacity: 0,
      scale: 0.8,
    },
    exitToRight: {
      x: 300,
      opacity: 0,
      scale: 0.8,
    },
  };

  const currentQuestion = trueFalseQuestions[currentIndex];

  return (
    <motion.div 
      key="true-false-section"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          variants={cardVariants}
          initial={slideDirection === "right" ? "enterFromRight" : "enterFromLeft"}
          animate="center"
          exit={slideDirection === "right" ? "exitToLeft" : "exitToRight"}
          transition={{ 
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col"
        >
          <div className="mb-6">
            <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
              Question {currentIndex + 1} of {trueFalseQuestions.length}
            </span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
            {/* True Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-lg cursor-pointer border transition-all relative ${
                selectedAnswer === true
                  ? selectedAnswer === currentQuestion.isTrue
                    ? "bg-green-50 dark:bg-green-900/30 border-green-500 shadow-md"
                    : "bg-red-50 dark:bg-red-900/30 border-red-500 shadow-md"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
              }`}
              onClick={() => handleAnswerSelect(true)}
            >
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15,
                    delay: 0.1
                  }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white">TRUE</h4>
                </motion.div>
                
                {selectedAnswer === true && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-2 right-2"
                  >
                    {selectedAnswer === currentQuestion.isTrue ? (
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* False Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-lg cursor-pointer border transition-all relative ${
                selectedAnswer === false
                  ? selectedAnswer === currentQuestion.isTrue
                    ? "bg-green-50 dark:bg-green-900/30 border-green-500 shadow-md"
                    : "bg-red-50 dark:bg-red-900/30 border-red-500 shadow-md"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
              }`}
              onClick={() => handleAnswerSelect(false)}
            >
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15,
                    delay: 0.3
                  }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white">FALSE</h4>
                </motion.div>
                
                {selectedAnswer === false && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-2 right-2"
                  >
                    {selectedAnswer === currentQuestion.isTrue ? (
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className={`mt-6 p-4 rounded-lg border ${
                selectedAnswer === currentQuestion.isTrue
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              <h4 className={`font-medium mb-1 ${
                selectedAnswer === currentQuestion.isTrue
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}>
                {selectedAnswer === currentQuestion.isTrue
                  ? "Correct!"
                  : "Incorrect!"
                }
              </h4>
              <p className="text-gray-800 dark:text-white">
                The statement is {currentQuestion.isTrue ? "TRUE" : "FALSE"}.
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center mt-8 px-4">
        <Button 
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            currentIndex > 0 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="flex space-x-1">
          {trueFalseQuestions.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "w-8 bg-blue-500" 
                  : "w-2 bg-gray-300 dark:bg-gray-600"
              }`}
            ></div>
          ))}
        </div>
        
        <Button 
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            currentIndex < trueFalseQuestions.length - 1 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={nextQuestion}
          disabled={currentIndex === trueFalseQuestions.length - 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </motion.div>
  );
};