import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api/apislice';

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  // 📧 Send OTP mutation
  const mutation = useMutation({
    mutationFn: ({ email }) =>
      api.post('/forgot-password', { email }).then((res) => res.data),

    onSuccess: (data, variables) => {
      toast.success('OTP sent', { description: data.message });
      navigate('/verify-otp', {
        state: { email: variables.email },
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || 'Something went wrong'
      );
    },
  });

  const onSubmit = (values) => {
    const email = values.email.trim();

    if (!email) return toast.error('Email is required');

    mutation.mutate({ email });
  };

  return (
    <div className="relative flex h-screen items-center justify-center">
      <div className="relative z-2 w-full max-w-[340px] px-5">
        <div className="text-center mb-6">
          <KeyRound className="mx-auto size-6 mb-2" />
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a verification code.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={mutation.isLoading} className="grid gap-5">
            <input
              type="email"
              placeholder="john@example.com"
              className="px-3 py-2 border rounded-md w-full"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Invalid email address',
                },
              })}
            />

            {errors.email && (
              <p className="text-red-600 text-sm">
                {errors.email.message}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full bg-orange-600 text-white py-2 rounded-md disabled:opacity-50"
            >
              {mutation.isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </fieldset>
        </form>

        <p className="mt-4 text-center">
          <Link
            to="/login"
            className="text-orange-600 hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
