"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Mail,
  Phone,
  Calendar,
  LogOut,
  Save,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";

interface CustomField {
  name: string;
  label: string;
  type: "text" | "single_select" | "multi_select";
  options?: string[];
  required?: boolean;
}

interface Municipality {
  id: string;
  name: string;
}

interface YouthProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string | null;
  grade: string;
  municipality: string | null;
  municipality_name: string | null;
  municipality_custom_fields: CustomField[];
  custom_attributes: Record<string, string | string[]>;
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Man" },
  { value: "FEMALE", label: "Kvinna" },
  { value: "OTHER", label: "Annat" },
  { value: "PREFER_NOT_TO_SAY", label: "Vill ej ange" },
];

const GRADE_OPTIONS = [
  { value: "YEAR_1", label: "Årskurs 1" },
  { value: "YEAR_2", label: "Årskurs 2" },
  { value: "YEAR_3", label: "Årskurs 3" },
  { value: "YEAR_4", label: "Årskurs 4" },
  { value: "YEAR_5", label: "Årskurs 5" },
  { value: "YEAR_6", label: "Årskurs 6" },
  { value: "YEAR_7", label: "Årskurs 7" },
  { value: "YEAR_8", label: "Årskurs 8" },
  { value: "YEAR_9", label: "Årskurs 9" },
  { value: "GYM_1", label: "Gymnasiet år 1" },
  { value: "GYM_2", label: "Gymnasiet år 2" },
  { value: "GYM_3", label: "Gymnasiet år 3" },
  { value: "GYM_4", label: "Gymnasiet år 4" },
];

export default function YouthProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<YouthProfile | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    date_of_birth: "",
    grade: "",
    municipality: "",
    custom_attributes: {} as Record<string, string | string[]>,
  });

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch ? localeMatch[1] : "sv";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile and municipalities in parallel
        const [profileRes, muniRes] = await Promise.all([
          apiClient.get("/users/my-profile/"),
          apiClient.get("/municipalities/"),
        ]);

        const profileData = profileRes.data;
        setProfile(profileData);
        setMunicipalities(muniRes.data.results || muniRes.data || []);

        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone_number: profileData.phone_number || "",
          gender: profileData.gender || "",
          date_of_birth: profileData.date_of_birth || "",
          grade: profileData.grade || "",
          municipality: profileData.municipality || "",
          custom_attributes: profileData.custom_attributes || {},
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.patch("/users/my-profile/", {
        ...formData,
        municipality: formData.municipality || null,
        date_of_birth: formData.date_of_birth || null,
      });
      setProfile(response.data);
      alert("Profil uppdaterad!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Kunde inte uppdatera profilen. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push(`/${locale}/login`);
  };

  const handleCustomFieldChange = (fieldName: string, value: string | string[]) => {
    setFormData({
      ...formData,
      custom_attributes: {
        ...formData.custom_attributes,
        [fieldName]: value,
      },
    });
  };

  const handleMultiSelectToggle = (fieldName: string, option: string) => {
    const current = (formData.custom_attributes[fieldName] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    handleCustomFieldChange(fieldName, updated);
  };

  // Get custom fields from selected municipality
  const getCustomFields = (): CustomField[] => {
    if (!formData.municipality || !profile?.municipality_custom_fields) {
      // If a different municipality is selected, fetch its custom fields
      const selectedMuni = municipalities.find(
        (m) => m.id === formData.municipality
      );
      if (selectedMuni && profile?.municipality !== formData.municipality) {
        // Return empty for now - fields will load after save
        return [];
      }
      return profile?.municipality_custom_fields || [];
    }
    return profile.municipality_custom_fields;
  };

  const customFields = getCustomFields();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#311B92]">Min profil</h2>

      {/* Personal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Personuppgifter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Förnamn</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                placeholder="Förnamn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Efternamn</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                placeholder="Efternamn"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                placeholder="07X-XXX XX XX"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Kön</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kön" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Födelsedatum</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Årskurs</Label>
            <Select
              value={formData.grade}
              onValueChange={(value) =>
                setFormData({ ...formData, grade: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj årskurs" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Municipality Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Kommun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="municipality">Välj din kommun</Label>
            <Select
              value={formData.municipality}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  municipality: value,
                  // Reset custom attributes when municipality changes
                  custom_attributes: {},
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kommun" />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((muni) => (
                  <SelectItem key={muni.id} value={muni.id}>
                    {muni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.municipality &&
            formData.municipality !== profile?.municipality && (
              <p className="text-sm text-amber-600">
                Spara för att ladda kommunens anpassade fält.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Custom Fields Card - Only show if municipality has custom fields */}
      {customFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kommunens frågor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === "text" && (
                  <Input
                    id={field.name}
                    value={
                      (formData.custom_attributes[field.name] as string) || ""
                    }
                    onChange={(e) =>
                      handleCustomFieldChange(field.name, e.target.value)
                    }
                    placeholder={`Ange ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === "single_select" && field.options && (
                  <Select
                    value={
                      (formData.custom_attributes[field.name] as string) || ""
                    }
                    onValueChange={(value) =>
                      handleCustomFieldChange(field.name, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Välj ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "multi_select" && field.options && (
                  <div className="space-y-2 border rounded-md p-3">
                    {field.options.map((opt) => {
                      const selected = (
                        (formData.custom_attributes[field.name] as string[]) ||
                        []
                      ).includes(opt);
                      return (
                        <div
                          key={opt}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${field.name}-${opt}`}
                            checked={selected}
                            onCheckedChange={() =>
                              handleMultiSelectToggle(field.name, opt)
                            }
                          />
                          <label
                            htmlFor={`${field.name}-${opt}`}
                            className="text-sm cursor-pointer"
                          >
                            {opt}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#311B92] hover:bg-[#4527A0]"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sparar...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Spara ändringar
          </>
        )}
      </Button>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kontoinformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">E-post</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logga ut
      </Button>
    </div>
  );
}
