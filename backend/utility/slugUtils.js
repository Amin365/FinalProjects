/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @param {string} [suffix] - Optional suffix to append (e.g., for uniqueness)
 * @returns {string} The generated slug
 */
export const generateSlug = (text, suffix = "") => {
  if (!text) return "";

  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, "")
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  // Limit slug length (60 chars for readability, leaves room for suffix)
  slug = slug.substring(0, 60);

  // Add suffix if provided
  if (suffix) {
    slug = `${slug}-${suffix}`;
  }

  return slug;
};

/**
 * Generate a unique slug by checking against existing slugs in the database
 * @param {Object} Model - The Mongoose model to check against
 * @param {string} text - The text to convert to a slug
 * @param {string} [excludeId] - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} The unique slug
 */
export const generateUniqueSlug = async (Model, text, excludeId = null) => {
  const baseSlug = generateSlug(text);
  if (!baseSlug) return "";

  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query).select("_id").lean();
    
    if (!existing) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Safety limit to prevent infinite loops
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      isUnique = true;
    }
  }

  return slug;
};

/**
 * Validate a slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} Whether the slug is valid
 */
export const isValidSlug = (slug) => {
  if (!slug || typeof slug !== "string") return false;
  // Must be lowercase, alphanumeric with hyphens, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
};
