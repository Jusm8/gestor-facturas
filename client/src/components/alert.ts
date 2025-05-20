import Swal from 'sweetalert2';

export const showSuccess = (title: string, message: string) => {
  return Swal.fire({
    icon: 'success',
    title: message,
    timer: 1500,
    timerProgressBar: true,
    confirmButtonColor: '#4760c0'
  });
};

export const showError = (title: string, text?: string) => {
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#d33'
  });
};

export const showWarning = (title: string, text?: string) => {
  Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#f39c12'
  });
};

export const showConfirm = async (title: string, text?: string) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    confirmButtonColor: '#4760c0'
  });

  return result.isConfirmed;
};
