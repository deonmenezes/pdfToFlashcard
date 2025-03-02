'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

// Define TypeScript interfaces
interface Flashcard {
  question: string;
  answer: string;
}

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface MatchingQuestion {
  question: string;
  leftItems: string[];
  rightItems: string[];
  correctMatches: number[]; // Index of right item matching each left item
}

interface TrueFalseQuestion {
  question: string;
  isTrue: boolean;
}

interface QuizPageProps {
  file: File | null;
  flashcards: Flashcard[];
  mcqs: MCQ[];
  matchingQuestions: MatchingQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
  onBackToUpload: () => void;
}

const QuizPage: React.FC<QuizPageProps> = ({ 
  file, 
  flashcards, 
  mcqs, 
  matchingQuestions, 
  trueFalseQuestions, 
  onBackToUpload 
}) => {
  const [activeTab, setActiveTab] = useState<"flashcards" | "mcq" | "matching" | "truefalse">("flashcards");
  
  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  
  // MCQ states
  const [currentMCQIndex, setCurrentMCQIndex] = useState<number>(0);
  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState<number | null>(null);
  const [showMCQCorrectAnswer, setShowMCQCorrectAnswer] = useState<boolean>(false);
  
  // Matching question states
  const [currentMatchingIndex, setCurrentMatchingIndex] = useState<number>(0);
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [activeLeftItem, setActiveLeftItem] = useState<number | null>(null);
  const [matchingCompleted, setMatchingCompleted] = useState<boolean>(false);
  const [matchingResults, setMatchingResults] = useState<boolean[]>([]);
  
  // True/False states
  const [currentTFIndex, setCurrentTFIndex] = useState<number>(0);
  const [selectedTFAnswer, setSelectedTFAnswer] = useState<boolean | null>(null);
  const [showTFResult, setShowTFResult] = useState<boolean>(false);
  
  const router = useRouter();

  // Flashcards functions
  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setSlideDirection("right");
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setSlideDirection("left");
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  // MCQ functions
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

  // Matching functions
  const handleLeftItemClick = (index: number) => {
    if (matchingCompleted) return;
    setActiveLeftItem(index);
  };

  const handleRightItemClick = (index: number) => {
    if (activeLeftItem === null || matchingCompleted) return;
    
    // Update selected matches
    const newSelectedMatches = [...selectedMatches];
    newSelectedMatches[activeLeftItem] = index;
    setSelectedMatches(newSelectedMatches);
    
    // Check if all items are matched
    if (newSelectedMatches.filter(match => match !== undefined).length === matchingQuestions[currentMatchingIndex].leftItems.length) {
      // Evaluate results
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

  // True/False functions
  const handleTFAnswerSelect = (answer: boolean) => {
    setSelectedTFAnswer(answer);
    setShowTFResult(true);
  };

  const nextTF = () => {
    if (currentTFIndex < trueFalseQuestions.length - 1) {
      setSelectedTFAnswer(null);
      setShowTFResult(false);
      setCurrentTFIndex(currentTFIndex + 1);
    }
  };

  const prevTF = () => {
    if (currentTFIndex > 0) {
      setSelectedTFAnswer(null);
      setShowTFResult(false);
      setCurrentTFIndex(currentTFIndex - 1);
    }
  };

  // Tab change handler
  const handleTabChange = (tab: "flashcards" | "mcq" | "matching" | "truefalse") => {
    setActiveTab(tab);
  };

  // Card variants for slide animation
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
      rotateY: isFlipped ? 180 : 0,
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

  // Get connection line position for matching question
  const getConnectionLine = (leftIdx: number, rightIdx: number) => {
    // This is a simplified approach. In a real app, you'd use DOM elements' positions
    const leftX = 150;
    const rightX = 350;
    const leftY = 100 + leftIdx * 60 + 25;
    const rightY = 100 + rightIdx * 60 + 25;
    
    return `M${leftX},${leftY} C${(leftX+rightX)/2},${leftY} ${(leftX+rightX)/2},${rightY} ${rightX},${rightY}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onBackToUpload}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {file?.name || "Study Session"}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              className={`px-3 py-2 rounded-lg ${
                activeTab === "flashcards" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              }`}
              onClick={() => handleTabChange("flashcards")}
            >
              Flashcards
            </Button>
            <Button 
              className={`px-3 py-2 rounded-lg ${
                activeTab === "mcq" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              }`}
              onClick={() => handleTabChange("mcq")}
            >
              Multiple Choice
            </Button>
            <Button 
              className={`px-3 py-2 rounded-lg ${
                activeTab === "matching" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              }`}
              onClick={() => handleTabChange("matching")}
            >
              Match Items
            </Button>
            <Button 
              className={`px-3 py-2 rounded-lg ${
                activeTab === "truefalse" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              }`}
              onClick={() => handleTabChange("truefalse")}
            >
              True/False
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* FLASHCARDS TAB */}
            {activeTab === "flashcards" && (
              <motion.div 
                key="flashcards"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="w-full max-w-md mx-auto mb-8">
                  <div className="relative perspective" style={{ perspective: '1000px', height: '24rem' }}>
                    <AnimatePresence initial={false} mode="wait" custom={slideDirection}>
                      <motion.div 
                        key={currentCardIndex}
                        custom={slideDirection}
                        variants={cardVariants}
                        initial={slideDirection === "right" ? "enterFromRight" : "enterFromLeft"}
                        animate="center"
                        exit={slideDirection === "right" ? "exitToLeft" : "exitToRight"}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 30,
                          duration: 0.6
                        }}
                        className="absolute inset-0 w-full h-full"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Front of card (Question) */}
                        <div 
                          className={`absolute inset-0 backface-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl shadow-lg p-8 flex flex-col justify-center items-center ${
                            isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                          }`}
                          onClick={flipCard}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-center"
                          >
                            <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mb-4">QUESTION</span>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                              {flashcards[currentCardIndex]?.question}
                            </h3>
                            <div className="absolute bottom-6 right-6">
                              <motion.div 
                                animate={{ y: [0, 5, 0] }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-blue-500 dark:text-blue-400"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
                                </svg>
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Back of card (Answer) */}
                        <div 
                          className={`absolute inset-0 backface-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-xl shadow-lg p-8 flex flex-col justify-center items-center ${
                            !isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                          }`}
                          onClick={flipCard}
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-center"
                          >
                            <span className="inline-block bg-purple-500 text-white text-xs px-2 py-1 rounded mb-4">ANSWER</span>
                            <p className="text-xl text-gray-800 dark:text-white">
                              {flashcards[currentCardIndex]?.answer}
                            </p>
                            <div className="absolute bottom-6 right-6">
                              <motion.div 
                                animate={{ y: [0, 5, 0] }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-purple-500 dark:text-purple-400"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
                                </svg>
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                
                  <div className="flex justify-between items-center mt-8 px-4">
                    <Button 
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        currentCardIndex > 0 
                          ? "bg-blue-500 hover:bg-blue-600 text-white" 
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={prevCard}
                      disabled={currentCardIndex === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    
                    <div className="text-center">
                      <span className="text-lg font-medium text-gray-800 dark:text-white">
                        {currentCardIndex + 1} / {flashcards.length}
                      </span>
                      <div className="flex space-x-1 mt-2">
                        {flashcards.map((_, index) => (
                          <div 
                            key={index} 
                            className={`h-1 rounded-full ${
                              index === currentCardIndex 
                                ? "w-6 bg-blue-500" 
                                : "w-3 bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        currentCardIndex < flashcards.length - 1 
                          ? "bg-blue-500 hover:bg-blue-600 text-white" 
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={nextCard}
                      disabled={currentCardIndex === flashcards.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="text-center mt-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tap the card to flip and reveal the answer
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* MCQ TAB */}
            {activeTab === "mcq" && (
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
            )}
            
            {/* MATCHING QUESTIONS TAB */}
            {activeTab === "matching" && (
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
                      {/* SVG for connection lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {selectedMatches.map((rightIdx, leftIdx) => {
                          if (rightIdx === undefined) return null;
                          const isCorrect = matchingCompleted ? 
                            matchingQuestions[currentMatchingIndex].correctMatches[leftIdx] === rightIdx : true;
                          
                          return (
                            <motion.path
                              key={`line-${leftIdx}-${rightIdx}`}
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5 }}
                              d={getConnectionLine(leftIdx, rightIdx)}
                              stroke={isCorrect ? "#4ADE80" : "#EF4444"}
                              strokeWidth={2}
                              fill="none"
                              strokeDasharray={matchingCompleted ? "0" : "5,5"}
                            />
                          );
                        })}
                      </svg>
                      
                      {/* Left items */}
                      <div className="w-full md:w-5/12 space-y-4">
                        {matchingQuestions[currentMatchingIndex]?.leftItems.map((item, index) => (
                          <motion.div
                            key={`left-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`p-4 rounded-lg border transition-all ${
                              activeLeftItem === index
                                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md"
                                : selectedMatches[index] !== undefined
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
                        ))}
                      </div>
                      
                      {/* Right items */}
                      <div className="w-full md:w-5/12 space-y-4 mt-8 md:mt-0">
                        {matchingQuestions[currentMatchingIndex]?.rightItems.map((item, index) => (
                          <motion.div
                            key={`right-${index}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`p-4 rounded-lg border transition-all ${
                              selectedMatches.includes(index)
                                ? matchingCompleted
                                  ? selectedMatches.findIndex(match => match === index) !== -1 && 
                                    matchingResults[selectedMatches.findIndex(match => match === index)]
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
                            </div>
                          </motion.div>
                        ))}
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
            )}
            
            {/* TRUE/FALSE TAB */}
            {activeTab === "truefalse" && (
              <motion.div 
                key="truefalse"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl mx-auto"
              >
                <motion.div 
                  key={currentTFIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="mb-8">
                      <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
                        True/False Question {currentTFIndex + 1} of {trueFalseQuestions.length}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4">
                        {trueFalseQuestions[currentTFIndex]?.question}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-6 rounded-lg cursor-pointer border transition-all ${
                          selectedTFAnswer === true
                            ? selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue
                              ? "bg-green-50 dark:bg-green-900/30 border-green-500 shadow-md"
                              : "bg-red-50 dark:bg-red-900/30 border-red-500 shadow-md"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
                        }`}
                        onClick={() => !selectedTFAnswer && handleTFAnswerSelect(true)}
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
                        </div>
                        
                        {selectedTFAnswer === true && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="absolute top-2 right-2"
                          >
                            {selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue ? (
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
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-6 rounded-lg cursor-pointer border transition-all ${
                          selectedTFAnswer === false
                            ? selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue
                              ? "bg-green-50 dark:bg-green-900/30 border-green-500 shadow-md"
                              : "bg-red-50 dark:bg-red-900/30 border-red-500 shadow-md"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
                        }`}
                        onClick={() => !selectedTFAnswer && handleTFAnswerSelect(false)}
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
                        </div>
                        
                        {selectedTFAnswer === false && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="absolute top-2 right-2"
                          >
                            {selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue ? (
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
                      </motion.div>
                    </div>
                    
                    {showTFResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        className={`mt-8 p-4 rounded-lg border ${
                          selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}
                      >
                        <h4 className={`font-medium mb-1 ${
                          selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue
                            ? "text-green-800 dark:text-green-300"
                            : "text-red-800 dark:text-red-300"
                        }`}>
                          {selectedTFAnswer === trueFalseQuestions[currentTFIndex].isTrue
                            ? "Correct!"
                            : "Incorrect!"
                          }
                        </h4>
                        <p className="text-gray-800 dark:text-white">
                          The statement is {trueFalseQuestions[currentTFIndex].isTrue ? "TRUE" : "FALSE"}.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
                
                <div className="flex justify-between items-center mt-8 px-4">
                  <Button 
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      currentTFIndex > 0 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={prevTF}
                    disabled={currentTFIndex === 0}
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
                          index === currentTFIndex 
                            ? "w-8 bg-blue-500" 
                            : "w-2 bg-gray-300 dark:bg-gray-600"
                        }`}
                      ></div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      currentTFIndex < trueFalseQuestions.length - 1 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={nextTF}
                    disabled={currentTFIndex === trueFalseQuestions.length - 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizPage;