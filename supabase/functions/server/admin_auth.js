export function normalizeAdminEmails(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function metadataContainsAdminFlag(metadata) {
  if (!metadata || typeof metadata !== "object") return false;

  const adminValues = [
    metadata.role,
    metadata.admin,
    metadata.is_admin,
    metadata.isAdmin,
    metadata.adminRole,
    metadata.app_role,
    metadata.user_role,
    metadata.access_level,
  ];

  return adminValues.some((value) => {
    if (typeof value === "boolean") return value === true;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return ["admin", "superadmin", "owner", "staff"].includes(normalized);
    }
    if (typeof value === "number") return value === 1;
    return false;
  });
}

export function isAdminUser(user, adminEmails = []) {
  if (!user || typeof user !== "object") return false;
  if (!user.email) return false;
  if (!user.email_confirmed_at) return false;

  const normalizedEmail = user.email.trim().toLowerCase();
  const normalizedAllowlist = normalizeAdminEmails(Array.isArray(adminEmails) ? adminEmails.join(",") : adminEmails);

  if (normalizedAllowlist.length > 0 && normalizedAllowlist.includes(normalizedEmail)) {
    return true;
  }

  const metadataSources = [
    user.app_metadata,
    user.raw_app_meta_data,
  ];

  return metadataSources.some((metadata) => metadataContainsAdminFlag(metadata));
}
