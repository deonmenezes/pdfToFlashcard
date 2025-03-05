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
    <FlashcardSection 
      key="flashcards"
      flashcards={flashcards}
    />
  )}

  {/* MCQ TAB */}
  {activeTab === "mcq" && (
    <MCQSection 
      key="mcq"
      mcqs={mcqs}
    />
  )}
  
  {/* MATCHING QUESTIONS TAB */}
  {activeTab === "matching" && (
    <MatchingSection 
      key="matching"
      matchingQuestions={matchingQuestions}
    />
  )}
  
  {/* TRUE/FALSE TAB */}
  {activeTab === "truefalse" && (
    <TrueFalseSection 
      key="truefalse"
      trueFalseQuestions={trueFalseQuestions}
    />
  )}
</AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizPage;