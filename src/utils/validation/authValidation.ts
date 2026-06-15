import * as yup from 'yup';
import { REGEX } from '../constants/regex';

export const identifierSchema = yup
  .string()
  .required('Email or phone is required')
  .test('email-or-phone', 'Enter valid email or phone', (value) => {
    if (!value) return false;
    return REGEX.EMAIL.test(value) || REGEX.PHONE.test(value);
  });

export const loginSchema = yup.object().shape({
  identifier: identifierSchema,
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup
    .string()
    .transform((value) => value || undefined)
    .matches(REGEX.PHONE, 'Invalid phone number')
    .optional(),
  password: yup
    .string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
      'Password needs uppercase, lowercase, number, and special character'
    )
    .required('Password is required'),
});

export const otpSchema = yup.object().shape({
  identifier: identifierSchema,
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
