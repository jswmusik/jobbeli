"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";

const periodSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  start_date: z.string().min(1, "Startdatum krävs"),
  end_date: z.string().min(1, "Slutdatum krävs"),
  application_open: z.string().min(1, "Öppningsdatum krävs"),
  application_close: z.string().min(1, "Stängningsdatum krävs"),
});

type PeriodFormData = z.infer<typeof periodSchema>;

interface CreatePeriodModalProps {
  onSuccess: () => void;
}

export function CreatePeriodModal({ onSuccess }: CreatePeriodModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      application_open: "",
      application_close: "",
    },
  });

  const onSubmit = async (data: PeriodFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post("/periods/", data);
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create period", err);
      setError("Kunde inte skapa period. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#311B92] hover:bg-[#4527A0]">
          <Plus className="h-4 w-4 mr-2" />
          Ny Period
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Skapa Period</DialogTitle>
          <DialogDescription>
            Definiera en ny arbetsperiod för feriejobb.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Periodnamn</FormLabel>
                  <FormControl>
                    <Input placeholder="t.ex. Period 1 - Juni" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jobbstart</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jobbslut</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-4">
                Ansökningsfönster - när kan ungdomar söka?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="application_open"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ansökan öppnar</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="application_close"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ansökan stänger</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#311B92] hover:bg-[#4527A0]"
              >
                {isSubmitting ? "Skapar..." : "Skapa Period"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
