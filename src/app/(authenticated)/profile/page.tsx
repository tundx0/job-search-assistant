"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { ProfileEntryList } from "@/components/profile/profile-entry-list";
import { ExperienceEntry } from "@/components/profile/experience-modal";
import { EducationEntry } from "@/components/profile/education-modal";
import { ProjectEntry } from "@/components/profile/projects-modal";
import Error, { ErrorProps } from "next/error";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});

type ProfileFormValues = {
  name: string;
  bio: string;
  location: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      location: "",
      phone: "",
      linkedin: "",
      github: "",
      website: "",
    },
  });

  // Common skill suggestions
  const skillSuggestions = [
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" },
    { label: "React", value: "react" },
    { label: "Next.js", value: "nextjs" },
    { label: "Node.js", value: "nodejs" },
    { label: "Python", value: "python" },
    { label: "Java", value: "java" },
    { label: "C#", value: "csharp" },
    { label: "SQL", value: "sql" },
    { label: "MongoDB", value: "mongodb" },
    { label: "AWS", value: "aws" },
    { label: "Docker", value: "docker" },
    { label: "Kubernetes", value: "kubernetes" },
    { label: "Git", value: "git" },
    { label: "Agile", value: "agile" },
    { label: "Scrum", value: "scrum" },
    { label: "Project Management", value: "project-management" },
    { label: "UI/UX Design", value: "ui-ux-design" },
    { label: "DevOps", value: "devops" },
    { label: "Machine Learning", value: "machine-learning" },
  ];

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch profile" as unknown as ErrorProps);
        }

        const data = await response.json();

        form.reset({
          name: data.name || "",
          bio: data.bio || "",
          location: data.location || "",
          phone: data.phone || "",
          linkedin: data.linkedin || "",
          github: data.github || "",
          website: data.website || "",
        });

        setSkills(data.skills || []);
        setExperience(data.experience || []);
        setEducation(data.education || []);
        setProjects(data.projects || []);
      } catch (error) {
        toast({
          title: "Error",
          description:
            (error as ErrorProps).title || "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [form, toast]);

  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          location: data.location,
          phone: data.phone,
          linkedin: data.linkedin,
          github: data.github,
          website: form.getValues("website"),
          skills,
          experience,
          education,
          projects,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile" as unknown as ErrorProps);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as ErrorProps).title ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="label-mono">Loading profile</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="page-head">
        <div>
          <p className="label-mono">Your history</p>
          <h1 className="page-title mt-2">Profile</h1>
          <p className="page-subtitle">
            Written once and reused for every application. The more concrete
            this is, the better the drafts get.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
          <h2 className="mb-6 border-b border-[var(--rule)] pb-4 text-lg font-semibold">
            Basic information
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief professional summary about yourself..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, State/Country"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1 (123) 456-7890"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="linkedin.com/in/yourprofile"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="github.com/yourusername"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="yourwebsite.com"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Skills</FormLabel>
                <CreatableSelect
                  value={skills}
                  onChange={setSkills}
                  suggestions={skillSuggestions}
                  placeholder="Add your skills..."
                  disabled={isSaving}
                />
                <p className="text-sm text-muted-foreground">
                  Type to add new skills or select from suggestions. Press Enter
                  to add.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Basic Information"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Work Experience */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
          <ProfileEntryList
            type="experience"
            items={experience}
            onUpdate={(items) => setExperience(items as ExperienceEntry[])}
          />
        </div>

        {/* Education */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
          <ProfileEntryList
            type="education"
            items={education}
            onUpdate={(items) => setEducation(items as EducationEntry[])}
          />
        </div>

        {/* Projects */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
          <ProfileEntryList
            type="projects"
            items={projects}
            onUpdate={(items) => setProjects(items as ProjectEntry[])}
          />
        </div>

        <div className="sticky bottom-4 z-10 rounded-xl border border-border bg-card/95 p-3 backdrop-blur-lg">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="w-full"
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
