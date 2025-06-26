import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function DniValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isValidLength = /^\d{7,8}$/.test(control.value);
    return isValidLength ? null : { noEsDni: 'El DNI debe tener entre 7 y 8 dígitos' };
  };
}