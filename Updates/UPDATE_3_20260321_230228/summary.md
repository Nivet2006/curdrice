# Error Summary: TypeError reading '0' on Zod validation

## The Error
When submitting the registration form with invalid data, the application crashed with a 500 internal server error: `TypeError: Cannot read properties of undefined (reading '0')` at `registerProfile()`.

## What Caused It?
In the Server Action for registration, the Zod validation failure block previously attempted to read the first error message using `result.error.errors[0].message`. However, `ZodError` instances in the `safeParse` result do not have an `errors` array property; the correct property that contains the array of validation failures is `issues`. Because `result.error.errors` was `undefined`, attempting to access index `[0]` on it caused the TypeError crash when the form failed validation.

## How It Was Solved
The reference was changed to use the correct `issues` property, with an optional chaining fallback:
```typescript
if (!result.success) {
  return { error: result.error.issues[0]?.message || 'Validation failed' }
}
```
