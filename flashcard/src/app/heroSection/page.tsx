'use client'
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import QuizPage from '../quizPage/quizPage';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from "@/components/ui/switch"; // Import Switch component
import { FILE } from 'dns';

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

interface MatchingQuestion {
  id: number;
  question: string;
  leftItems: string[];
  rightItems: string[];
  correctMatches: number[];
}

interface TrueFalseQuestion {
  id: number;
  question: string;
  isTrue: boolean;
}

// Define API request type
interface GeminiRequest {
  fileContent: string;
  fileName: string;
  fileType: string;
  customPrompt?: string; // Add optional custom prompt
}

// Define API response type
interface GeminiResponse {
  flashcards: Flashcard[];
  mcqs: MCQ[];
  matchingQuestions: MatchingQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
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
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [matchingQuestions, setMatchingQuestions] = useState<MatchingQuestion[]>([]);
  const [trueFalseQuestions, setTrueFalseQuestions] = useState<TrueFalseQuestion[]>([]);
  const [showQuizPage, setShowQuizPage] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('idle');
  const [extractedTextPreview, setExtractedTextPreview] = useState<string | null>(null);
  const isProcessing = processingStatus !== 'idle';
  // Add these state variables to track multiple file processing
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [processingFilename, setProcessingFilename] = useState<string>('');
  
  // New state variables for custom prompt
  const [useCustomPrompt, setUseCustomPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Fallback demo data (in case API fails)
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

  const demoMatchingQuestions: MatchingQuestion[] = [
    {
      id: 1,
      question: "Match the chemical compounds with their formulas:",
      leftItems: ["Water", "Oxygen", "Carbon Dioxide", "Glucose"],
      rightItems: ["H₂O", "O₂", "CO₂", "C₆H₁₂O₆"],
      correctMatches: [0, 1, 2, 3]
    },
    {
      id: 2,
      question: "Match the countries with their capitals:",
      leftItems: ["France", "Germany", "Italy", "Spain"],
      rightItems: ["Paris", "Berlin", "Rome", "Madrid"],
      correctMatches: [0, 1, 2, 3]
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Process multiple files from drag and drop
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Process multiple files
      processMultipleFiles(e.target.files);
    }
  };
  
  // Function to process multiple files
  const processMultipleFiles = async (files: FileList) => {
    setFileError(null);
    setApiError(null);
    
    // Convert FileList to array for easier processing
    const fileArray = Array.from(files);
    
    // Filter only supported file types
    const supportedFiles = fileArray.filter(file => checkFileType(file));
    
    if (supportedFiles.length === 0) {
      setFileError(`No supported files found. Please upload one of these formats: ${SUPPORTED_FILE_TYPES.join(', ')}`);
      return;
    }
    
    // Setup for multiple file processing
    setTotalFiles(supportedFiles.length);
    setProcessedFiles(0);
    setProcessingStatus('reading');
    
    // Process each file and combine results
    const allFlashcards: Flashcard[] = [];
    const allMcqs: MCQ[] = [];
    const allMatchingQuestions: MatchingQuestion[] = [];
    const allTrueFalseQuestions: TrueFalseQuestion[] = [];
    
    try {
      for (let i = 0; i < supportedFiles.length; i++) {
        const currentFile = supportedFiles[i];
        setFile(currentFile);
        setProcessingFilename(currentFile.name);
        setProcessedFiles(i);
        
        setExtractedTextPreview(`Processing file ${i+1} of ${supportedFiles.length}: ${currentFile.name}...`);
        
        // Process file with Gemini API
        const generatedQuestions = await generateQuestionsWithGemini(currentFile);
        
        // Combine results
        allFlashcards.push(...generatedQuestions.flashcards);
        allMcqs.push(...generatedQuestions.mcqs);
        allMatchingQuestions.push(...generatedQuestions.matchingQuestions);
        allTrueFalseQuestions.push(...generatedQuestions.trueFalseQuestions);
      }
      
      // Update state with combined questions
      setFlashcards(allFlashcards);
      setMcqs(allMcqs);
      setMatchingQuestions(allMatchingQuestions);
      setTrueFalseQuestions(allTrueFalseQuestions);
      
      // Show the Quiz page
      setShowQuizPage(true);
    } catch (error) {
      console.error("Error processing files:", error);
      setApiError("An error occurred while processing your files. Please try again.");
      
      // Fallback to demo data
      setFlashcards(demoFlashcards);
      setMcqs(demoMCQs);
      setMatchingQuestions(demoMatchingQuestions);
      setTrueFalseQuestions(demoTrueFalseQuestions);
      
      setShowQuizPage(true);
    } finally {
      setProcessingStatus('idle');
      setTotalFiles(0);
      setProcessedFiles(0);
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

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file content"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      
      // For all file types, use readAsDataURL to get base64 encoding
      reader.readAsDataURL(file);
    });
  };

  const getFileType = (fileName: string): string => {
    const lowerCaseName = fileName.toLowerCase();
    const extension = lowerCaseName.split('.').pop() || '';
    
    if (extension === 'pdf') {
      return 'pdf';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'spreadsheet';
    } else if (['txt', 'rtf', 'md'].includes(extension)) {
      return 'text';
    } else {
      return 'unknown';
    }
  };

  const generateQuestionsWithGemini = async (file: File) => {
    try {
      // Read file content
      const fileContent = await readFileContent(file);
      const fileType = getFileType(file.name);
      
      // Prepare request payload
      const payload: GeminiRequest = {
        fileContent: typeof fileContent === 'string' ? fileContent : Buffer.from(fileContent).toString('base64'),
        fileName: file.name,
        fileType: fileType
      };
      
      // Add custom prompt if enabled
      if (useCustomPrompt && customPrompt.trim()) {
        payload.customPrompt = customPrompt.trim();
      }
      
      try {
        // Make API call to your backend that will call Gemini API
        const response = await fetch('/api/gemini/generate-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          console.warn(`API returned error status: ${response.status} ${response.statusText}`);
          // Instead of throwing immediately, we'll return demo data
          return {
            flashcards: demoFlashcards,
            mcqs: demoMCQs,
            matchingQuestions: demoMatchingQuestions,
            trueFalseQuestions: demoTrueFalseQuestions
          };
        }
        
        const data: GeminiResponse = await response.json();
        
        // Process matching questions to shuffle right items
        const processedMatchingQuestions = data.matchingQuestions.map(q => {
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
        
        return {
          flashcards: data.flashcards,
          mcqs: data.mcqs,
          matchingQuestions: processedMatchingQuestions,
          trueFalseQuestions: data.trueFalseQuestions
        };
      } catch (fetchError) {
        console.error("API fetch error:", fetchError);
        setApiError("Failed to call question generation API. Using demo questions instead.");
        
        // Return demo data as fallback
        return {
          flashcards: demoFlashcards,
          mcqs: demoMCQs,
          matchingQuestions: demoMatchingQuestions,
          trueFalseQuestions: demoTrueFalseQuestions
        };
      }
      
    } catch (error) {
      console.error("Error processing file:", error);
      setApiError("Failed to generate questions. Using demo questions instead.");
      
      // Return demo data as fallback
      return {
        flashcards: demoFlashcards,
        mcqs: demoMCQs,
        matchingQuestions: demoMatchingQuestions.map(q => ({
          ...q,
          // Add random shuffling for demo data too
          correctMatches: q.correctMatches.map((_, i) => i)
        })),
        trueFalseQuestions: demoTrueFalseQuestions
      };
    }
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    setApiError(null);
    setExtractedTextPreview(null);
    
    if (!checkFileType(file)) {
      setFileError(`File type not supported. Please upload one of these formats: ${SUPPORTED_FILE_TYPES.join(', ')}`);
      return;
    }
    
    setFile(file);
    setProcessingStatus('reading');
    
    try {
      // Reading file
      const fileContent = await readFileContent(file);
      setProcessingStatus('extracting');
      
      // Show preview of content being processed
      if (file.type.includes('text')) {
        const textPreview = fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : '');
        setExtractedTextPreview(textPreview);
      } else {
        setExtractedTextPreview("Extracting content from " + file.name + "...");
      }
      
      setProcessingStatus('generating');
      const generatedQuestions = await generateQuestionsWithGemini(file);
    
      // Update state with generated questions
      setFlashcards(generatedQuestions.flashcards);
      setMcqs(generatedQuestions.mcqs);
      setMatchingQuestions(generatedQuestions.matchingQuestions);
      setTrueFalseQuestions(generatedQuestions.trueFalseQuestions);
      
      // Show the Quiz page
      setShowQuizPage(true);
    } catch (error) {
      console.error("Error processing file:", error);
      setApiError("An error occurred while processing your file. Please try again.");
      
      // Fallback to demo data
      setFlashcards(demoFlashcards);
      setMcqs(demoMCQs);
      setMatchingQuestions(demoMatchingQuestions);
      setTrueFalseQuestions(demoTrueFalseQuestions);
      
      setShowQuizPage(true);
    } finally {
      setProcessingStatus('idle');
    }
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
                    Upload any document and our AI will instantly generate customized flashcards and quiz questions to enhance your learning experience.
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
                        multiple // Enable multiple file selection
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
                    <div>
                      {/* Custom Prompt Toggle */}
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={useCustomPrompt} 
                            onCheckedChange={setUseCustomPrompt} 
                            id="custom-prompt-toggle" 
                          />
                          <label 
                            htmlFor="custom-prompt-toggle" 
                            className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300"
                          >
                            Use Custom Prompt
                          </label>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Customize how questions are generated
                        </div>
                      </div>
                      
                      {/* Custom Prompt Input - only show when toggle is on */}
                      {useCustomPrompt && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6"
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Enter your custom prompt:
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="E.g., Focus on specific topics, create questions suitable for beginners, emphasize key concepts..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            rows={4}
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Your instructions to the AI about what kind of questions to generate
                          </p>
                        </motion.div>
                      )}
                    
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
                          Drag & Drop Your Documents
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          Supported formats: PDF, PPT, Word, Excel, Text
                        </p>
                        {fileError && (
                          <p className="text-red-500 text-sm mb-2">{fileError}</p>
                        )}
                        {apiError && (
                          <p className="text-red-500 text-sm mb-2">{apiError}</p>
                        )}
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                          Choose Files
                        </Button>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="h-64">
                      {isProcessing && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4 h-64">
                          <div className="w-full">
                            {totalFiles > 1 && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                  <span>Processing files: {processedFiles}/{totalFiles}</span>
                                  <span>{Math.round((processedFiles/totalFiles) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                  <div 
                                    className="bg-blue-500 h-2.5 rounded-full" 
                                    style={{ width: `${(processedFiles/totalFiles) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                          />
                          
                          <div className="text-center">
                            <h3 className="font-bold text-gray-800 dark:text-white">
                              {totalFiles > 1 
                                ? `Processing ${processedFiles+1}/${totalFiles}: "${processingFilename}"`
                                : `Processing "${file?.name}"`}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {processingStatus === 'reading' && "Reading file..."}
                              {processingStatus === 'extracting' && "Extracting content..."}
                              {processingStatus === 'generating' && "Generating questions with Gemini AI..."}
                            </p>
                            {extractedTextPreview && (
                              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded max-h-24 overflow-y-auto text-sm text-left">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Content Preview:</p>
                                {extractedTextPreview}
                              </div>
                            )}
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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        <QuizPage 
        file={file}  // Change from fileName to file
        flashcards={flashcards} 
        mcqs={mcqs} 
        matchingQuestions={matchingQuestions} 
        trueFalseQuestions={trueFalseQuestions}
        onBackToUpload={() => {  // Change from onBack to onBackToUpload
          setShowQuizPage(false);
          setFile(null);
          setProcessingStatus('idle');
          setExtractedTextPreview(null);
        }}
      />
      </motion.div>
    )}
  </AnimatePresence>
);
};

export default HeroSection;