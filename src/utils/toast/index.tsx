import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const showToast = (type: ToastType, title: string, message?: string) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: Platform.OS === 'ios' ? 50 : 30,
  });
};

export const toast = {
  success: (message: string) => showToast('success', 'Success', message),
  error: (message: string) => showToast('error', 'Error', message),
  info: (message: string) => showToast('info', 'Info', message),
  warning: (message: string) => showToast('warning', 'Warning', message),
};