"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProjectEntry = {
  id?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description: string[];
};

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectEntry) => void;
  initialData?: ProjectEntry;
  mode: "add" | "edit";
}

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}: ProjectModalProps) {
  const [formData, setFormData] = useState<ProjectEntry>(
    initialData || {
      name: "",
      startDate: "",
      endDate: "",
      current: false,
      description: [""],
    }
  );

  // Reset form data when initialData changes or modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          name: "",
          startDate: "",
          endDate: "",
          current: false,
          description: [""],
        }
      );
      setIsCurrent(initialData?.current || false);
      setDescriptions(initialData?.description || [""]);
    }
  }, [initialData, isOpen]);

  const [isCurrent, setIsCurrent] = useState(initialData?.current || false);
  const [descriptions, setDescriptions] = useState<string[]>(
    initialData?.description || [""]
  );

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
      endDate: checked ? undefined : prev.endDate,
    }));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    setDescriptions(newDescriptions);
  };

  const addDescriptionField = () => {
    setDescriptions([...descriptions, ""]);
  };

  const removeDescriptionField = (index: number) => {
    if (descriptions.length > 1) {
      const newDescriptions = descriptions.filter((_, i) => i !== index);
      setDescriptions(newDescriptions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name || descriptions.some((desc) => !desc.trim())) {
      return; // Don't submit if required fields are missing
    }

    // Filter out empty descriptions
    const filteredDescriptions = descriptions.filter((desc) => desc.trim());

    // Make sure we have the correct endDate value
    const dataToSave = {
      ...formData,
      current: isCurrent,
      endDate: isCurrent ? undefined : formData.endDate,
      description: filteredDescriptions,
    };

    onSave(dataToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Project" : "Edit Project"}
          </DialogTitle>
          <DialogDescription>
            Enter the details of your project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Project Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="current">Current Project</Label>
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="current"
                  name="current"
                  checked={isCurrent}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="current" className="text-sm font-normal">
                  I am currently working on this project
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
                type="month"
                value={formData.endDate}
                onChange={handleChange}
                className="col-span-3"
                disabled={isCurrent}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right mt-2">Description</Label>
              <div className="col-span-3 space-y-2">
                {descriptions.map((desc, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Textarea
                      value={desc}
                      onChange={(e) =>
                        handleDescriptionChange(index, e.target.value)
                      }
                      className="flex-1"
                      placeholder="Describe what you did in this project..."
                      rows={2}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeDescriptionField(index)}
                      disabled={descriptions.length === 1}
                      className="mt-1"
                    >
                      -
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDescriptionField}
                  className="w-full"
                >
                  + Add Another Description Point
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
