'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizPage from '../quizPage/quizPage';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from "@/components/ui/switch"; 
import { MCQ } from '../components/MCQS/mcq-types';
import { MCQGenerator } from '../components/MCQS/mcq-utils';
import { Flashcard } from '../components/flashcards/flashcard-types';
import { FlashcardGenerator } from '../components/flashcards/flashcard-utils';
import { TrueFalseQuestion } from '../components/trueOrFalse/true-false-type';
import { TrueFalseQuestionGenerator } from '../components/trueOrFalse/true-false-utils';
import { MatchingQuestion } from '../components/matching-questions/matching-question-type';
import { MatchingQuestionGenerator } from '../components/matching-questions/matching-question-utils';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';

interface GeminiRequest {
  fileContent: string;
  fileName: string;
  fileType: string;
  customPrompt?: string;
  quantities?: {
    flashcards: number;
    mcqs: number;
    matching: number;
    trueFalse: number;
  }
}

interface GeminiResponse {
  flashcards: Flashcard[];
  mcqs: MCQ[];
  matchingQuestions: MatchingQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
}

const SUPPORTED_FILE_TYPES = [
  '.pdf', '.ppt', '.pptx',
  '.doc', '.docx',
  '.txt', '.rtf',
  '.xls', '.xlsx', '.csv'
];

const HeroSection: React.FC = () => {
  const router = useRouter();
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
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [processingFilename, setProcessingFilename] = useState<string>('');
  const [useCustomPrompt, setUseCustomPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  // Still track auth state but don't display it upfront
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [questionQuantities, setQuestionQuantities] = useState({
    flashcards: 5,
    mcqs: 5,
    matching: 2,
    trueFalse: 5
  });
  
  // Add the missing states
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [customText, setCustomText] = useState<string>('');
  
  // Add this function to handle quantity changes
  const handleQuantityChange = (type: 'flashcards' | 'mcqs' | 'matching' | 'trueFalse', value: number) => {
    setQuestionQuantities(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const isProcessing = processingStatus !== 'idle';
  
  // Fallback demo data
  const demoFlashcards: Flashcard[] = FlashcardGenerator.getDemoFlashcards();
  const demoMCQs: MCQ[] = MCQGenerator.getDemoMCQs();
  const demoMatchingQuestions: MatchingQuestion[] = MatchingQuestionGenerator.getDemoMatchingQuestions();
  const demoTrueFalseQuestions: TrueFalseQuestion[] = TrueFalseQuestionGenerator.getDemoTrueFalseQuestions();

  // Check authentication state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsAuthLoading(false);
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
      
      // Process pending files if user is now logged in
      if (currentUser && pendingFiles) {
        processMultipleFiles(pendingFiles);
        setPendingFiles(null); // Clear pending files after processing
      }
    });
  
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [pendingFiles]); // Add pendingFiles as dependency

  // Redirect to login only when an upload is attempted
  const handleAuthRequiredAction = () => {
    if (!isLoggedIn && !isAuthLoading) {
      // If file is selected, store file info in localStorage
      if (file) {
        sessionStorage.setItem('pendingFileName', file.name);
        sessionStorage.setItem('pendingFileSize', file.size.toString());
        sessionStorage.setItem('pendingFileType', file.type);
      }
      
      toast.info("Just one more step to create your quiz!", {
        description: "Please log in to continue processing your document"
      });
      router.push('/login');
      return false;
    }
    return true;
  };
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
      // Set the file first to show user their upload was received
      setFile(e.dataTransfer.files[0]);
      
      // Store pending files for processing after login if needed
      setPendingFiles(e.dataTransfer.files);
      
      // Then check auth and redirect if needed
      if (!handleAuthRequiredAction()) return;
      
      // Only continue with processing if auth passed
      processMultipleFiles(e.dataTransfer.files);
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Set the file first to show user their upload was received
      setFile(e.target.files[0]);
      
      // Store pending files for processing after login if needed
      setPendingFiles(e.target.files);
      
      // Then check auth and redirect if needed
      if (!handleAuthRequiredAction()) return;
      
      // Only continue with processing if auth passed
      processMultipleFiles(e.target.files);
    }
  };
  const handleCustomTextSubmit = async () => {
    if (!customText.trim()) {
      setFileError("Please enter some text content first.");
      return;
    }
    
    if (!handleAuthRequiredAction()) return;
    
    setFileError(null);
    setApiError(null);
    setProcessingStatus('generating');
    
    try {
      // Create a virtual file-like object
      const textBlob = new Blob([customText], { type: 'text/plain' });
      const textFile = new File([textBlob], "custom-text.txt", { type: 'text/plain' });
      setFile(textFile);
      
      // Process the text content
      const generatedQuestions = await generateQuestionsWithGemini(textFile);
      
      // Update states with generated questions
      setFlashcards(generatedQuestions.flashcards);
      setMcqs(generatedQuestions.mcqs);
      setMatchingQuestions(generatedQuestions.matchingQuestions);
      setTrueFalseQuestions(generatedQuestions.trueFalseQuestions);
      
      // Show the Quiz page
      setShowQuizPage(true);
    } catch (error) {
      console.error("Error processing custom text:", error);
      setApiError("An error occurred while processing your text. Please try again.");
      
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
  // Function to process multiple files
  const processMultipleFiles = async (files: FileList) => {
    setFileError(null);
    setApiError(null);
    
    // Convert FileList to array for easier processing
    const fileArray = Array.from(files);
    
    // Add this line to create allMcqs array
    const allMcqs: MCQ[] = [];
    
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
    
    // Add the handleCustomTextSubmit function
   
    
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
        flashcards.push(...generatedQuestions.flashcards);
        allMcqs.push(...generatedQuestions.mcqs);
        matchingQuestions.push(...generatedQuestions.matchingQuestions);
        trueFalseQuestions.push(...generatedQuestions.trueFalseQuestions);
      }
      
      // Update state with combined questions
      setFlashcards(flashcards);
      setMcqs(allMcqs);
      setMatchingQuestions(matchingQuestions);
      setTrueFalseQuestions(trueFalseQuestions);
      
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

  // Update the generateQuestionsWithGemini function
  const generateQuestionsWithGemini = async (file: File) => {
    try {
      // Read file content
      const fileContent = await readFileContent(file);
      const fileType = getFileType(file.name);
      
      // Initialize empty arrays for combined results
      const allFlashcards: Flashcard[] = [];
      const allMcqs: MCQ[] = [];
      const allMatchingQuestions: MatchingQuestion[] = [];
      const allTrueFalseQuestions: TrueFalseQuestion[] = [];
      
      // Prepare request payload
      const payload: GeminiRequest = {
        fileContent: typeof fileContent === 'string' ? fileContent : Buffer.from(fileContent).toString('base64'),
        fileName: file.name,
        fileType: fileType,
        // Add question quantities to the payload
        quantities: {
          flashcards: questionQuantities.flashcards,
          mcqs: questionQuantities.mcqs,
          matching: questionQuantities.matching,
          trueFalse: questionQuantities.trueFalse
        }
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
          // Return demo data if API call fails
          return {
            flashcards: FlashcardGenerator.getDemoFlashcards(),
            mcqs: MCQGenerator.getDemoMCQs(),
            matchingQuestions: demoMatchingQuestions,
            trueFalseQuestions: TrueFalseQuestionGenerator.getDemoTrueFalseQuestions()
          };
        }
        
        const data: GeminiResponse = await response.json();
        
        // Process Flashcards
        const processedFlashcards = FlashcardGenerator.processFlashcards(data.flashcards);
  
        // Process MCQs: shuffle options and validate
        let processedMCQs = data.mcqs.map(mcq => 
          MCQGenerator.shuffleMCQOptions(mcq)
        );
  
        // Validate MCQs
        if (!MCQGenerator.validateMCQs(processedMCQs)) {
          console.warn('Some MCQs are invalid. Falling back to demo MCQs.');
          processedMCQs = MCQGenerator.getDemoMCQs();
        }
        
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
        
        // Process True/False questions
        const processedTrueFalseQuestions = TrueFalseQuestionGenerator.balanceTrueFalseQuestions(
          data.trueFalseQuestions
        );
        
        return {
          flashcards: processedFlashcards,
          mcqs: processedMCQs,
          matchingQuestions: processedMatchingQuestions,
          trueFalseQuestions: processedTrueFalseQuestions
        };
      } catch (fetchError) {
        console.error("API fetch error:", fetchError);
        setApiError("Failed to call question generation API. Using demo questions instead.");
        
        // Return demo data as fallback
        return {
          flashcards: FlashcardGenerator.getDemoFlashcards(),
          mcqs: MCQGenerator.getDemoMCQs(),
          matchingQuestions: demoMatchingQuestions,
          trueFalseQuestions: TrueFalseQuestionGenerator.getDemoTrueFalseQuestions()
        };
      }
      
    } catch (error) {
      console.error("Error processing file:", error);
      setApiError("Failed to generate questions. Using demo questions instead.");
      
      // Return demo data as fallback
      return {
        flashcards: FlashcardGenerator.getDemoFlashcards(),
        mcqs: MCQGenerator.getDemoMCQs(),
        matchingQuestions: demoMatchingQuestions.map(q => ({
          ...q,
          // Add random shuffling for demo data too
          correctMatches: q.correctMatches.map((_, i) => i)
        })),
        trueFalseQuestions: TrueFalseQuestionGenerator.getDemoTrueFalseQuestions()
      };
    }
  };

  // Handle button click for "Try it Now" - don't check auth initially
  const handleTryItNowClick = () => {
    fileInputRef.current?.click();
  };

  function handleGenerateMore(type: 'flashcards' | 'mcqs' | 'matching' | 'trueFalse', quantity: number): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!file) {
        toast.error("No file available to generate additional questions");
        reject(new Error("No file available"));
        return;
      }
  
      try {
        setProcessingStatus('generating');
        setExtractedTextPreview(`Generating additional ${quantity} ${type}...`);
        
        // Create a request payload with just the specific question type quantity
        const modifiedQuantities = {
          flashcards: type === 'flashcards' ? quantity : 0,
          mcqs: type === 'mcqs' ? quantity : 0,
          matching: type === 'matching' ? quantity : 0,
          trueFalse: type === 'trueFalse' ? quantity : 0
        };
        
        // Prepare request payload
        const payload: GeminiRequest = {
          fileContent: await readFileContent(file),
          fileName: file.name,
          fileType: getFileType(file.name),
          quantities: modifiedQuantities
        };
        
        // Add custom prompt if enabled
        if (useCustomPrompt && customPrompt.trim()) {
          payload.customPrompt = customPrompt.trim();
        }
        
        // Make API call
        const response = await fetch('/api/gemini/generate-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error(`API returned error status: ${response.status}`);
        }
        
        const data: GeminiResponse = await response.json();
        
        // Process and add new questions based on type
        if (type === 'flashcards') {
          const newFlashcards = FlashcardGenerator.processFlashcards(data.flashcards);
          setFlashcards(prev => [...prev, ...newFlashcards]);
        } else if (type === 'mcqs') {
          const newMCQs = data.mcqs.map(mcq => MCQGenerator.shuffleMCQOptions(mcq));
          setMcqs(prev => [...prev, ...newMCQs]);
        } else if (type === 'matching') {
          const newMatchingQuestions = data.matchingQuestions.map(q => {
            // Create shuffled indices
            const shuffledIndices = [...Array(q.rightItems.length).keys()];
            for (let i = shuffledIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
            }
            
            // Shuffle right items
            const shuffledRightItems = shuffledIndices.map(i => q.rightItems[i]);
            
            // Update correct matches
            const newCorrectMatches = q.correctMatches.map(originalIndex => 
              shuffledIndices.findIndex(shuffledIndex => shuffledIndex === originalIndex)
            );
            
            return {
              ...q,
              rightItems: shuffledRightItems,
              correctMatches: newCorrectMatches
            };
          });
          setMatchingQuestions(prev => [...prev, ...newMatchingQuestions]);
        } else if (type === 'trueFalse') {
          const newTrueFalseQuestions = TrueFalseQuestionGenerator.balanceTrueFalseQuestions(
            data.trueFalseQuestions
          );
          setTrueFalseQuestions(prev => [...prev, ...newTrueFalseQuestions]);
        }
        
        toast.success(`Successfully generated ${quantity} additional ${type} questions!`);
        resolve();
      } catch (error) {
        console.error(`Error generating more ${type}:`, error);
        toast.error(`Failed to generate additional ${type} questions. Please try again.`);
        reject(error);
      } finally {
        setProcessingStatus('idle');
        setExtractedTextPreview(null);
      }
    });
  }

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
                      Upload any document or enter text directly and our AI will instantly generate customized flashcards and quiz questions to enhance your learning experience.
                    </p>
    
                    {!file && (
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <Button 
                          className="text-lg py-6 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          onClick={() => inputMode === 'file' ? handleTryItNowClick() : setInputMode('text')}
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
                        {/* Custom Prompt Toggle - Only show if already logged in */}
                        {isLoggedIn && (
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
                          
                        )}
                        
                        {/* Custom Prompt Input - only show when toggle is on and user is logged in */}
                        {useCustomPrompt && isLoggedIn && (
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
                        
                        {/* Tabs to switch between file upload and text input */}
                        <Tabs 
                          defaultValue="file" 
                          onValueChange={(value) => setInputMode(value as 'file' | 'text')}
                          className="w-full mb-6"
                        >
                          <TabsList className="grid grid-cols-2 mb-4">
                            <TabsTrigger value="file">Upload File</TabsTrigger>
                            <TabsTrigger value="text">Enter Text</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="file">
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
                                onClick={handleTryItNowClick} 
                                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                              >
                                Choose Files
                              </Button>
                            </motion.div>
                          </TabsContent>
                          
                          <TabsContent value="text">
                            <div className="h-64 flex flex-col">
                              <textarea
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                placeholder="Paste or type your content here..."
                                className="w-full h-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                              />
                              {fileError && (
                                <p className="text-red-500 text-sm mt-2">{fileError}</p>
                              )}
                              {apiError && (
                                <p className="text-red-500 text-sm mt-2">{apiError}</p>
                              )}
                              <Button 
                                onClick={handleCustomTextSubmit} 
                                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                                disabled={!customText.trim() || isProcessing}
                              >
                                Generate Quiz
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    ) : (
                      <div className="h-64">
                        {isProcessing && (
                          <div className="flex flex-col items-center justify-center p-8 space-y-4 h-64">
                            <div className="w-full">
                              {totalFiles > 1 && inputMode === 'file' && (
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
                                {inputMode === 'file' 
                                  ? (totalFiles > 1 
                                    ? `Processing ${processedFiles+1}/${totalFiles}: "${processingFilename}"`
                                    : `Processing "${file?.name}"`)
                                  : "Processing your text input"}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {processingStatus === 'reading' && "Reading content..."}
                                {processingStatus === 'extracting' && "Extracting content..."}
                                {processingStatus === 'generating' && "Generating questions with Quizitt Engine..."}
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
              file={file}
              flashcards={flashcards} 
              mcqs={mcqs} 
              matchingQuestions={matchingQuestions} 
              trueFalseQuestions={trueFalseQuestions}
              onBackToUpload={() => {
                setShowQuizPage(false);
                setFile(null);
                setProcessingStatus('idle');
                setExtractedTextPreview(null);
                setCustomText('');
              }}
              onGenerateMore={handleGenerateMore}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
};

export default HeroSection;