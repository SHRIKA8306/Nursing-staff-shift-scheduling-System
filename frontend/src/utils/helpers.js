export const getInitials = (nameOrUser) => {
  if (!nameOrUser) return "NS";
  let name = typeof nameOrUser === 'string' ? nameOrUser : (nameOrUser.fullName || nameOrUser.username || "Nurse");
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};
