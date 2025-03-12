import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Define interface for API error response
interface ApiErrorResponse {
  message: string;
}

// Toast styles
const toastStyles = {
  success: {
    style: {
      background: '#10B981',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#10B981',
    },
  },
  error: {
    style: {
      background: '#EF4444',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#EF4444',
    },
  },
  loading: {
    style: {
      background: '#3B82F6',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
    },
  },
};

// Toast utility functions
export const toastUtils = {
  /**
   * Show a success toast
   * @param message The message to display
   */
  success: (message: string) => {
    toast.success(message, toastStyles.success);
  },

  /**
   * Show an error toast
   * @param message The message to display
   */
  error: (message: string) => {
    toast.error(message, toastStyles.error);
  },

  /**
   * Show a loading toast
   * @param message The message to display
   * @returns Toast ID that can be used to dismiss the toast
   */
  loading: (message: string) => {
    return toast.loading(message, toastStyles.loading);
  },

  /**
   * Dismiss a specific toast
   * @param toastId The ID of the toast to dismiss
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Handle a promise with loading, success, and error toasts
   * @param promise The promise to handle
   * @param messages Object containing loading, success, and error messages
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string | ((err: Error | AxiosError<ApiErrorResponse>) => string);
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        loading: toastStyles.loading,
        success: toastStyles.success,
        error: toastStyles.error,
      }
    );
  },
}; 