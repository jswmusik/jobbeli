"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  description: z.string().optional(),
  period: z.string().min(1, "Period krävs"),
  min_age: z.number().min(13).max(25),
  max_age: z.number().min(13).max(25),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface Period {
  id: string;
  name: string;
}

interface CreateGroupModalProps {
  periods: Period[];
  onSuccess: () => void;
}

export function CreateGroupModal({ periods, onSuccess }: CreateGroupModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      period: "",
      min_age: 15,
      max_age: 19,
    },
  });

  const onSubmit = async (data: GroupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post("/groups/", data);
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create group", err);
      setError("Kunde inte skapa grupp. Försök igen.");
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
        <Button
          className="bg-[#311B92] hover:bg-[#4527A0]"
          disabled={periods.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny Grupp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Skapa Jobbgrupp</DialogTitle>
          <DialogDescription>
            Skapa en grupp av jobb för lotteriet. Lotteriet körs per grupp.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gruppnamn</FormLabel>
                  <FormControl>
                    <Input placeholder="t.ex. Utomhusjobb" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivning (valfritt)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beskrivning av jobbgruppen..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-4">
                Åldersbegränsningar för denna grupp
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimiålder</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={13}
                          max={25}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maxålder</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={13}
                          max={25}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 19)}
                        />
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
                {isSubmitting ? "Skapar..." : "Skapa Grupp"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
