export interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const minLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return {
    minLength,
    hasNumber,
    hasSpecialChar,
    isValid: minLength && hasNumber && hasSpecialChar,
  };
}
