/**
 * Generates a URL-safe slug from an organization name with a random suffix for uniqueness.
 * 
 * @param name - The organization name to convert to a slug.
 * @returns A unique, URL-safe slug (e.g., "acme-corporation-a1b2c3").
 */
export function generateSlug(name: string): string {
  const slug = name.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/[\s_]+/g, '-')   
    .replace(/-+/g, '-')        
    .replace(/^-+|-+$/g, '');   

  const randomSuffix = generateRandomSuffix(6);
  return `${slug}-${randomSuffix}`;
}

/**
 * Generates a random alphanumeric suffix of a specified length.
 * 
 * @param length - Length of the random suffix.
 * @returns A random alphanumeric string.
 */
function generateRandomSuffix(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
