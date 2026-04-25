import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api/apislice';

const ResetPassword = () => {
  const { state } = useLocation();
  const email = state?.email;
  const userId = state?.userId;
  const navigate = useNavigate();

  const { register, handleSubmit } = useForm();

  // 🔒 Guard against refresh / direct access
  useEffect(() => {
    if (!userId) {
      toast.error('Session expired. Please verify OTP again.');
      navigate('/forgot-password');
    }
  }, [userId, navigate]);

  const mutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      return await api.post('/reset-password', {
        userId,
        newPassword,
      }).then(res => res.data);
    },
    onSuccess: () => {
      toast.success('Password reset successful! You can now login.');
      navigate('/login');
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || 'Failed to reset password'
      );
    },
  });

  const onSubmit = (values) => {
    const { newPassword, confirmPassword } = values;

    if (!newPassword || !confirmPassword)
      return toast.error('All fields are required');

    if (newPassword.length < 6)
      return toast.error('Password must be at least 6 characters');

    if (newPassword !== confirmPassword)
      return toast.error('Passwords do not match');

    mutation.mutate({ userId, newPassword });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border dark:border-gray-800">
        <h1 className="text-center text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Reset Password
        </h1>

        <p className="text-center mb-4 text-muted-foreground dark:text-gray-400">
          Enter your new password for {email}
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="password"
            placeholder="New Password"
            className="w-full mb-3 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            {...register('newPassword')}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full mb-4 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            {...register('confirmPassword')}
          />

          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white py-2 rounded-md disabled:opacity-50 transition-colors"
          >
            {mutation.isLoading ? 'Saving...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-4 text-center">
          <Link
            to="/login"
            className="text-orange-600 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
