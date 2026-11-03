export type Company = {
  id: string;
  name: string;
  short_name: string;
  company_code: string;
  slug: string;
  logo_url: string;
  cover_image_url: string;
  description: string;
  business_type: string;
  tax_code: string;
  business_license_no: string;
  legal_representative: string;
  representative_phone: string;
  email: string;
  phone: string;
  website: string;
  is_active: boolean;
  /** Username of the user who created / last updated the company. */
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
