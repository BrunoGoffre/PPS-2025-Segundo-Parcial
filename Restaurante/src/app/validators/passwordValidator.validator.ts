import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(): ValidatorFn {
  return (form: AbstractControl): { [key: string]: any } | null => {
    const password = form.get('clave');
    const confirmPassword = form.get('clave2');

    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  };
}