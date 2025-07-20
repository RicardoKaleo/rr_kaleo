# Template Variables System

## Overview

The template variables system allows you to use dynamic placeholders in email subjects and bodies that get automatically replaced with actual values when sending emails.

## Available Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `[client_first_name]` | Client's first name | "John" |
| `[client_last_name]` | Client's last name | "Doe" |
| `[client_phone]` | Client's phone number | "+1-555-123-4567" |
| `[job_title]` | Job position title | "Senior Software Engineer" |
| `[job_company]` | Company name | "Tech Corp" |
| `[recruiter_name]` | Recruiter's name | "Sarah Johnson" |

## How It Works

### 1. Variable Usage in Templates
When composing emails, you can use variables in square brackets:

```
Subject: Application for [job_title] position at [job_company]

Body:
Dear [recruiter_name],

I am writing to express my interest in the [job_title] position at [job_company].

Best regards,
[client_first_name] [client_last_name]
Phone: [client_phone]
```

### 2. Automatic Replacement
When the email is sent, the system automatically:
- Fetches the actual data for the job listing, client, and recruiter
- Replaces all variables with their real values
- Sends the email with the processed content

### 3. Example Output
The above template would become:

```
Subject: Application for Senior Software Engineer position at Tech Corp

Body:
Dear Sarah Johnson,

I am writing to express my interest in the Senior Software Engineer position at Tech Corp.

Best regards,
John Doe
Phone: +1-555-123-4567
```

## Implementation Details

### Variable Replacement Function
```typescript
import { replaceTemplateVariables } from '@/lib/utils';

const template = "Hello [client_first_name]!";
const variables = {
  client_first_name: "John"
};

const result = replaceTemplateVariables(template, variables);
// Result: "Hello John!"
```

### Available Variables Reference
```typescript
import { TEMPLATE_VARIABLES } from '@/lib/utils';

// TEMPLATE_VARIABLES contains all available variables
console.log(TEMPLATE_VARIABLES);
// {
//   '[client_first_name]': 'Client First Name',
//   '[client_last_name]': 'Client Last Name',
//   '[client_phone]': 'Client Phone',
//   '[job_title]': 'Job Title',
//   '[job_company]': 'Job Company',
//   '[recruiter_name]': 'Recruiter Name'
// }
```

## Data Sources

The variables are populated from the following database relationships:

- **Client Data**: `clients` table (first_name, last_name, phone)
- **Job Data**: `job_listings` table (title, company)
- **Recruiter Data**: `job_recruiters` → `recruiters` table (name)

## Error Handling

- **Missing Variables**: If a variable doesn't have a corresponding value, the original `[variable_name]` is kept in the text
- **Empty Values**: If a field is empty in the database, an empty string is used
- **Invalid Variables**: Unknown variables are left unchanged

## Usage Examples

### Email Subject Examples
```
"Application for [job_title] position"
"Following up on [job_company] opportunity"
"Thank you [recruiter_name] for your time"
```

### Email Body Examples
```
"Dear [recruiter_name],

I am [client_first_name] [client_last_name] and I'm interested in the [job_title] position at [job_company].

You can reach me at [client_phone].

Best regards,
[client_first_name]"
```

### Follow-up Email Examples
```
"Hi [recruiter_name],

I wanted to follow up on my application for the [job_title] role at [job_company].

Looking forward to hearing from you.

Best regards,
[client_first_name] [client_last_name]"
```

## Best Practices

### 1. Variable Placement
- Use variables naturally in sentences
- Avoid using too many variables in a single sentence
- Keep the email personal and professional

### 2. Fallback Handling
- Always provide fallback text for important information
- Test templates with missing data
- Consider default values for optional fields

### 3. Template Design
- Keep templates concise and clear
- Use variables to personalize the message
- Maintain professional tone across all templates

## Future Enhancements

### 1. Additional Variables
- `[client_email]` - Client's email address
- `[client_linkedin]` - Client's LinkedIn URL
- `[job_location]` - Job location
- `[job_salary]` - Salary range
- `[recruiter_email]` - Recruiter's email

### 2. Conditional Variables
- `[if_client_phone]...[/if_client_phone]` - Conditional blocks
- `[if_job_salary]Salary: [job_salary][/if_job_salary]` - Show only if available

### 3. Formatting Options
- `[client_first_name:title]` - Title case formatting
- `[job_company:upper]` - Uppercase formatting
- `[client_phone:masked]` - Masked phone number

## Testing Variables

To test variable replacement:

```typescript
import { replaceTemplateVariables } from '@/lib/utils';

const testTemplate = "Hello [client_first_name] [client_last_name]!";
const testVariables = {
  client_first_name: "John",
  client_last_name: "Doe"
};

const result = replaceTemplateVariables(testTemplate, testVariables);
console.log(result); // "Hello John Doe!"
```

This system provides a flexible and powerful way to create personalized email templates while maintaining clean, readable code. 