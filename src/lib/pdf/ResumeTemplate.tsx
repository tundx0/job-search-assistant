import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register default fonts
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica-bold@1.0.4/Helvetica-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 35, // Slightly increased padding for better margins
    fontFamily: "Helvetica",
    fontSize: 11, // Slightly smaller font size for more content
    lineHeight: 1.4,
    backgroundColor: "#FFFFFF", // Ensure white background for printing
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 20, // Slightly smaller for better spacing
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 0.5, // Better readability
    textAlign: "center",
  },
  contactInfo: {
    fontSize: 10,
    color: "#222222", // Darker for better contrast and ATS readability
    marginBottom: 8,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 15,
    position: "relative", // For positioning elements
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#444444", // Darker for better contrast
    paddingBottom: 3,
    textTransform: "uppercase", // Consistent uppercase for section titles
  },
  sectionContent: {
    marginTop: 6,
  },
  paragraph: {
    marginBottom: 6,
    textAlign: "justify", // Better text flow
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start", // Align items at the top
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    marginTop: 1, // Align with first line of text
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5, // Slightly smaller for bullet points
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontWeight: "bold",
    marginBottom: 4,
    alignItems: "center", // Better vertical alignment
  },
  experienceTitle: {
    fontWeight: "bold",
    fontSize: 11.5, // Slightly larger than body text
  },
  experienceCompany: {
    fontWeight: "bold",
  },
  experienceDate: {
    fontWeight: "normal",
    fontSize: 10,
    color: "#333333", // Slightly lighter for visual hierarchy
    fontStyle: "italic", // Italicize dates for distinction
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
    marginBottom: 2,
  },
  skillItem: {
    marginRight: 6,
    marginBottom: 4,
  },
  location: {
    fontStyle: "italic",
    fontSize: 10,
    color: "#444444",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 9,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#666666",
  },
});

// Props interface
interface ResumeTemplateProps {
  name: string;
  sections: {
    title: string;
    content: string;
  }[];
}

/**
 * Resume Template Component for PDF generation
 */
export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({
  name,
  sections,
}) => {
  // Find header/contact section if it exists
  const headerSection = sections.find(
    (s) =>
      s.title.toLowerCase() === "header" ||
      s.title.toLowerCase().includes("contact")
  );

  // Sort sections in a logical order for resumes
  const sectionOrder = [
    "summary",
    "professional summary",
    "objective",
    "education",
    "experience",
    "work experience",
    "employment",
    "professional experience",
    "skills",
    "technical skills",
    "projects",
    "certifications",
    "awards",
    "publications",
    "languages",
    "additional",
    "interests",
  ];

  // Sort sections by their expected order
  const contentSections = sections
    .filter((s) => s !== headerSection)
    .sort((a, b) => {
      const indexA = sectionOrder.findIndex((title) =>
        a.title.toLowerCase().includes(title)
      );
      const indexB = sectionOrder.findIndex((title) =>
        b.title.toLowerCase().includes(title)
      );

      // If both sections are found in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is found, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is found, maintain original order
      return 0;
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header/Name Section */}
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {headerSection && (
            <Text style={styles.contactInfo}>{headerSection.content}</Text>
          )}
        </View>

        {/* Content Sections */}
        {contentSections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </Text>
            {renderSectionContent(section.content)}
          </View>
        ))}

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

/**
 * Helper to render section content with proper formatting
 */
const renderSectionContent = (content: string) => {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];

  let inBulletList = false;
  let bulletItems: string[] = [];
  let currentParagraph = "";
  let currentExperienceCompany = ""; // Used to detect location lines

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentParagraph) {
        elements.push(
          <Text key={`p-${i}`} style={styles.paragraph}>
            {currentParagraph}
          </Text>
        );
        currentParagraph = "";
      }
      continue;
    }

    // Check if this is a bullet point (support multiple bullet styles)
    if (
      line.startsWith("•") ||
      line.startsWith("●") ||
      line.startsWith("-") ||
      line.startsWith("*") ||
      line.startsWith("‣")
    ) {
      // If we were building a paragraph, finish it
      if (currentParagraph) {
        elements.push(
          <Text key={`p-${i}`} style={styles.paragraph}>
            {currentParagraph}
          </Text>
        );
        currentParagraph = "";
      }

      // Add to bullet items
      inBulletList = true;
      bulletItems.push(line.substring(1).trim());
    }
    // Check if this is an experience header with pipe separator
    else if (line.includes("|")) {
      // If we were building a paragraph, finish it
      if (currentParagraph) {
        elements.push(
          <Text key={`p-${i}`} style={styles.paragraph}>
            {currentParagraph}
          </Text>
        );
        currentParagraph = "";
      }

      // If we were in a bullet list, finish it
      if (inBulletList && bulletItems.length > 0) {
        elements.push(renderBulletList(bulletItems, `bl-${i}`));
        bulletItems = [];
        inBulletList = false;
      }

      // Parse the experience header parts
      const parts = line.split("|").map((p) => p.trim());

      // First part is typically job title or company
      let title = parts[0];
      let company = "";
      let dates = "";

      // Parse different formats
      if (parts.length >= 3) {
        // Format: Job Title | Company | Dates
        title = parts[0];
        company = parts[1];
        dates = parts[2];

        // Check if company contains location in parentheses
        const locationMatch = company.match(/\(([^)]+)\)/);
        if (locationMatch) {
          company = company.replace(/\s*\([^)]+\)/, ""); // Remove location from company
        }
      } else if (parts.length === 2) {
        // Could be Job Title | Company or Company | Dates
        if (parts[1].match(/\d{4}|Present|Current|Now/i)) {
          // Second part contains dates
          company = parts[0];
          dates = parts[1];
        } else {
          title = parts[0];
          company = parts[1];
        }
      }

      // Save for potential later use
      currentExperienceCompany = company;

      // Render the experience header
      elements.push(
        <View key={`exp-${i}`} style={styles.experienceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.experienceTitle}>{title}</Text>
            {company && <Text style={styles.experienceCompany}>{company}</Text>}
          </View>
          {dates && <Text style={styles.experienceDate}>{dates}</Text>}
        </View>
      );
    }
    // Check if line might be a location line (following an experience header)
    else if (
      currentExperienceCompany &&
      line.match(
        /^[A-Z][a-zA-Z]+,\s*[A-Z]{2}$|^[A-Z][a-zA-Z]+,\s*[A-Z][a-zA-Z\s]+$/
      )
    ) {
      elements.push(
        <Text key={`loc-${i}`} style={styles.location}>
          {line}
        </Text>
      );
    }
    // Regular text line
    else {
      // If we were in a bullet list, finish it
      if (inBulletList && bulletItems.length > 0) {
        elements.push(renderBulletList(bulletItems, `bl-${i}`));
        bulletItems = [];
        inBulletList = false;
      }

      // Add to current paragraph
      currentParagraph += (currentParagraph ? " " : "") + line;
    }
  }

  // Add any remaining content
  if (currentParagraph) {
    elements.push(
      <Text key="final-p" style={styles.paragraph}>
        {currentParagraph}
      </Text>
    );
  }

  // Add any remaining bullet items
  if (inBulletList && bulletItems.length > 0) {
    elements.push(renderBulletList(bulletItems, "final-bl"));
  }

  return <View style={styles.sectionContent}>{elements}</View>;
};

/**
 * Helper to render a list of bullet points
 */
const renderBulletList = (items: string[], key: string) => (
  <View key={key} style={styles.bulletList}>
    {items.map((item, i) => (
      <View key={`${key}-${i}`} style={styles.bulletItem}>
        <Text style={styles.bulletPoint}>•</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

export default ResumeTemplate;
