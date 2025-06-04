"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = Dialog;

const AlertDialogTrigger = DialogTrigger;

const AlertDialogPortal = DialogPortal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogOverlay>,
  React.ComponentPropsWithoutRef<typeof DialogOverlay>
>(({ className, ...props }, ref) => (
  <DialogOverlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = DialogOverlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <DialogContent
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = DialogContent.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = DialogTitle.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => (
  <DialogDescription
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = DialogDescription.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof DialogClose>,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ className, ...props }, ref) => (
  <DialogClose
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));
AlertDialogAction.displayName = DialogClose.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof DialogClose>,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ className, ...props }, ref) => (
  <DialogClose
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = DialogClose.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
