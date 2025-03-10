'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

import { MCQ } from '../components/MCQS/mcq-types';
import { Flashcard } from '../components/flashcards/flashcard-types';
import { TrueFalseQuestion } from '../components/trueOrFalse/true-false-type';
import { MatchingQuestion } from '../components/matching-questions/matching-question-type';

import { FlashcardSection } from '../components/flashcards/flashcard-section';
import { TrueFalseSection } from '../components/trueOrFalse/true-false-section';
import { MatchingSection } from '../components/matching-questions/matching-question-section';
import { MCQSection } from '../components/MCQS/mcq-section';

// Define TypeScript interfaces
interface QuizPageProps {
  file: File | null;
  flashcards: Flashcard[];
  mcqs: MCQ[];
  matchingQuestions: MatchingQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
  onBackToUpload: () => void;
  onGenerateMore?: (type: 'flashcards' | 'mcqs' | 'matching' | 'trueFalse', quantity: number) => Promise<void>;
}

const QuizPage: React.FC<QuizPageProps> = ({ 
  file, 
  flashcards, 
  mcqs, 
  matchingQuestions, 
  trueFalseQuestions, 
  onBackToUpload,
  onGenerateMore 
}) => {
  const [activeTab, setActiveTab] = useState<"flashcards" | "mcq" | "matching" | "truefalse">("flashcards");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
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

  // Handler for generating more questions
  const handleGenerateMore = async (type: 'flashcards' | 'mcqs' | 'matching' | 'trueFalse', quantity: number) => {
    if (!onGenerateMore) return;
    
    setIsGenerating(true);
    try {
      await onGenerateMore(type, quantity);
    } catch (error) {
      console.error(`Error generating more ${type} questions:`, error);
    } finally {
      setIsGenerating(false);
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
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
            <Button 
              className={`
                px-3 py-2 rounded-lg text-xs sm:text-sm 
                transition-all duration-200 ease-in-out
                flex items-center justify-center
                ${
                  activeTab === "flashcards" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }
              `}
              onClick={() => handleTabChange("flashcards")}
            >
              <span className="hidden sm:inline">Flashcards</span>
              <span className="sm:hidden">Cards</span>
            </Button>
            <Button 
              className={`
                px-3 py-2 rounded-lg text-xs sm:text-sm 
                transition-all duration-200 ease-in-out
                flex items-center justify-center
                ${
                  activeTab === "mcq" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }
              `}
              onClick={() => handleTabChange("mcq")}
            >
              <span className="hidden sm:inline">Multiple Choice</span>
              <span className="sm:hidden">MCQ</span>
            </Button>
            <Button 
              className={`
                px-3 py-2 rounded-lg text-xs sm:text-sm 
                transition-all duration-200 ease-in-out
                flex items-center justify-center
                ${
                  activeTab === "matching" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }
              `}
              onClick={() => handleTabChange("matching")}
            >
              <span className="hidden sm:inline">Match Items</span>
              <span className="sm:hidden">Match</span>
            </Button>
            <Button 
              className={`
                px-3 py-2 rounded-lg text-xs sm:text-sm 
                transition-all duration-200 ease-in-out
                flex items-center justify-center
                ${
                  activeTab === "truefalse" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                }
              `}
              onClick={() => handleTabChange("truefalse")}
            >
              <span className="hidden sm:inline">True/False</span>
              <span className="sm:hidden">T/F</span>
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* FLASHCARDS TAB */}
            {activeTab === "flashcards" && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Flashcards</h2>
                  {onGenerateMore && (
                    <Button 
                      onClick={() => handleGenerateMore('flashcards', 5)}
                      variant="outline"
                      disabled={isGenerating}
                      className="flex items-center space-x-1"
                    >
                      <span>{isGenerating ? 'Generating...' : 'Generate 5 More'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  )}
                </div>
                <FlashcardSection 
                  flashcards={flashcards}
                />
              </motion.div>
            )}

            {/* MCQ TAB */}
            {activeTab === "mcq" && (
              <motion.div
                key="mcq"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Multiple Choice Questions</h2>
                  {onGenerateMore && (
                    <Button 
                      onClick={() => handleGenerateMore('mcqs', 5)}
                      variant="outline"
                      disabled={isGenerating}
                      className="flex items-center space-x-1"
                    >
                      <span>{isGenerating ? 'Generating...' : 'Generate 5 More'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  )}
                </div>
                <MCQSection 
                  mcqs={mcqs}
                />
              </motion.div>
            )}
            
            {/* MATCHING QUESTIONS TAB */}
            {activeTab === "matching" && (
              <motion.div
                key="matching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Matching Questions</h2>
                  {onGenerateMore && (
                    <Button 
                      onClick={() => handleGenerateMore('matching', 3)}
                      variant="outline"
                      disabled={isGenerating}
                      className="flex items-center space-x-1"
                    >
                      <span>{isGenerating ? 'Generating...' : 'Generate 3 More'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  )}
                </div>
                <MatchingSection 
                  matchingQuestions={matchingQuestions}
                />
              </motion.div>
            )}
            
            {/* TRUE/FALSE TAB */}
            {activeTab === "truefalse" && (
              <motion.div
                key="truefalse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">True/False Questions</h2>
                  {onGenerateMore && (
                    <Button 
                      onClick={() => handleGenerateMore('trueFalse', 5)}
                      variant="outline"
                      disabled={isGenerating}
                      className="flex items-center space-x-1"
                    >
                      <span>{isGenerating ? 'Generating...' : 'Generate 5 More'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  )}
                </div>
                <TrueFalseSection 
                  trueFalseQuestions={trueFalseQuestions}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizPage;