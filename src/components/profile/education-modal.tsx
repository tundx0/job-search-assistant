"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EducationEntry = {
  id?: string;
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
};

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (education: EducationEntry) => void;
  initialData?: EducationEntry;
  mode: "add" | "edit";
}

export function EducationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}: EducationModalProps) {
  const [formData, setFormData] = useState<EducationEntry>(
    initialData || {
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    }
  );

  const [isCurrent, setIsCurrent] = useState(initialData?.current || false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setIsCurrent(checked);
    setFormData((prev) => ({
      ...prev,
      current: checked,
      endDate: checked ? "Present" : prev.endDate,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "add" ? "Add Education" : "Edit Education"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Enter the details of your education.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="degree" className="text-right">
                Degree
              </Label>
              <Input
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Bachelor of Science, Master's, etc."
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="institution" className="text-right">
                Institution
              </Label>
              <Input
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="col-span-3"
                placeholder="City, Country (Optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="month"
                value={formData.startDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="current">Current</Label>
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="current"
                  name="current"
                  checked={isCurrent}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="current" className="text-sm font-normal">
                  I am currently studying here
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type={isCurrent ? "text" : "month"}
                value={isCurrent ? "Present" : formData.endDate}
                onChange={handleChange}
                className="col-span-3"
                disabled={isCurrent}
                required={!isCurrent}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                rows={5}
                placeholder="Describe your field of study, achievements, etc."
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
