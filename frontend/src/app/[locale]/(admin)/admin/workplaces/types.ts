export interface Workplace {
  id: string;
  name: string;
  municipality: string;
  municipality_name: string;
  logo: string | null;
  logo_url: string | null;
  promo_image: string | null;
  promo_image_url: string | null;
  description: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export interface Municipality {
  id: string;
  name: string;
  slug: string;
}
