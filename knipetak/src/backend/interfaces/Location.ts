export interface Location {
  id: string;
  name: string;
  address?: string;
  postalCode: string;
  city?: string;
  area?: string;
}

// Customer location (for booking addresses)
export interface CustomerLocation {
  address: string;
  city: string;
  postalCode: number;
}

export interface LocationFormData extends Omit<Location, "id"> {
  id?: string;
}
