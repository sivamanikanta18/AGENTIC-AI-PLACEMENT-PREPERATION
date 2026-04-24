import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

const useRoadmapStore = create((set, get) => ({
  // State
  roadmaps: [],
  currentRoadmap: null,
  templates: [],
  recommendedTemplates: [],
  stats: null,
  isLoading: false,
  isGenerating: false,
  error: null,
  
  // UI State
  selectedView: 'timeline', // 'timeline', 'kanban', 'calendar'
  selectedRoadmapId: null,
  
  // Actions
  
  // Fetch all roadmaps
  fetchRoadmaps: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/roadmaps?${params}`);
      set({ 
        roadmaps: response.data.roadmaps,
        stats: response.data.stats,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to fetch roadmaps');
    }
  },
  
  // Fetch single roadmap
  fetchRoadmap: async (roadmapId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/roadmaps/${roadmapId}`);
      set({ 
        currentRoadmap: response.data.roadmap,
        selectedRoadmapId: roadmapId,
        isLoading: false 
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to fetch roadmap');
      return null;
    }
  },
  
  // Generate new roadmap
  generateRoadmap: async (options) => {
    set({ isGenerating: true, error: null });
    try {
      const response = await axios.post('/roadmaps', options);
      
      toast.success(response.data.message);
      
      // Refresh roadmaps list
      await get().fetchRoadmaps();
      
      // Set as current
      if (response.data.roadmap) {
        set({ 
          currentRoadmap: response.data.roadmap,
          selectedRoadmapId: response.data.roadmap._id
        });
      }
      
      set({ isGenerating: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isGenerating: false });
      toast.error(error.response?.data?.message || 'Failed to generate roadmap');
      throw error;
    }
  },
  
  // Fetch templates
  fetchTemplates: async (type, company) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (company) params.append('company', company);
      
      const response = await axios.get(`/roadmaps/templates?${params}`);
      set({ 
        templates: response.data.templates,
        isLoading: false 
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  // Fetch recommended templates
  fetchRecommendedTemplates: async () => {
    try {
      const response = await axios.get('/roadmaps/templates/recommended');
      set({ recommendedTemplates: response.data.templates });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recommended templates:', error);
      return null;
    }
  },
  
  // Complete task
  completeTask: async (roadmapId, taskId, dayNumber, data) => {
    try {
      const response = await axios.post(
        `/roadmaps/${roadmapId}/tasks/${taskId}/complete`,
        { dayNumber, ...data }
      );
      
      toast.success(`Task completed! +${response.data.xpEarned} XP`);
      
      // Update current roadmap
      if (get().currentRoadmap?._id === roadmapId) {
        await get().fetchRoadmap(roadmapId);
      }
      
      return response.data;
    } catch (error) {
      toast.error('Failed to complete task');
      throw error;
    }
  },
  
  // Submit quiz
  submitQuiz: async (roadmapId, taskId, dayNumber, answers) => {
    try {
      const response = await axios.post(
        `/roadmaps/${roadmapId}/tasks/${taskId}/quiz/submit`,
        { dayNumber, answers }
      );
      
      if (response.data.passed) {
        toast.success(`Quiz passed! Score: ${response.data.score}%`);
      } else {
        toast(`Quiz score: ${response.data.score}%`, { icon: '📝' });
      }
      
      return response.data;
    } catch (error) {
      toast.error('Failed to submit quiz');
      throw error;
    }
  },
  
  // Adapt roadmap
  adaptRoadmap: async (roadmapId, emergencyReason = null) => {
    try {
      toast.loading('AI is analyzing your progress...', { id: 'adapt' });
      
      const response = await axios.post(`/roadmaps/${roadmapId}/adapt`, {
        emergencyReason
      });
      
      toast.dismiss('adapt');
      
      if (response.data.adaptationsApplied > 0) {
        toast.success(response.data.message);
        await get().fetchRoadmap(roadmapId);
      } else {
        toast('No adaptations needed - you\'re on track!', { icon: '✅' });
      }
      
      return response.data;
    } catch (error) {
      toast.dismiss('adapt');
      toast.error('Failed to adapt roadmap');
      throw error;
    }
  },
  
  // Get roadmap progress
  fetchProgress: async (roadmapId) => {
    try {
      const response = await axios.get(`/roadmaps/${roadmapId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      return null;
    }
  },
  
  // Get upcoming tasks
  fetchUpcomingTasks: async (roadmapId, days = 7) => {
    try {
      const response = await axios.get(
        `/roadmaps/${roadmapId}/upcoming?days=${days}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch upcoming tasks:', error);
      return null;
    }
  },
  
  // Update roadmap settings
  updateRoadmap: async (roadmapId, updates) => {
    try {
      const response = await axios.put(`/roadmaps/${roadmapId}`, updates);
      
      if (get().currentRoadmap?._id === roadmapId) {
        set({ currentRoadmap: response.data.roadmap });
      }
      
      toast.success('Roadmap updated');
      return response.data;
    } catch (error) {
      toast.error('Failed to update roadmap');
      throw error;
    }
  },
  
  // Archive roadmap
  archiveRoadmap: async (roadmapId) => {
    try {
      await axios.delete(`/roadmaps/${roadmapId}`);
      
      set(state => ({
        roadmaps: state.roadmaps.filter(r => r._id !== roadmapId),
        currentRoadmap: state.currentRoadmap?._id === roadmapId 
          ? null 
          : state.currentRoadmap
      }));
      
      toast.success('Roadmap archived');
    } catch (error) {
      toast.error('Failed to archive roadmap');
      throw error;
    }
  },
  
  // Set view mode
  setView: (view) => set({ selectedView: view }),
  
  // Select roadmap
  selectRoadmap: (roadmapId) => set({ selectedRoadmapId: roadmapId }),
  
  // Clear current roadmap
  clearCurrentRoadmap: () => set({ currentRoadmap: null, selectedRoadmapId: null }),
  
  // Getters
  getActiveRoadmaps: () => {
    return get().roadmaps.filter(r => 
      r.status === 'active' || r.status === 'paused'
    );
  },
  
  getCompletedRoadmaps: () => {
    return get().roadmaps.filter(r => r.status === 'completed');
  },
  
  getRoadmapsByType: (type) => {
    return get().roadmaps.filter(r => r.type === type);
  },
  
  getCurrentDay: () => {
    const roadmap = get().currentRoadmap;
    if (!roadmap) return 1;
    
    const today = new Date();
    const startDate = new Date(roadmap.schedule.startDate);
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.min(diffDays, roadmap.progress.totalDays);
  },
  
  getProgressPercentage: () => {
    const roadmap = get().currentRoadmap;
    if (!roadmap) return 0;
    return roadmap.progress.overallCompletion || 0;
  },
  
  getOverdueTasks: () => {
    const roadmap = get().currentRoadmap;
    if (!roadmap) return [];
    
    const today = new Date();
    return roadmap.schedule.dailyPlans
      .filter(day => new Date(day.date) < today && day.status !== 'completed')
      .flatMap(day => day.tasks
        .filter(task => task.status !== 'completed')
        .map(task => ({
          ...task,
          day: day.day,
          date: day.date,
          daysOverdue: Math.floor((today - new Date(day.date)) / (1000 * 60 * 60 * 24))
        }))
      );
  },
  
  getUpcomingTasks: (days = 7) => {
    const roadmap = get().currentRoadmap;
    if (!roadmap) return [];
    
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return roadmap.schedule.dailyPlans
      .filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= today && dayDate <= future;
      })
      .flatMap(day => day.tasks
        .filter(task => task.status === 'available')
        .map(task => ({
          ...task,
          day: day.day,
          date: day.date,
          focus: day.focus,
          theme: day.theme
        }))
      );
  },
  
  getWeakAreas: () => {
    const roadmap = get().currentRoadmap;
    if (!roadmap) return [];
    return roadmap.aiInsights?.currentFocus || [];
  }
}));

export default useRoadmapStore;
