import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from "@react-pdf/renderer";
import { ResumeJSON } from "../ai/simple-json-generation";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
      fontStyle: "italic",
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  section: {
    marginBottom: 10,
  },
  header: {
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
    textAlign: "center",
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    fontSize: 9,
    marginBottom: 5,
  },
  contactItem: {
    marginHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#888",
    color: "#444",
    textTransform: "uppercase",
  },
  summary: {
    marginBottom: 10,
    textAlign: "justify",
  },
  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skill: {
    marginRight: 5,
  },
  experienceItem: {
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  jobTitle: {
    fontWeight: "bold",
  },
  company: {
    fontWeight: "bold",
  },
  dates: {
    fontStyle: "italic",
  },
  location: {
    fontStyle: "italic",
    fontSize: 9,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 10,
  },
  bulletContent: {
    flex: 1,
  },
  educationItem: {
    marginBottom: 5,
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  degree: {
    fontWeight: "bold",
  },
  institution: {
    fontWeight: "bold",
  },
  graduationDate: {
    fontStyle: "italic",
  },
  educationDetails: {
    fontStyle: "italic",
    fontSize: 9,
  },
  certificationItem: {
    marginBottom: 5,
  },
  certificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  certificationName: {
    fontWeight: "bold",
  },
  certificationIssuer: {
    fontStyle: "italic",
  },
  certificationDate: {
    fontStyle: "italic",
  },
  link: {
    color: "#0000EE",
    textDecoration: "none",
  },
});

interface JSONResumeTemplateProps {
  resume: ResumeJSON;
}

const JSONResumeTemplate: React.FC<JSONResumeTemplateProps> = ({ resume }) => {
  // Helper function to format links with proper protocol
  const formatLink = (link: string) => {
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      return `https://${link}`;
    }
    return link;
  };

  // Helper function to extract domain from URL for display
  const displayLink = (link: string) => {
    try {
      const url = new URL(formatLink(link));
      return url.hostname.replace("www.", "");
    } catch {
      // Ignore error and return the original link
      return link;
    }
  };

  // Helper function to check if a string is an email
  const isEmail = (text: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>{resume.header.name}</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactItem}>
              {resume.header.contact.location}
            </Text>
            {resume.header.contact.phone && (
              <>
                <Text style={styles.contactItem}>|</Text>
                <Text style={styles.contactItem}>
                  {resume.header.contact.phone}
                </Text>
              </>
            )}
            <Text style={styles.contactItem}>|</Text>
            <Text style={styles.contactItem}>
              {isEmail(resume.header.contact.email) ? (
                <Link src={`mailto:${resume.header.contact.email}`}>
                  {resume.header.contact.email}
                </Link>
              ) : (
                resume.header.contact.email
              )}
            </Text>
            {resume.header.contact.links?.map((link, index) => (
              <React.Fragment key={index}>
                <Text style={styles.contactItem}>|</Text>
                <Link
                  src={formatLink(link)}
                  style={[styles.contactItem, styles.link]}
                >
                  {displayLink(link)}
                </Link>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summary}>{resume.summary}</Text>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skills}>
            {resume.skills.map((skill, index) => (
              <Text key={index} style={styles.skill}>
                {skill}
                {index < resume.skills.length - 1 ? ", " : ""}
              </Text>
            ))}
          </View>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          {resume.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>
                  {exp.title}, <Text style={styles.company}>{exp.company}</Text>
                </Text>
                <Text style={styles.dates}>
                  {exp.startDate} - {exp.endDate}
                </Text>
              </View>
              {exp.location && (
                <Text style={styles.location}>{exp.location}</Text>
              )}
              {exp.achievements.map((achievement, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletContent}>{achievement}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Projects Section (if available) */}
        {resume.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{project.name}</Text>
                  {project.startDate && project.endDate && (
                    <Text style={styles.dates}>
                      {project.startDate} - {project.endDate}
                    </Text>
                  )}
                </View>
                {project.description.map((desc, i) => (
                  <View key={i} style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletContent}>{desc}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {resume.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <View style={styles.educationHeader}>
                <Text style={styles.degree}>
                  {edu.degree} in {edu.field},{" "}
                  <Text style={styles.institution}>{edu.institution}</Text>
                </Text>
                <Text style={styles.graduationDate}>{edu.graduationDate}</Text>
              </View>
              {edu.location && (
                <Text style={styles.location}>{edu.location}</Text>
              )}
              {edu.details && edu.details.length > 0 && (
                <Text style={styles.educationDetails}>
                  {edu.details.join(", ")}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Certifications Section (if available) */}
        {resume.certifications && resume.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <View style={styles.certificationHeader}>
                  <Text style={styles.certificationName}>
                    {cert.name},{" "}
                    <Text style={styles.certificationIssuer}>
                      {cert.issuer}
                    </Text>
                  </Text>
                  <Text style={styles.certificationDate}>{cert.date}</Text>
                </View>
                {cert.details && (
                  <Text style={styles.educationDetails}>{cert.details}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default JSONResumeTemplate;
