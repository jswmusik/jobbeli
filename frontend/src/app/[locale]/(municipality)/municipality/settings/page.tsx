"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trash2,
  Plus,
  Save,
  Pencil,
  List,
  Type,
  CheckSquare,
  GripVertical,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define field types
type FieldType = "text" | "single_select" | "multi_select";

// Define what a "Custom Field" looks like
interface CustomField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

// API response might have old format with comma-separated string
interface CustomFieldFromAPI {
  key: string;
  label: string;
  type: FieldType;
  options?: string | string[];
}

// Type option for selection
interface TypeOption {
  value: FieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const fieldTypes: TypeOption[] = [
  {
    value: "text",
    label: "Text",
    description: "Free text input",
    icon: <Type size={20} />,
  },
  {
    value: "single_select",
    label: "Single Select",
    description: "Choose one option",
    icon: <List size={20} />,
  },
  {
    value: "multi_select",
    label: "Multi Select",
    description: "Choose multiple options",
    icon: <CheckSquare size={20} />,
  },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [municipalityName, setMunicipalityName] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Field form state
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [newOptionValue, setNewOptionValue] = useState("");

  // Fetch current settings
  useEffect(() => {
    apiClient
      .get("/municipalities/my-config/")
      .then((res) => {
        const schema = res.data.custom_fields_schema;
        setMunicipalityName(res.data.name || "Municipality");
        // Ensure schema is always an array and convert old format if needed
        if (Array.isArray(schema)) {
          // Convert old comma-separated options to array format
          const converted = schema.map((field: CustomFieldFromAPI): CustomField => ({
            ...field,
            options:
              typeof field.options === "string"
                ? field.options.split(",").map((o: string) => o.trim()).filter(Boolean)
                : field.options || [],
          }));
          setFields(converted);
        } else {
          setFields([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch config", err);
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, []);

  // Generate key from label
  const generateKey = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  // Reset modal form
  const resetForm = () => {
    setFieldLabel("");
    setFieldType("text");
    setFieldOptions([]);
    setNewOptionValue("");
    setEditingIndex(null);
  };

  // Open modal for new field
  const openNewFieldModal = () => {
    resetForm();
    setModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (index: number) => {
    const field = fields[index];
    setEditingIndex(index);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldOptions(field.options || []);
    setNewOptionValue("");
    setModalOpen(true);
  };

  // Add option to list
  const addOption = () => {
    const trimmed = newOptionValue.trim();
    if (!trimmed) return;
    if (fieldOptions.includes(trimmed)) {
      toast.error("This option already exists");
      return;
    }
    setFieldOptions([...fieldOptions, trimmed]);
    setNewOptionValue("");
  };

  // Remove option from list
  const removeOption = (index: number) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index));
  };

  // Handle key press in option input
  const handleOptionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  // Save field from modal
  const saveField = () => {
    if (!fieldLabel.trim()) {
      toast.error("Please enter a field name");
      return;
    }

    if (
      (fieldType === "single_select" || fieldType === "multi_select") &&
      fieldOptions.length < 2
    ) {
      toast.error("Please add at least 2 options for selection fields");
      return;
    }

    const newField: CustomField = {
      key: generateKey(fieldLabel),
      label: fieldLabel.trim(),
      type: fieldType,
      options:
        fieldType === "single_select" || fieldType === "multi_select"
          ? fieldOptions
          : undefined,
    };

    if (editingIndex !== null) {
      // Update existing
      const updated = [...fields];
      updated[editingIndex] = newField;
      setFields(updated);
    } else {
      // Add new
      setFields([...fields, newField]);
    }

    setModalOpen(false);
    resetForm();
    toast.success(editingIndex !== null ? "Field updated" : "Field added");
  };

  // Delete field
  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    toast.success("Field removed");
  };

  // Save to backend
  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/municipalities/my-config/", {
        custom_fields_schema: fields,
      });
      toast.success("Settings saved!");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Get icon for field type
  const getTypeIcon = (type: FieldType) => {
    switch (type) {
      case "single_select":
        return <List size={14} />;
      case "multi_select":
        return <CheckSquare size={14} />;
      default:
        return <Type size={14} />;
    }
  };

  // Get label for field type
  const getTypeLabel = (type: FieldType) => {
    switch (type) {
      case "single_select":
        return "Single Select";
      case "multi_select":
        return "Multi Select";
      default:
        return "Text";
    }
  };

  // Check if current type needs options
  const needsOptions = fieldType === "single_select" || fieldType === "multi_select";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">{municipalityName}</p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-[#311B92] hover:bg-[#4527A0]"
        >
          <Save size={18} className="mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Custom Fields Card */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Criteria Fields</CardTitle>
          <CardDescription>
            Create fields to categorize jobs (e.g., School, District, Department).
            Youth can then be matched to jobs based on these criteria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <div className="text-gray-400 mb-3">
                <List size={40} className="mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">No fields yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Add fields to categorize your jobs
              </p>
              <Button onClick={openNewFieldModal} variant="outline">
                <Plus size={16} className="mr-2" />
                Add First Field
              </Button>
            </div>
          ) : (
            <>
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-300 cursor-grab">
                      <GripVertical size={18} />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      {getTypeIcon(field.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{field.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {getTypeLabel(field.type)}
                        </Badge>
                        {(field.type === "single_select" ||
                          field.type === "multi_select") &&
                          field.options && (
                            <span className="text-xs text-gray-400">
                              {field.options.length} options
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteField(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={openNewFieldModal}
                className="w-full mt-4 border-dashed"
              >
                <Plus size={16} className="mr-2" />
                Add Field
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Field Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Field" : "Add New Field"}
            </DialogTitle>
            <DialogDescription>
              {editingIndex !== null
                ? "Update this field's settings"
                : "Create a new field for categorizing jobs"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Field Name */}
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                placeholder="e.g., Target School, Department, District"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                autoFocus
              />
            </div>

            {/* Field Type Selection */}
            <div className="space-y-3">
              <Label>Field Type</Label>
              <div className="grid gap-2">
                {fieldTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFieldType(type.value);
                      // Clear options when switching to text
                      if (type.value === "text") {
                        setFieldOptions([]);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                      fieldType === type.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        fieldType === type.value
                          ? "bg-purple-100 text-purple-600"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {type.icon}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-medium",
                          fieldType === type.value
                            ? "text-purple-700"
                            : "text-gray-700"
                        )}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options Section (for select types) */}
            {needsOptions && (
              <div className="space-y-3">
                <Label>Options</Label>

                {/* Option input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type an option and press Enter"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    onKeyDown={handleOptionKeyPress}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addOption}
                    disabled={!newOptionValue.trim()}
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Options list */}
                {fieldOptions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {fieldOptions.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 px-3 bg-gray-50 rounded-lg group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-5">
                            {index + 1}.
                          </span>
                          <span className="text-sm">{option}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-gray-400">
                      No options yet. Add at least 2 options.
                    </p>
                  </div>
                )}

                {fieldOptions.length > 0 && fieldOptions.length < 2 && (
                  <p className="text-xs text-amber-600">
                    Add at least {2 - fieldOptions.length} more option
                    {2 - fieldOptions.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveField}
              className="bg-[#311B92] hover:bg-[#4527A0]"
              disabled={
                !fieldLabel.trim() ||
                (needsOptions && fieldOptions.length < 2)
              }
            >
              {editingIndex !== null ? "Update Field" : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
