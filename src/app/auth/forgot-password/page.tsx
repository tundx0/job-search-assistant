"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
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
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  // const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      setEmailSent(true);
      toast({
        title: "Success",
        description:
          "If an account exists with that email, we've sent password reset instructions.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Check your email</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              We&apos;ve sent password reset instructions to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If you don&apos;t see the email in your inbox, check your spam
              folder. If you still don&apos;t see it, you can try requesting
              another reset email.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Try again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
        <div className="bg-card px-4 sm:px-6 py-6 sm:py-8 shadow rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        disabled={isLoading}
                        className="text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <div>
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
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
    </div>
  );
}
