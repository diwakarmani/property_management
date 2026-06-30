import * as yup from 'yup';
import { REGEX } from '../constants/regex';

export const identifierSchema = yup
  .string()
  .required('Email or phone is required')
  .test('email-or-phone', 'Enter a valid email or phone number', (value) => {
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
  email: yup
    .string()
    .required('Email is required')
    .matches(REGEX.EMAIL, 'Enter a valid email address'),
  phone: yup
    .string()
    .required('Phone number is required')
    .test('phone-digits', 'Enter 7–15 digits for the local number', (value) => {
      // Strip formatting AND leading zeros before counting — mirrors onSubmit behaviour.
      // Prevents all-zero inputs (e.g. "0000000") from passing the digit-count check
      // and then collapsing to an empty string after leading-zero removal.
      const digits = (value ?? '').replace(/\D/g, '').replace(/^0+/, '');
      return digits.length >= 7 && digits.length <= 15;
    }),
  password: yup
    .string()
    .required('Password is required')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
      'Password needs uppercase, lowercase, number, and special character'
    ),
});

// Used when the user chooses to log in via OTP on their phone number
export const otpSchema = yup.object().shape({
  identifier: identifierSchema,
});

// Used when the user chooses to log in via OTP on their email address
export const otpEmailSchema = yup.object().shape({
  identifier: yup
    .string()
    .required('Email is required')
    .matches(REGEX.EMAIL, 'Enter a valid email address'),
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
