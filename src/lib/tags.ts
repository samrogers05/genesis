// Color schemes for different types of tags
const colorSchemes = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-red-100 text-red-800 border-red-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
];

// Map to store tag colors
let tagColorMap: { [key: string]: string } = {};

// Initialize tag colors based on unique tags from Supabase
export function initializeTagColors(tags: string[]) {
  const uniqueTags = Array.from(new Set(tags));
  uniqueTags.forEach((tag, index) => {
    tagColorMap[tag] = colorSchemes[index % colorSchemes.length];
  });
}

// Helper function to get tag color classes
export function getTagColor(tag: string): string {
  return tagColorMap[tag] || "bg-gray-100 text-gray-800 border-gray-200";
}

// Helper function to get hover color classes
export function getTagHoverColor(tag: string): string {
  const baseColor = tagColorMap[tag] || "bg-gray-100 text-gray-800 border-gray-200";
  return baseColor.replace("100", "200").replace("200", "300");
} 