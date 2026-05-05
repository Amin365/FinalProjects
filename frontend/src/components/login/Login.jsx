import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"  
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import api from "../../app/api/apislice"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router"
import { setAuth } from "../../app/AuthSlice"
import { extractErrorMessages } from "../../../../backend/utility/Globalerror"
import { enableNotifications } from "../../lib/notifications"
import { Loader2 } from "lucide-react"




export function LoginForm({ className, ...props }) {
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/auth/login", data)
      return res.data
    },
    onSuccess: async (data) => {
      dispatch(setAuth({ user: data.user, token: data.token }))
      toast.success("Login successful")
      // await enableNotifications(data.token)
      navigate("/dashboard")
    },
    onError: (error) => {
      toast.error("Login failed")
      const msg =
        extractErrorMessages?.(error) ||
        error?.response?.data?.message ||
        error.message ||
        "Login failed"
      setError(msg)
    },
  })

const onSubmit = (data) => {
  setError(null)
  loginMutation.mutate(data)
}

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="py-12">
        <CardHeader>
          <CardTitle className="text-center">
            Login to your account
          </CardTitle>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md text-center mt-4">
              {error}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Email or username</FieldLabel>
                <Input
                  placeholder="email@example.com or username"
                  {...register("identifier", {
                    required: "Email or username is required",
                  })}
                />
                {errors.identifier && (
                  <FieldDescription className="text-destructive">
                    {errors.identifier.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="********"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <FieldDescription className="text-destructive">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="flex items-center justify-center gap-2 dark:bg-orange-600"
                >
                  {loginMutation.isPending && (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <Field>
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 dark:text-white hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
