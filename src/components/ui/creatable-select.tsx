"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type OptionType = {
  label: string;
  value: string;
};

interface CreatableSelectProps {
  placeholder?: string;
  emptyMessage?: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: OptionType[];
  disabled?: boolean;
  className?: string;
}

export function CreatableSelect({
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  value = [],
  onChange,
  suggestions = [],
  disabled = false,
  className,
}: CreatableSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Enter" && inputValue) {
        e.preventDefault();
        if (!value.includes(inputValue.trim())) {
          onChange([...value, inputValue.trim()]);
          setInputValue("");
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        onChange(value.slice(0, -1));
      }
    }
  };

  const handleSelect = (selectedValue: string) => {
    if (!value.includes(selectedValue)) {
      onChange([...value, selectedValue]);
    }
    setInputValue("");
    setOpen(false);
  };

  const handleCreateItem = () => {
    if (inputValue && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  // Filter suggestions based on input value
  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if input value already exists in suggestions
  const itemExists = suggestions.some(
    (suggestion) => suggestion.label.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              value.length > 0 ? "h-full" : "h-10"
            )}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex flex-wrap gap-1 items-center">
              {value.length > 0 ? (
                <div className="flex flex-wrap gap-1 items-center">
                  {value.map((item) => (
                    <Badge
                      variant="secondary"
                      key={item}
                      className="mr-1 mb-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      {item}
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(item);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(item);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                placeholder
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command onKeyDown={handleKeyDown}>
            <CommandInput
              ref={inputRef}
              placeholder="Search or add new..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandEmpty>
              {emptyMessage}
              {inputValue && !itemExists && (
                <div className="py-2 px-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleCreateItem}
                  >
                    <span>Create</span> &quot;{inputValue}&quot;
                  </Button>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.value}
                  value={suggestion.value}
                  onSelect={() => handleSelect(suggestion.label)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(suggestion.label)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {suggestion.label}
                </CommandItem>
              ))}
              {inputValue && !itemExists && filteredSuggestions.length > 0 && (
                <CommandItem onSelect={handleCreateItem}>
                  <span>Create</span> &quot;{inputValue}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
