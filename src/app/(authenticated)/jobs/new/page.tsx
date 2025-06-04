"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const jobSubmissionSchema = z.object({
  jobTitle: z.string().min(2, { message: "Job title is required" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  jobDescription: z
    .string()
    .min(10, { message: "Job description is required and should be detailed" }),
});

type JobSubmissionFormValues = z.infer<typeof jobSubmissionSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<JobSubmissionFormValues>({
    resolver: zodResolver(jobSubmissionSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      jobDescription: "",
    },
  });

  async function onSubmit(data: JobSubmissionFormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create job application"
        );
      }

      const responseData = await response.json();

      toast({
        title: "Success",
        description:
          "Job application created successfully. Generating documents...",
      });

      router.push(`/jobs/${responseData.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        New Job Application
      </h1>

      <div className="rounded-lg border bg-card p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Software Engineer"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Inc."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Paste the full job description here..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Application"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
