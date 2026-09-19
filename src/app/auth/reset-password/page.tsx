"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthHeader } from "@/components/auth/auth-header";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function validateToken() {
      if (!token || !email) {
        setIsValidToken(false);
        setTokenError("Invalid or missing reset token");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}&email=${email}`);
        const data = await response.json();

        if (!response.ok) {
          setIsValidToken(false);
          setTokenError(data.message || data.error || "Invalid or expired reset token");
        } else {
          setIsValidToken(true);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setIsValidToken(false);
        setTokenError("Failed to validate reset token");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token, email]);

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token || !email) return;
    
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidating) {
    return (
      <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Validating reset token</CardTitle>
            <CardDescription >
              Please wait while we validate your reset token...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4 sm:py-6">
            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </CardContent>
      </Card>
    );
  }

  if (!isValidToken) {
    return (
      <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription >
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle >Error</AlertTitle>
              <AlertDescription >
                {tokenError || "Your password reset link is invalid or has expired. Please request a new one."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => router.push("/auth/forgot-password")}
            >
              Request new reset link
            </Button>
          </CardFooter>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Password Reset Successful</CardTitle>
            <CardDescription >
              Your password has been reset successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You can now log in with your new password.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => router.push("/auth/login")}
            >
              Go to login
            </Button>
          </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <AuthHeader kicker="Password reset" title="Choose a new password">
        Enter the password you want to use from now on.
      </AuthHeader>

      <div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel >New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={isLoading}
                        
                      />
                    </FormControl>
                    <FormMessage  />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel >Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={isLoading}
                        
                      />
                    </FormControl>
                    <FormMessage  />
                  </FormItem>
                )}
              />

              <div>
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-4 sm:mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="text-xs sm:text-sm text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
