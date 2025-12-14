import { z } from 'zod';

// Auth validation schema
export const authSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128, { message: "Password must be less than 128 characters" })
});

// Report form validation schema
export const reportFormSchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
  location: z.string().trim().min(1, { message: "Location is required" }).max(500, { message: "Location must be less than 500 characters" }),
  description: z.string().trim().min(10, { message: "Description must be at least 10 characters" }).max(5000, { message: "Description must be less than 5000 characters" })
});

// GPS coordinates validation schema
export const gpsCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
}).nullable();

// Photo validation - max 10 photos, each under 5MB (base64 ~7MB)
const MAX_PHOTO_SIZE = 7 * 1024 * 1024; // ~5MB original = ~7MB base64
export const photosSchema = z.array(
  z.string().max(MAX_PHOTO_SIZE, { message: "Photo is too large (max 5MB)" })
).max(10, { message: "Maximum 10 photos allowed" });

// Full report submission schema
export const reportSubmissionSchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
  location: z.string().trim().min(1, { message: "Location is required" }).max(500, { message: "Location must be less than 500 characters" }),
  description: z.string().trim().min(10, { message: "Description must be at least 10 characters" }).max(5000, { message: "Description must be less than 5000 characters" }),
  gps_coordinates: gpsCoordinatesSchema.optional(),
  gps_address: z.string().max(500).nullable().optional(),
  photos: photosSchema.optional(),
  user_id: z.string().uuid({ message: "Invalid user ID" })
});

export type AuthInput = z.infer<typeof authSchema>;
export type ReportFormInput = z.infer<typeof reportFormSchema>;
export type ReportSubmissionInput = z.infer<typeof reportSubmissionSchema>;
