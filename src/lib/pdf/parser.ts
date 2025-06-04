/**
 * Utilities for parsing resume/cover letter content into structured sections
 */

/**
 * Parse content into sections based on headers
 */
export function parseSections(content: string): { title: string; content: string }[] {
  // First strip any markdown formatting
  const plainText = stripMarkdown(content);
  
  // Split by section headers
  const sections: { title: string; content: string }[] = [];
  const lines = plainText.split(/\r?\n/);
  
  let currentTitle = '';
  let currentContent = '';
  
  for (const line of lines) {
    if (isSectionHeader(line)) {
      // Save previous section if we have one
      if (currentTitle && currentContent) {
        sections.push({
          title: currentTitle,
          content: currentContent.trim()
        });
      }
      
      // Start new section
      currentTitle = line.replace(/\*\*/g, '').replace(/:$/, '').trim();
      currentContent = '';
    } else if (currentTitle) {
      // Add to current section
      currentContent += (currentContent ? '\n' : '') + line;
    } else {
      // Header content before first section (likely contact info)
      if (!sections.length) {
        // If this is the first content and no title yet, create a header section
        if (!currentContent) {
          currentTitle = 'Header';
        }
      }
      currentContent += (currentContent ? '\n' : '') + line;
    }
  }
  
  // Add final section
  if ((currentTitle && currentContent) || (!sections.length && currentContent)) {
    // If we have no sections but have content, make sure it gets added
    sections.push({
      title: currentTitle || 'Content',
      content: currentContent.trim()
    });
  }
  
  return sections;
}

/**
 * Helper to identify section headers
 */
function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  
  // Common resume section headers
  const commonHeaders = [
    'EDUCATION', 'WORK EXPERIENCE', 'EXPERIENCE', 'EMPLOYMENT', 
    'SKILLS', 'TECHNICAL SKILLS', 'PROJECTS', 'ADDITIONAL', 
    'CERTIFICATIONS', 'AWARDS', 'PUBLICATIONS', 'LANGUAGES',
    'VOLUNTEER', 'INTERESTS', 'REFERENCES', 'SUMMARY', 'OBJECTIVE',
    'PROFESSIONAL SUMMARY', 'QUALIFICATIONS', 'PROFESSIONAL EXPERIENCE'
  ];
  
  // Check if the line is a common header (case insensitive)
  if (commonHeaders.some(header => 
    trimmed.toUpperCase() === header ||
    trimmed.toUpperCase() === header + ':'
  )) {
    return true;
  }
  
  return (
    /^[A-Z][A-Z\s]+:?$/.test(trimmed) || // ALL CAPS or ALL CAPS:
    /^.+:$/.test(trimmed) ||            // Ends with colon
    /^\*\*[^*]+\*\*$/.test(trimmed)     // Surrounded by ** (bold in markdown)
  );
}

/**
 * Helper to strip markdown formatting
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')      // Remove code blocks
    .replace(/\*\*(.*?)\*\*/g, '$1')     // Remove bold
    .replace(/\*(.*?)\*/g, '$1')         // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // Remove links
    .replace(/^#+\s+/gm, '')             // Remove heading markers
    .replace(/\|/g, ' | ')              // Ensure proper spacing around pipe symbols
    .replace(/•/g, '●')                 // Standardize bullet points
    .replace(/\s+/g, ' ')               // Normalize spacing (replace multiple spaces with single space)
    .replace(/\n\s*\n/g, '\n\n')        // Normalize multiple new lines
    .trim();
}
