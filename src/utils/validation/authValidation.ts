import * as yup from 'yup';
import { REGEX } from '../constants/regex';

export const loginSchema = yup.object().shape({
  identifier: yup
    .string()
    .required('Email or phone is required')
    .test('email-or-phone', 'Enter valid email or phone', (value) => {
      if (!value) return false;
      return REGEX.EMAIL.test(value) || REGEX.PHONE.test(value);
    }),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(REGEX.PHONE, 'Invalid phone number').required("Phone number is required"),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});
export const agencyDetailsSchema = yup.object().shape({
  agencyName: yup.string().required('Agency name is required'),

  licenceNumber: yup.string().required('License number is required'),

  experience: yup
    .number()
    .typeError('Years of experience must be a number')
    .required('Years of experience is required'),

  certificationDocument: yup
    .mixed()
    .required('Certification document is required')
    .test(
      'fileFormat',
      'Only PDF, PNG, JPG, and JPEG files are allowed',
      (value: any) => {
        if (!value) return false;

        // React Native document pickers may provide either `name` or `fileName`
        const fileName = value.name || value.fileName || '';

        const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
        const extension = fileName.split('.').pop()?.toLowerCase();

        return !!extension && allowedExtensions.includes(extension);
      }
    ),
});

export const otpSchema = yup.object().shape({
  identifier: yup.string().required('Email or phone is required'),
});

export const otpVerifySchema = yup.object().shape({
  otpCode: yup.string().matches(REGEX.OTP, 'OTP must be 6 digits').required('OTP is required'),
});

export const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export const resetPasswordSchema = yup.object().shape({
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});