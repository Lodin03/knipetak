export interface Location {
  id: string;
  name: string;
  address?: string;
  postalCode: string;
  city?: string;
  area?: string;
}

export interface LocationFormData extends Omit<Location, "id"> {
  id?: string;
}
