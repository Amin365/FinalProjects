/**
 * Phase 8 - Setup Password Page
 * Allows invited users to set their password
 */

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  KeyRound,
} from "lucide-react";

const PasswordRequirement = ({ met, text }) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-slate-300" />
    )}
    <span className={met ? "text-green-600 dark:text-green-400" : "text-slate-500"}>
      {text}
    </span>
  </div>
);

export default function SetupPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validate token
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["validate-invite", token],
    queryFn: async () => {
      const res = await api.get(`/auth/validate-invite/${encodeURIComponent(token)}`);
      return res.data;
    },
    enabled: token.length > 0,
    retry: false,
  });

  // Setup password mutation
  const setupMutation = useMutation({
    mutationFn: async ({ token, password }) => {
      const res = await api.post("/auth/setup-password", { token, password });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Password set successfully! You can now log in.");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to set password");
    },
  });

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const isValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.match;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please meet all password requirements");
      return;
    }
    setupMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-gray-300">
              This password setup link is invalid. Please check your email for the correct link or
              contact support.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600 dark:text-gray-300">Validating your invite...</p>
        </div>
      </div>
    );
  }

  if (tokenError || !tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Link Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-gray-300 mb-4">
              This password setup link has expired or is invalid. Please contact an administrator
              to receive a new invite.
            </p>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>What to do</AlertTitle>
              <AlertDescription>
                Contact your club administrator to resend the invite email.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const user = tokenData.user;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Set Up Your Password</CardTitle>
          <CardDescription>
            Welcome, {user.firstName}! Create a secure password to activate your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* User Info */}
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle>Account Details</AlertTitle>
              <AlertDescription>
                <p>
                  <strong>Name:</strong> {user.firstName} {user.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
              </AlertDescription>
            </Alert>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-slate-700 dark:text-white mb-3">
                Password Requirements:
              </p>
              <PasswordRequirement met={passwordChecks.length} text="At least 8 characters" />
              <PasswordRequirement met={passwordChecks.uppercase} text="One uppercase letter" />
              <PasswordRequirement met={passwordChecks.lowercase} text="One lowercase letter" />
              <PasswordRequirement met={passwordChecks.number} text="One number" />
              <PasswordRequirement met={passwordChecks.match} text="Passwords match" />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || setupMutation.isPending}
            >
              {setupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Set Password & Activate Account
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
