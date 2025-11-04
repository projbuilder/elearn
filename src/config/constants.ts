// Application Constants
// Centralized constants for the entire application

export const APP_NAME = "E-Learning Platform";
export const APP_VERSION = "2.0.0";
export const APP_DESCRIPTION = "Cloud-Ready Modular E-Learning System";

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Learning Styles
export const LEARNING_STYLES = {
  VISUAL: 'visual',
  AUDITORY: 'auditory',
  KINESTHETIC: 'kinesthetic',
  READING: 'reading'
} as const;

// FL Node Status
export const FL_NODE_STATUS = {
  IDLE: 'idle',
  TRAINING: 'training',
  AGGREGATING: 'aggregating',
  INACTIVE: 'inactive'
} as const;

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4
} as const;

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
} as const;

// Cache Duration (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes
  LONG: 60 * 60 * 1000       // 1 hour
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const;
