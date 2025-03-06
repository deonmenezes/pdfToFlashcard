import React from 'react';
import Image from 'next/image';

const ARVRComingSoon: React.FC = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Design Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-purple-900/20 to-blue-900/20 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gradient-to-r from-gold-900/20 to-amber-900/20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-gradient-to-r from-blue-900/30 to-purple-900/30 blur-2xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <div className="inline-block px-4 py-2 bg-black border-2 border-gold-500 rounded-full text-gold-400 font-bold text-lg mb-4">
                Coming Soon
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="text-white">Immersive </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-amber-300 font-extrabold">Learning</span>
                <span className="text-white"> With </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-extrabold">AR/VR</span>
              </h1>
              <p className="text-gray-100 text-xl md:text-2xl font-medium">
                Transform your educational experience with our upcoming Augmented and Virtual Reality features. Dive into interactive 3D quizzes and immersive flashcards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="px-8 py-4 rounded-md bg-gradient-to-r from-gold-600 to-amber-500 text-black font-bold hover:from-gold-500 hover:to-amber-400 transition-all text-lg">
                  Join Waitlist
                </button>
                <button className="px-8 py-4 rounded-md border-2 border-gray-700 text-white hover:bg-gray-800 transition-all font-bold text-lg">
                  Learn More
                </button>
              </div>
            </div>

            <div className="md:w-1/2 relative">
              <div className="relative w-full h-96">
                {/* VR Headset Mockup */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 to-purple-900/50 rounded-xl backdrop-blur-sm flex items-center justify-center">
                  <div className="relative w-72 h-72">
                    <div className="absolute inset-0 rounded-xl bg-black/80 flex items-center justify-center border-2 border-gold-500/50">
                      <div className="text-center p-6">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold-500 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gold-400 font-bold text-2xl">AR/VR Experience</p>
                        <p className="text-white mt-2 text-lg">When it's ready...</p>
                      </div>
                    </div>
                    <div className="absolute -top-4 -left-4 w-full h-full rounded-xl border-2 border-gold-500/50 transform rotate-3"></div>
                    <div className="absolute -bottom-4 -right-4 w-full h-full rounded-xl border-2 border-blue-500/50 transform -rotate-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-amber-300 font-extrabold">Experience Education</span>
              <span className="text-white"> Like Never Before</span>
            </h2>
            <p className="text-gray-100 max-w-2xl mx-auto text-xl">Our AR/VR features will redefine how you interact with educational content.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-black/50 border-2 border-gray-800 rounded-xl p-8 hover:border-gold-500/80 transition-all duration-300 group">
              <div className="w-16 h-16 mb-6 rounded-lg bg-blue-900/40 flex items-center justify-center group-hover:bg-blue-900/70 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">3D Interactive Quizzes</h3>
              <p className="text-gray-100 text-lg">Step inside your quizzes and interact with 3D models and simulations that make learning tangible.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-black/50 border-2 border-gray-800 rounded-xl p-8 hover:border-gold-500/80 transition-all duration-300 group">
              <div className="w-16 h-16 mb-6 rounded-lg bg-purple-900/40 flex items-center justify-center group-hover:bg-purple-900/70 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Spatial Flashcards</h3>
              <p className="text-gray-100 text-lg">Place virtual flashcards throughout your physical space, creating a memory palace for better retention.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-black/50 border-2 border-gray-800 rounded-xl p-8 hover:border-gold-500/80 transition-all duration-300 group">
              <div className="w-16 h-16 mb-6 rounded-lg bg-gold-900/40 flex items-center justify-center group-hover:bg-gold-900/70 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Immersive Study Rooms</h3>
              <p className="text-gray-100 text-lg">Join virtual study environments designed to boost focus and collaboration with peers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-gray-900 to-black border-2 border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-900/30 mb-6 border border-gold-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Be The First To Know</h2>
              <p className="text-gray-100 mb-8 text-xl">Join our exclusive waitlist to get early access to our AR/VR features when they're ready to launch.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="px-4 py-3 rounded-md bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-gold-500 flex-grow text-lg"
                />
                <button className="px-6 py-3 rounded-md bg-gradient-to-r from-gold-600 to-amber-500 text-black font-bold hover:from-gold-500 hover:to-amber-400 transition-all whitespace-nowrap text-lg">
                  Join Waitlist
                </button>
              </div>
              <p className="text-sm text-gray-300 mt-4">We'll notify you when our AR/VR features are ready. No spam, ever.</p>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default ARVRComingSoon;