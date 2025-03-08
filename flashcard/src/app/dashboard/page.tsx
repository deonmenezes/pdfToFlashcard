'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { useAuth } from '@/app/contexts/AuthContext/auth-type';
import { db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface UserStats {
  documentsUploaded: number;
  quizzesCompleted: number;
  totalScore: number;
  streakDays: number;
  averageScore: number;
  timeSpent: string;
}

interface DailyActivity {
  date: string; // YYYY-MM-DD format
  uploads: number;
  quizzes: number;
  score: number;
}

const colorIntensity = (value: number, max: number) => {
  // Calculate intensity from light purple to dark purple
  const intensity = Math.max(0.2, Math.min(1, value / max));
  return `rgba(128, 90, 213, ${intensity})`;
};

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    documentsUploaded: 0,
    quizzesCompleted: 0,
    totalScore: 0,
    streakDays: 0,
    averageScore: 0,
    timeSpent: "00:00:00"
  });
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTimeFrame, setActiveTimeFrame] = useState<'week' | 'month' | 'year'>('month');
  const [maxActivity, setMaxActivity] = useState<number>(10); // For graph intensity

  // Generate last 12 months labels
  const getMonthLabels = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }).toLowerCase());
    }
    return months;
  };
  
  const monthLabels = getMonthLabels();
  
  // Function to format seconds into HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Example query to fetch user's quiz attempts
        const quizRef = collection(db, 'quizAttempts');
        const userQuizQuery = query(
          quizRef, 
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        
        const quizSnapshot = await getDocs(userQuizQuery);
        
        // Example query to fetch user's document uploads
        const uploadsRef = collection(db, 'documentUploads');
        const userUploadsQuery = query(
          uploadsRef,
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        
        const uploadsSnapshot = await getDocs(userUploadsQuery);
        
        // Process quiz data
        const quizData = quizSnapshot.docs.map(doc => doc.data());
        const uploadData = uploadsSnapshot.docs.map(doc => doc.data());
        
        // Calculate stats
        const totalQuizzes = quizData.length;
        const totalScore = quizData.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
        const totalTime = quizData.reduce((sum, quiz) => sum + (quiz.timeSpent || 0), 0);
        
        // Calculate daily activity for the heatmap
        const activityMap = new Map<string, DailyActivity>();
        
        // Process uploads
        uploadData.forEach(upload => {
          if (upload.timestamp) {
            const date = new Date(upload.timestamp.toDate()).toISOString().split('T')[0];
            if (!activityMap.has(date)) {
              activityMap.set(date, { date, uploads: 0, quizzes: 0, score: 0 });
            }
            const dayData = activityMap.get(date)!;
            dayData.uploads += 1;
          }
        });
        
        // Process quizzes
        quizData.forEach(quiz => {
          if (quiz.timestamp) {
            const date = new Date(quiz.timestamp.toDate()).toISOString().split('T')[0];
            if (!activityMap.has(date)) {
              activityMap.set(date, { date, uploads: 0, quizzes: 0, score: 0 });
            }
            const dayData = activityMap.get(date)!;
            dayData.quizzes += 1;
            dayData.score += quiz.score || 0;
          }
        });
        
        // Convert map to array
        const activityArray = Array.from(activityMap.values());
        
        // Calculate streak
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date(today);
        
        while (true) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const hasActivity = activityMap.has(dateStr) && 
            (activityMap.get(dateStr)!.uploads > 0 || activityMap.get(dateStr)!.quizzes > 0);
          
          if (!hasActivity) break;
          
          currentStreak += 1;
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        // Find max activity for color intensity
        const maxUploadOrQuiz = Math.max(
          ...activityArray.map(day => Math.max(day.uploads, day.quizzes))
        );
        
        setMaxActivity(maxUploadOrQuiz > 0 ? maxUploadOrQuiz : 10);
        setActivityData(activityArray);
        
        // Update user stats
        setUserStats({
          documentsUploaded: uploadData.length,
          quizzesCompleted: totalQuizzes,
          totalScore,
          streakDays: currentStreak,
          averageScore: totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0,
          timeSpent: formatTime(totalTime)
        });
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Mock data for the heatmap when real data is not available
  const generateMockActivityData = () => {
    if (activityData.length > 0) return activityData;
    
    const mockData: DailyActivity[] = [];
    const today = new Date();
    
    // Generate some random activity for the last 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // More activity on weekdays, less on weekends
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const randomUpload = isWeekend ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);
      const randomQuizzes = isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 5);
      
      // Create more intense activity in the recent days
      const recentBoost = i < 14 ? 2 : 1;
      
      // Only add non-zero activity days with some randomness
      if (Math.random() > 0.5 || i < 7) {
        mockData.push({
          date: date.toISOString().split('T')[0],
          uploads: randomUpload * recentBoost,
          quizzes: randomQuizzes * recentBoost,
          score: randomQuizzes * 20 * recentBoost
        });
      }
    }
    
    return mockData;
  };

  const displayData = activityData.length > 0 ? activityData : generateMockActivityData();

  // Generate the activity grid for rendering
  const generateActivityGrid = () => {
    // Get day labels (Mon, Wed, Fri)
    const dayLabels = ['monday', 'wednesday', 'friday'];
    
    // Create a table with rows for each day
    return (
      <div className="w-full overflow-x-auto py-4">
        <div className="flex">
          <div className="flex flex-col justify-around pr-2 py-3 text-xs text-gray-500 dark:text-gray-400">
            {dayLabels.map(day => (
              <div key={day} className="h-6">{day}</div>
            ))}
          </div>
          
          <div className="flex-grow">
            <div className="grid grid-cols-12 gap-1">
              {monthLabels.map(month => (
                <div key={month} className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {month}
                </div>
              ))}
              
              {/* Activity cells - 3 rows (Mon, Wed, Fri) × 12 columns (months) */}
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  {Array.from({ length: 12 }).map((_, colIndex) => {
                    // Find data for this cell (simplified mapping)
                    const monthIndex = new Date().getMonth() - (11 - colIndex);
                    const yearOffset = monthIndex < 0 ? -1 : 0;
                    const cellMonth = (monthIndex + 12) % 12;
                    const cellYear = new Date().getFullYear() + yearOffset;
                    
                    // Find activity for this month 
                    const monthActivity = displayData.filter(item => {
                      const itemDate = new Date(item.date);
                      return itemDate.getMonth() === cellMonth && 
                             itemDate.getFullYear() === cellYear &&
                             (itemDate.getDay() % 2 === rowIndex % 2); // Simplify day matching
                    });
                    
                    // Calculate total activity for this cell
                    const totalActivity = monthActivity.reduce((sum, day) => sum + day.uploads + day.quizzes, 0);
                    const cellColor = totalActivity > 0 ? colorIntensity(totalActivity, maxActivity) : 'rgba(0, 0, 0, 0.1)';
                    
                    return (
                      <div 
                        key={`cell-${rowIndex}-${colIndex}`}
                        className="aspect-square h-6 rounded-sm"
                        style={{ 
                          backgroundColor: cellColor,
                          opacity: totalActivity > 0 ? 1 : 0.3
                        }}
                        title={`${totalActivity} activities`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>less</span>
          <div className="flex mx-2 space-x-1">
            {[0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
              <div 
                key={i} 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(128, 90, 213, ${intensity})` }}
              />
            ))}
          </div>
          <span>more</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          {/* User Profile Section */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.displayName || 'User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Joined {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'recently'}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Current streak: {userStats.streakDays} days
              </p>
            </div>
            
            <div className="ml-auto flex flex-col md:flex-row gap-2">
              <Button variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-400">
                Edit Profile
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Create New Quiz
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Documents Uploaded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{userStats.documentsUploaded}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Quizzes Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{userStats.quizzesCompleted}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{userStats.averageScore}%</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Time Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{userStats.timeSpent}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Time-based metrics */}
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quiz Performance</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant={activeTimeFrame === 'week' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveTimeFrame('week')}
                  className={activeTimeFrame === 'week' ? 'bg-purple-600' : ''}
                >
                  Week
                </Button>
                <Button 
                  variant={activeTimeFrame === 'month' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveTimeFrame('month')}
                  className={activeTimeFrame === 'month' ? 'bg-purple-600' : ''}
                >
                  Month
                </Button>
                <Button 
                  variant={activeTimeFrame === 'year' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveTimeFrame('year')}
                  className={activeTimeFrame === 'year' ? 'bg-purple-600' : ''}
                >
                  Year
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">10 questions</div>
                  <div className="text-3xl font-bold">
                    {loading ? '-' : '91'}
                  </div>
                  <div className="text-sm text-purple-600">99%</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">25 questions</div>
                  <div className="text-3xl font-bold">
                    {loading ? '-' : '87'}
                  </div>
                  <div className="text-sm text-purple-600">95%</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">50 questions</div>
                  <div className="text-3xl font-bold">
                    {loading ? '-' : '82'}
                  </div>
                  <div className="text-sm text-purple-600">90%</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">100 questions</div>
                  <div className="text-3xl font-bold">
                    {loading ? '-' : '78'}
                  </div>
                  <div className="text-sm text-purple-600">85%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Heatmap */}
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity History</CardTitle>
              <div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {displayData.length} activities
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {generateActivityGrid()}
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading recent activity...</p>
                  </div>
                ) : displayData.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center p-3 border-b dark:border-gray-700 last:border-0">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2 mr-3">
                      {activity.uploads > 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium dark:text-white">
                        {activity.uploads > 0 
                          ? `Uploaded ${activity.uploads} document${activity.uploads > 1 ? 's' : ''}`
                          : `Completed ${activity.quizzes} quiz${activity.quizzes > 1 ? 'zes' : ''}`
                        }
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.quizzes > 0 && (
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-400">
                          Score: {Math.round(activity.score / activity.quizzes)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {!loading && displayData.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400">No activity yet. Upload a document to get started!</p>
                    <Button className="mt-4 bg-purple-600 hover:bg-purple-700">Upload Document</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;