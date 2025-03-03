"use client";

import { FC, useState } from "react";
import { Users, Upload, Search, School, BookOpen, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface College {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

const CommunitiesPage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [uploadMode, setUploadMode] = useState(false);
  
  // Mock data for colleges and subjects
  const colleges: College[] = [
    { id: "1", name: "Harvard University" },
    { id: "2", name: "MIT" },
    { id: "3", name: "Stanford University" },
    { id: "4", name: "Oxford University" },
    { id: "5", name: "Cambridge University" },
  ];
  
  const semesters = ["Fall 2024", "Spring 2025", "Summer 2025", "Winter 2024"];
  
  const subjects: Subject[] = [
    { id: "1", name: "Computer Science" },
    { id: "2", name: "Mathematics" },
    { id: "3", name: "Physics" },
    { id: "4", name: "Chemistry" },
    { id: "5", name: "Biology" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
              <Users className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Join Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">Communities</span></h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Share your knowledge, find study materials from your college, and connect with fellow students.
          </p>
        </div>
        
        {/* Toggle between search and upload */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 flex">
            <Button 
              variant={!uploadMode ? "default" : "ghost"}
              className={!uploadMode ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "text-gray-700 dark:text-gray-300"}
              onClick={() => setUploadMode(false)}
            >
              <Search className="h-4 w-4 mr-2" />
              Find Materials
            </Button>
            <Button 
              variant={uploadMode ? "default" : "ghost"}
              className={uploadMode ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "text-gray-700 dark:text-gray-300"}
              onClick={() => setUploadMode(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Notes
            </Button>
          </div>
        </div>
        
        {uploadMode ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-purple-500" />
              Upload Your Work
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Your College
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select 
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                  >
                    <option value="">Select a college...</option>
                    {colleges.map(college => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select 
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">Select semester...</option>
                    {semesters.map(semester => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select 
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Notes
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOCX, PPTX up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea 
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Add a brief description of your notes..."
                ></textarea>
              </div>
              
              <div className="pt-4">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Notes
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Search className="h-5 w-5 mr-2 text-purple-500" />
              Find Study Materials
            </h2>
            
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for colleges, subjects, or materials..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    College
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select 
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                    >
                      <option value="">All Colleges</option>
                      {colleges.map(college => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select 
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                      <option value="">All Semesters</option>
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3">
                  <Search className="h-4 w-4 mr-2" />
                  Search Materials
                </Button>
              </div>
            </div>
            
            {/* Featured Communities */}
            <div className="mt-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Featured Communities</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div 
                    key={item}
                    className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full mr-4">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {["Computer Science", "Mathematics", "Physics", "Biology"][item - 1]} Community
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.floor(Math.random() * 1000) + 100} members • {Math.floor(Math.random() * 500) + 50} resources
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Stats Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Join Our Growing Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">5,000+</div>
              <p className="text-gray-600 dark:text-gray-300">Students</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">300+</div>
              <p className="text-gray-600 dark:text-gray-300">Colleges</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">12,000+</div>
              <p className="text-gray-600 dark:text-gray-300">Resources</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitiesPage;