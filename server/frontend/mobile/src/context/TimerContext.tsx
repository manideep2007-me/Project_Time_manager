import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveTimer {
  id: string;
  employeeId: string;
  employeeName: string;
  projectName: string;
  taskName?: string;
  startTime: string;
}

interface TimerContextType {
  activeTimers: { [employeeId: string]: ActiveTimer };
  addTimer: (timer: ActiveTimer) => void;
  removeTimer: (employeeId: string) => void;
  getTimer: (employeeId: string) => ActiveTimer | null;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTimers, setActiveTimers] = useState<{ [employeeId: string]: ActiveTimer }>({});

  const addTimer = (timer: ActiveTimer) => {
    setActiveTimers(prev => ({
      ...prev,
      [timer.employeeId]: timer
    }));
  };

  const removeTimer = (employeeId: string) => {
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[employeeId];
      return newTimers;
    });
  };

  const getTimer = (employeeId: string) => {
    return activeTimers[employeeId] || null;
  };

  return (
    <TimerContext.Provider value={{ activeTimers, addTimer, removeTimer, getTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
