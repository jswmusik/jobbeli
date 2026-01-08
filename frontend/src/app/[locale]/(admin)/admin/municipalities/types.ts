export interface Municipality {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logo_url: string | null;
  hero_image: string | null;
  hero_image_url: string | null;
  description: string;
  custom_fields_schema: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
