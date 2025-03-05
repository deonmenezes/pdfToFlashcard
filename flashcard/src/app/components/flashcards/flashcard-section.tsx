import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Flashcard } from './flashcard-types';

interface FlashcardSectionProps {
  flashcards: Flashcard[];
}

export const FlashcardSection: React.FC<FlashcardSectionProps> = ({ flashcards }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

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

  return (
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
  );
};