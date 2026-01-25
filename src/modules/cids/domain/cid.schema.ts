import { z } from 'zod';

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const searchCIDsSchema = z.object({
  q: z.string().min(1, 'Query de busca é obrigatória').optional(),
});

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type SearchCIDsInput = z.infer<typeof searchCIDsSchema>;

// =====================================================================
// OUTPUT INTERFACE
// =====================================================================

export interface CIDOutput {
  id: string;
  code: string;
  category: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
