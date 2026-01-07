export const sanitizeFilename = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9\-_]/g, "") // Remove special chars (except hyphens/underscores)
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
};
