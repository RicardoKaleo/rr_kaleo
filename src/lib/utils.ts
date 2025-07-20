import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to replace template variables with actual values
export function replaceTemplateVariables(
  text: string, 
  variables: Record<string, string>
): string {
  return text.replace(/\[([^\]]+)\]/g, (match, variableName) => {
    const value = variables[variableName];
    return value !== undefined ? value : match; // Keep original if variable not found
  });
}

// Available template variables for reference
export const TEMPLATE_VARIABLES = {
  '[client_first_name]': 'Client First Name',
  '[client_last_name]': 'Client Last Name',
  '[client_phone]': 'Client Phone',
  '[job_title]': 'Job Title',
  '[job_company]': 'Job Company',
  '[recruiter_name]': 'Recruiter Name'
} as const;

export type TemplateVariable = keyof typeof TEMPLATE_VARIABLES;
