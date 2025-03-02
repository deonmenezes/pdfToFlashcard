'use client'
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import QuizPage from '../quizPage/quizPage';
import { motion, AnimatePresence } from 'framer-motion';

// Define TypeScript interfaces for all question types
interface Flashcard {
  question: string;
  answer: string;
}

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

// Define MatchingQuestion interface to match what QuizPage expects
interface MatchingQuestion {
  id: number;
  question: string;
  leftItems: string[];
  rightItems: string[];
  correctMatches: number[]; // Array of indices that map left items to right items
}

interface TrueFalseQuestion {
  id: number;
  question: string;
  isTrue: boolean;
}

// Define supported file types
const SUPPORTED_FILE_TYPES = [
  '.pdf', '.ppt', '.pptx',       // PowerPoint
  '.doc', '.docx',               // Word
  '.txt', '.rtf',                // Text files
  '.xls', '.xlsx', '.csv'        // Excel
];

const HeroSection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [matchingQuestions, setMatchingQuestions] = useState<MatchingQuestion[]>([]);
  const [trueFalseQuestions, setTrueFalseQuestions] = useState<TrueFalseQuestion[]>([]);
  const [showQuizPage, setShowQuizPage] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo data for flashcards and MCQs
  const demoFlashcards: Flashcard[] = [
    { question: "What is photosynthesis?", answer: "The process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll." },
    { question: "What is the capital of France?", answer: "Paris" },
    { question: "What is Newton's First Law?", answer: "An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force." }
  ];

  const demoMCQs: MCQ[] = [
    { 
      question: "What is the main function of mitochondria?", 
      options: [
        "Protein synthesis", 
        "Cellular respiration", 
        "Photosynthesis", 
        "Cell division"
      ], 
      correctAnswer: 1 
    },
    { 
      question: "Which planet is known as the Red Planet?", 
      options: [
        "Venus", 
        "Jupiter", 
        "Mars", 
        "Saturn"
      ], 
      correctAnswer: 2 
    }
  ];

  // Updated demo matching questions with randomized indices
  const demoMatchingQuestions: MatchingQuestion[] = [
    {
      id: 1,
      question: "Match the chemical compounds with their formulas:",
      leftItems: ["Water", "Oxygen", "Carbon Dioxide", "Glucose"],
      rightItems: ["H₂O", "O₂", "CO₂", "C₆H₁₂O₆"],
      // Using random matches for proper randomization
      correctMatches: [0, 1, 2, 3] // These will be shuffled when displayed
    },
    {
      id: 2,
      question: "Match the countries with their capitals:",
      leftItems: ["France", "Germany", "Italy", "Spain"],
      rightItems: ["Paris", "Berlin", "Rome", "Madrid"],
      // Using random matches for proper randomization
      correctMatches: [0, 1, 2, 3] // These will be shuffled when displayed
    }
  ];

  const demoTrueFalseQuestions: TrueFalseQuestion[] = [
    {
      id: 1,
      question: "The Earth revolves around the Sun.",
      isTrue: true
    },
    {
      id: 2,
      question: "The human body has 206 bones.",
      isTrue: true
    },
    {
      id: 3,
      question: "Sound travels faster in water than in air.",
      isTrue: true
    },
    {
      id: 4,
      question: "The Great Wall of China is visible from space with the naked eye.",
      isTrue: false
    }
  ];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const checkFileType = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return SUPPORTED_FILE_TYPES.some(ext => fileName.endsWith(ext));
  };

  const getFileTypeIcon = (fileName: string) => {
    const lowerCaseName = fileName.toLowerCase();
    
    if (lowerCaseName.endsWith('.pdf')) {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    } else if (lowerCaseName.endsWith('.ppt') || lowerCaseName.endsWith('.pptx')) {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M12 7v5m0 2v.01';
    } else if (lowerCaseName.endsWith('.doc') || lowerCaseName.endsWith('.docx')) {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M9 9h6m-6 4h6';
    } else if (lowerCaseName.endsWith('.xls') || lowerCaseName.endsWith('.xlsx') || lowerCaseName.endsWith('.csv')) {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M9 7h1m-1 4h6m-6 4h6';
    } else {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
  };

  const handleFile = (file: File) => {
    setFileError(null);
    
    if (!checkFileType(file)) {
      setFileError(`File type not supported. Please upload one of these formats: ${SUPPORTED_FILE_TYPES.join(', ')}`);
      return;
    }
    
    setFile(file);
    setIsProcessing(true);
    
    // Simulate processing time (e.g., API call)
    setTimeout(() => {
      // Prepare the matching questions with shuffled right items
      const processedMatchingQuestions = demoMatchingQuestions.map(q => {
        // Create a copy of the question
        const questionCopy = { ...q };
        
        // Create a mapping of original indices to shuffled indices
        const shuffledIndices = [...Array(q.rightItems.length).keys()];
        // Shuffle the indices
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        
        // Shuffle the right items using the shuffled indices
        const shuffledRightItems = shuffledIndices.map(i => q.rightItems[i]);
        
        // Update the correctMatches to reflect the new positions
        const newCorrectMatches = q.correctMatches.map(originalIndex => 
          shuffledIndices.findIndex(shuffledIndex => shuffledIndex === originalIndex)
        );
        
        // Return the updated question
        return {
          ...q,
          rightItems: shuffledRightItems,
          correctMatches: newCorrectMatches
        };
      });
      
      setFlashcards(demoFlashcards);
      setMcqs(demoMCQs);
      setMatchingQuestions(processedMatchingQuestions);
      setTrueFalseQuestions(demoTrueFalseQuestions);
      setIsProcessing(false);
      
      // After processing, show the Quiz page
      setShowQuizPage(true);
    }, 2000);
  };

  return (
    <AnimatePresence mode="sync">
      {!showQuizPage ? (
        <motion.div 
          key="hero"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-16 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="mb-12 lg:mb-0 lg:max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                    Transform Your Documents into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Interactive Quizzes</span>
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Upload any document (PDF, Word, PowerPoint, Excel, or Text) and instantly generate customized flashcards and multiple-choice questions to enhance your learning experience.
                  </p>
                  {!file && (
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <Button 
                        className="text-lg py-6 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Try it Now
                      </Button>
                      <input 
                        type="file" 
                        accept={SUPPORTED_FILE_TYPES.join(',')} 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileInput}
                      />
                      <Button variant="outline" className="text-lg py-6 px-8 dark:text-white dark:border-gray-600">
                        Learn More
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="lg:w-1/2"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 relative">
                  <div className="absolute -top-4 -left-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    AI-Powered
                  </div>
                  
                  {!file ? (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`border-4 border-dashed rounded-xl p-8 text-center transition-all h-64 flex flex-col items-center justify-center ${
                        isDragging 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-gray-300 dark:border-gray-700"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-16 w-16 text-blue-500 mb-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                          />
                        </svg>
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        Drag & Drop Your Document
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        Supported formats: PDF, PPT, Word, Excel, Text
                      </p>
                      {fileError && (
                        <p className="text-red-500 text-sm mb-2">{fileError}</p>
                      )}
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                      >
                        Choose File
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="h-64">
                      {isProcessing && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4 h-64">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                          />
                          <div className="text-center">
                            <h3 className="font-bold text-gray-800 dark:text-white">Processing "{file.name}"</h3>
                            <p className="text-gray-600 dark:text-gray-400">Generating learning materials...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="quizPage"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          {/* Render the QuizPage component with its props */}
          <QuizPage 
              file={file}
              flashcards={flashcards}
              mcqs={mcqs}
              matchingQuestions={matchingQuestions}
              trueFalseQuestions={trueFalseQuestions}
              onBackToUpload={() => {
                // Reset states so that the drag & drop area and animations reappear
                setShowQuizPage(false);
                setFile(null);
                setFlashcards([]);
                setMcqs([]);
                setMatchingQuestions([]);
                setTrueFalseQuestions([]);
                setIsProcessing(false);
                setFileError(null);
              }}          
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeroSection; 