import React, { createContext, useContext, useState, useCallback } from 'react';

export type ActivityItem = {
  id: string;
  type: 'task_status' | 'time_entry' | 'task_completed';
  title?: string;
  description?: string;
  timestamp: Date;
  userId: string;
  projectName?: string;
  taskName?: string;
  hours?: number;
  status?: string;
};

type ActivityContextValue = {
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  getRecentActivities: (userId?: string, limit?: number) => ActivityItem[];
  clearActivities: () => void;
};

const ActivityContext = createContext<ActivityContextValue>({
  activities: [],
  addActivity: () => {},
  getRecentActivities: () => [],
  clearActivities: () => {},
});

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep only last 50 activities
  }, []);

  const getRecentActivities = useCallback((userId?: string, limit: number = 5) => {
    let filtered = activities;
    if (userId) {
      filtered = activities.filter(activity => activity.userId === userId);
    }
    return filtered.slice(0, limit);
  }, [activities]);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const value = {
    activities,
    addActivity,
    getRecentActivities,
    clearActivities,
  };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
