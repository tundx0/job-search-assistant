"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ExperienceModal,
  ExperienceEntry,
} from "@/components/profile/experience-modal";
import {
  EducationModal,
  EducationEntry,
} from "@/components/profile/education-modal";
import {
  ProjectModal,
  ProjectEntry,
} from "@/components/profile/projects-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import { Pencil, Trash, Plus } from "lucide-react";

// Common properties shared between all entry types
interface BaseEntry {
  id?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description: string | string[];
  current?: boolean;
}

// Type guard functions for better type safety
function isExperienceEntry(item: BaseEntry): item is ExperienceEntry {
  return "title" in item && "company" in item;
}

function isEducationEntry(item: BaseEntry): item is EducationEntry {
  return "degree" in item && "institution" in item;
}

function isProjectEntry(item: BaseEntry): item is ProjectEntry {
  return "name" in item && !("company" in item) && !("institution" in item);
}

// Type alias for the union type
type EntryType = ExperienceEntry | EducationEntry | ProjectEntry;

// Props for the main component
interface ProfileEntryListProps {
  type: "experience" | "education" | "projects";
  items: EntryType[];
  onUpdate: (items: EntryType[]) => void;
}

// Props for the entry card component
interface EntryCardProps {
  item: EntryType;
  index: number;
  type: "experience" | "education" | "projects";
  onEdit: (item: EntryType, index: number) => void;
  onDelete: (index: number) => void;
  formatDate: (date: string) => string;
}

/**
 * EntryCard component - Displays a single experience or education entry
 */
function EntryCard({
  item,
  index,
  type,
  onEdit,
  onDelete,
  formatDate,
}: EntryCardProps) {
  // Get the title and subtitle based on entry type
  let title = "";
  let subtitle = "";

  if (type === "experience") {
    title = (item as ExperienceEntry).title;
    subtitle = (item as ExperienceEntry).company;
  } else if (type === "education") {
    title = (item as EducationEntry).degree;
    subtitle = (item as EducationEntry).institution;
  } else if (type === "projects") {
    title = (item as ProjectEntry).name;
    subtitle = "Project";
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item, index)}
              aria-label="Edit entry"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(index)}
              aria-label="Delete entry"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-muted-foreground mb-2">
          {item.startDate && formatDate(item.startDate)}{" "}
          {item.endDate && `- ${formatDate(item.endDate)}`}
          {"location" in item && item.location && ` • ${item.location}`}
        </div>
        {Array.isArray(item.description) ? (
          <div className="space-y-1">
            {(item.description as string[]).map((desc, i) => (
              <p key={i} className="text-sm whitespace-pre-line">
                • {desc}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line">
            {item.description as string}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfileEntryList({
  type,
  items = [], // Provide default empty array
  onUpdate,
}: ProfileEntryListProps) {
  // Modal and dialog state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<EntryType | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Memoize the title for better performance
  const listTitle = useMemo(() => {
    if (type === "experience") return "Work Experience";
    if (type === "education") return "Education";
    if (type === "projects") return "Projects";
    return "";
  }, [type]);

  /**
   * Handles adding a new entry
   */
  const handleAdd = (item: EntryType) => {
    // Create new item with unique ID
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
    };

    // Ensure items is an array before spreading
    const currentItems = Array.isArray(items) ? items : [];

    // Use type guards for better type safety
    if (type === "experience" && isExperienceEntry(item)) {
      onUpdate([...currentItems, newItem] as ExperienceEntry[]);
    } else if (type === "education" && isEducationEntry(item)) {
      onUpdate([...currentItems, newItem] as EducationEntry[]);
    } else if (type === "projects" && isProjectEntry(item)) {
      onUpdate([...currentItems, newItem] as ProjectEntry[]);
    }
  };

  /**
   * Handles editing an existing entry
   */
  const handleEdit = (item: EntryType) => {
    if (!currentItem) return;

    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...item,
      id: currentItem.id, // Preserve the original ID
    };

    // Use type guards for better type safety
    if (type === "experience" && isExperienceEntry(item)) {
      onUpdate(updatedItems as ExperienceEntry[]);
    } else if (type === "education" && isEducationEntry(item)) {
      onUpdate(updatedItems as EducationEntry[]);
    } else if (type === "projects" && isProjectEntry(item)) {
      onUpdate(updatedItems as ProjectEntry[]);
    }
  };

  /**
   * Handles deleting an entry
   */
  const handleDelete = () => {
    // Filter out the item at currentIndex
    const updatedItems = items.filter((_, index) => index !== currentIndex);

    // Type-safe update based on entry type
    if (type === "experience") {
      onUpdate(updatedItems as ExperienceEntry[]);
    } else if (type === "education") {
      onUpdate(updatedItems as EducationEntry[]);
    } else if (type === "projects") {
      onUpdate(updatedItems as ProjectEntry[]);
    }

    setIsDeleteDialogOpen(false);
  };

  /**
   * Opens the edit modal for an item
   */
  const openEditModal = (item: EntryType, index: number) => {
    setCurrentItem(item);
    setCurrentIndex(index);
    setIsEditModalOpen(true);
  };

  /**
   * Opens the delete confirmation dialog
   */
  const openDeleteDialog = (index: number) => {
    setCurrentIndex(index);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Formats a date string for display
   */
  const formatDate = (dateString: string) => {
    if (dateString === "Present") return "Present";

    try {
      // Handle YYYY-MM format
      if (/^\d{4}-\d{2}$/.test(dateString)) {
        const [year, month] = dateString.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
      }
      return dateString;
    } catch {
      return dateString; // Fallback to original string if parsing fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{listTitle}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add{" "}
          {type === "experience"
            ? "Experience"
            : type === "education"
            ? "Education"
            : "Project"}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No {type} entries yet. Click the button above to add one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(items) &&
            items.map((item, index) => (
              <EntryCard
                key={item.id || index}
                item={item}
                index={index}
                type={type}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
                formatDate={formatDate}
              />
            ))}
        </div>
      )}

      {type === "experience" ? (
        <>
          <ExperienceModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAdd}
            mode="add"
          />
          {currentItem && (
            <ExperienceModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              initialData={currentItem as ExperienceEntry}
              mode="edit"
            />
          )}
        </>
      ) : type === "education" ? (
        <>
          <EducationModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAdd}
            mode="add"
          />
          {currentItem && (
            <EducationModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              initialData={currentItem as EducationEntry}
              mode="edit"
            />
          )}
        </>
      ) : (
        <>
          <ProjectModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAdd}
            mode="add"
          />
          {currentItem && (
            <ProjectModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              initialData={currentItem as ProjectEntry}
              mode="edit"
            />
          )}
        </>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {type} entry. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
