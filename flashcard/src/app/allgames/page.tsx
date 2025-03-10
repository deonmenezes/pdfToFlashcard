'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Define types for the processed data
interface GameItem {
  count: number;
  sample: string;
}

interface ProcessedData {
  fileName: string;
  fileSize: number;
  games: {
    flashcards: GameItem;
    quiz: GameItem;
    matching: GameItem;
    trueFalse: GameItem;
  };
}

// Supported file types for document upload
const SUPPORTED_FILE_TYPES = [
  '.pdf', '.ppt', '.pptx',
  '.doc', '.docx',
  '.txt', '.rtf',
  '.xls', '.xlsx', '.csv'
];

const AIGamesPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [inputMode, setInputMode] = useState('file');
  const [customText, setCustomText] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Check auth state on component mount
  useEffect(() => {
    // Simulating auth check - replace with your actual auth logic
    const checkAuth = setTimeout(() => {
      setIsAuthLoading(false);
      // For demo purposes, assume user is logged in
      setIsLoggedIn(true);
    }, 1000);
    
    return () => clearTimeout(checkAuth);
  }, []);

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (checkFileType(droppedFile)) {
        setFile(droppedFile);
        setFileError(null);
        processDocument(droppedFile);
      } else {
        setFileError(`Unsupported file type. Please upload one of these formats: ${SUPPORTED_FILE_TYPES.join(', ')}`);
      }
    }
  };

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (checkFileType(selectedFile)) {
        setFile(selectedFile);
        setFileError(null);
        processDocument(selectedFile);
      } else {
        setFileError(`Unsupported file type. Please upload one of these formats: ${SUPPORTED_FILE_TYPES.join(', ')}`);
      }
    }
  };

  // Handle text input submission
  const handleTextSubmit = () => {
    if (!customText.trim()) {
      setFileError("Please enter some text content first.");
      return;
    }
    
    // Create a virtual file for processing
    const textBlob = new Blob([customText], { type: 'text/plain' });
    const textFile = new File([textBlob], "custom-text.txt", { type: 'text/plain' });
    setFile(textFile);
    setFileError(null);
    processDocument(textFile);
  };

  // Check if file type is supported
  const checkFileType = (file: File) => {
    const fileName = file.name.toLowerCase();
    return SUPPORTED_FILE_TYPES.some(ext => fileName.endsWith(ext));
  };

  // Process document with Gemini AI
  const processDocument = async (documentFile: File) => {
    setIsProcessing(true);
    setProcessingStatus('reading');
    
    try {
      // Simulate file reading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStatus('extracting');
      // Simulate content extraction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStatus('generating');
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock processed data - in a real app, this would come from your Gemini API call
      const mockProcessedData: ProcessedData = {
        fileName: documentFile.name,
        fileSize: documentFile.size,
        games: {
          flashcards: {
            count: 10,
            sample: "Key concepts from your document transformed into flashcards"
          },
          quiz: {
            count: 8,
            sample: "Multiple choice questions based on document content"
          },
          matching: {
            count: 5,
            sample: "Match related concepts and definitions"
          },
          trueFalse: {
            count: 12,
            sample: "Determine whether statements are true or false"
          }
        }
      };
      
      setProcessedData(mockProcessedData);
      toast.success("Document processed successfully!");
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Failed to process document. Please try again.");
      setFileError("An error occurred during processing. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('idle');
    }
  };

  // Handle game selection
  const handleGameSelect = (gameType: string) => {
    if (!file && !customText.trim()) {
      toast.error("Please upload a document or enter text first before starting a game");
      return;
    }
    
    // If document hasn't been processed yet, process it first
    if (!processedData) {
      toast.info("Processing your content first...");
      if (file) {
        processDocument(file);
      } else if (customText.trim()) {
        // Create a virtual file for processing
        const textBlob = new Blob([customText], { type: 'text/plain' });
        const textFile = new File([textBlob], "custom-text.txt", { type: 'text/plain' });
        processDocument(textFile);
      }
      // After processing is done, the game would start
      return;
    }
    
    // If already processed, start the game
    toast.info(`Opening ${gameType} game...`);
    // Example: router.push(`/games/${gameType}?docId=${processedData.id}`);
  };

  // Handle Try it Now button click
  const handleTryItNowClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Render upload/processing section
  const renderUploadSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-10">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Upload Your Learning Material
      </h2>
      
      <Tabs 
        defaultValue="file" 
        onValueChange={(value) => setInputMode(value)}
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
              Drag & Drop Your Document
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Supported formats: PDF, PPT, Word, Excel, Text
            </p>
            {fileError && (
              <p className="text-red-500 text-sm mb-2">{fileError}</p>
            )}
            <Button 
              onClick={handleTryItNowClick} 
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Choose File
            </Button>
            <input 
              type="file" 
              accept={SUPPORTED_FILE_TYPES.join(',')} 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileInput}
            />
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
            <Button 
              onClick={handleTextSubmit} 
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={!customText.trim() || isProcessing}
            >
              Process Content
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Render processing indicator
  const renderProcessingIndicator = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-10">
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        
        <div className="text-center">
          <h3 className="font-bold text-gray-800 dark:text-white">
            {file ? `Processing "${file.name}"` : "Processing your input"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {processingStatus === 'reading' && "Reading content..."}
            {processingStatus === 'extracting' && "Extracting key information..."}
            {processingStatus === 'generating' && "Creating AI-powered games..."}
          </p>
        </div>
      </div>
    </div>
  );

  // Render game cards once document is processed
  const renderGameCards = () => {
    // Default game data when no document is processed yet
    const defaultGameData = {
      flashcards: {
        count: '-',
        sample: "Upload a document or enter text to generate personalized flashcards"
      },
      quiz: {
        count: '-',
        sample: "Upload a document or enter text to generate a custom quiz"
      },
      matching: {
        count: '-',
        sample: "Upload a document or enter text to create a matching game"
      },
      trueFalse: {
        count: '-',
        sample: "Upload a document or enter text to generate true/false statements"
      }
    };
    
    // Use processed data if available, otherwise use default
    const gameData = processedData ? processedData.games : defaultGameData;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Flashcards Game Card */}
        <motion.div 
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="h-full overflow-hidden cursor-pointer" onClick={() => handleGameSelect('flashcards')}>
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white pb-6">
              <CardTitle>Flashcards</CardTitle>
              <CardDescription className="text-purple-100">
                Master concepts with flashcards
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-32 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {gameData.flashcards.sample}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-2 py-1 rounded text-xs font-medium">
                    {gameData.flashcards.count} {processedData ? 'cards' : ''}
                  </span>
                  {processedData && <span className="text-xs text-gray-500">Difficulty: Medium</span>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 dark:bg-gray-800 p-4">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Start Game</Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Quiz Game Card */}
        <motion.div 
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="h-full overflow-hidden cursor-pointer" onClick={() => handleGameSelect('quiz')}>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white pb-6">
              <CardTitle>Quiz Challenge</CardTitle>
              <CardDescription className="text-blue-100">
                Test your knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-32 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {gameData.quiz.sample}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded text-xs font-medium">
                    {gameData.quiz.count} {processedData ? 'questions' : ''}
                  </span>
                  {processedData && <span className="text-xs text-gray-500">Difficulty: Hard</span>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 dark:bg-gray-800 p-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Game</Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Matching Game Card */}
        <motion.div 
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="h-full overflow-hidden cursor-pointer" onClick={() => handleGameSelect('matching')}>
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-6">
              <CardTitle>Matching Game</CardTitle>
              <CardDescription className="text-green-100">
                Connect related concepts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-32 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {gameData.matching.sample}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded text-xs font-medium">
                    {gameData.matching.count} {processedData ? 'pairs' : ''}
                  </span>
                  {processedData && <span className="text-xs text-gray-500">Difficulty: Medium</span>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 dark:bg-gray-800 p-4">
              <Button className="w-full bg-green-600 hover:bg-green-700">Start Game</Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* True/False Game Card */}
        <motion.div 
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="h-full overflow-hidden cursor-pointer" onClick={() => handleGameSelect('trueFalse')}>
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white pb-6">
              <CardTitle>True or False</CardTitle>
              <CardDescription className="text-amber-100">
                Verify your understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-32 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {gameData.trueFalse.sample}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-2 py-1 rounded text-xs font-medium">
                    {gameData.trueFalse.count} {processedData ? 'statements' : ''}
                  </span>
                  {processedData && <span className="text-xs text-gray-500">Difficulty: Easy</span>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 dark:bg-gray-800 p-4">
              <Button className="w-full bg-amber-600 hover:bg-amber-700">Start Game</Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Learning Games</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Transform any document into interactive learning games with the power of AI. Upload your study material and start learning.
            </p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {/* Key change here: Only show upload section if processedData is null */}
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderProcessingIndicator()}
            </motion.div>
          ) : !processedData ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderUploadSection()}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {processedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  <span className="mr-2">🎮</span> Your Learning Games
                </h2>
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2"
                    onClick={() => {
                      setProcessedData(null);
                      setFile(null);
                      setCustomText('');
                    }}
                  >
                    <span>Upload New</span>
                  </Button>
                </div>
              </div>
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <div className="flex items-center text-blue-800 dark:text-blue-300">
                  <span className="font-medium mr-2">Document:</span>
                  <span>{processedData.fileName}</span>
                  <span className="mx-2">•</span>
                  <span>{(processedData.fileSize / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {!processedData && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                <span className="mr-2">🎮</span> Available Learning Games
              </h2>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm mb-4">
                <div className="flex items-center text-yellow-800 dark:text-yellow-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Upload a document or enter text to generate personalized learning games. Click "Start Game" to begin after uploading content.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Always render game cards, they'll have placeholder content if no data is processed */}
        {renderGameCards()}
        
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Powered by Gemini AI • Learn better, study smarter
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIGamesPage;