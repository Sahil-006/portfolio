// ─────────────────────────────────────────────────────────────
// Everything about you lives here. Edit this file to update the site.
// Leave a field as "" to hide it.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: "Sahil Shaikh",
  initials: "SS",
  title: "AI Engineer",
  tagline: "I build models people can trust, and the backends that ship them.",
  location: "Petlad, Gujarat, India",
  // Short line shown next to the green dot in the hero. "" to hide.
  status: "Open to AI/ML and backend roles",
  url: "https://example.com", // ← change to your domain after deploying

  // Put a square photo at public/me.jpg and set this to "/me.jpg". "" shows your initials.
  photo: "",

  about: [
    "I'm a final-year Computer Engineering student at MBIT who cares as much about whether a model can be trusted as how accurate it looks.",
    "Most of my work sits where ML meets real systems: a cardiac-arrest early-warning model validated patient by patient, an intrusion detector I rebuilt after catching my own data leakage, and the Flask APIs that put models like these in front of users.",
    "I like owning the whole path from data to deployed endpoint, and I pick up new tools quickly when a problem needs them.",
  ],

  links: {
    github: "https://github.com/Sahil-006",
    email: "sahil06052005@gmail.com",
    linkedin: "", // e.g. "https://www.linkedin.com/in/your-handle"
    x: "", // e.g. "https://x.com/your-handle"
  },

  resumes: [
    { label: "AI/ML resume", href: "/resume/Sahil_Shaikh_AI_ML_Resume.pdf" },
    { label: "Full-stack resume", href: "/resume/Sahil_Shaikh_Full_Stack_Resume.pdf" },
  ],

  // Your GitHub username, used for the contribution graph.
  githubUsername: "Sahil-006",

  // Song shown in the "On repeat" card. Leave title "" to hide the card.
  // url can be a Spotify or YouTube link; cover can be an image URL or a file in /public.
  onRepeat: {
    title: "",
    artist: "",
    url: "",
    cover: "",
  },

  stack: [
    {
      group: "Machine learning",
      items: ["PyTorch", "TensorFlow / Keras", "LightGBM", "scikit-learn", "Hugging Face", "FAISS", "Ollama"],
    },
    {
      group: "Backend",
      items: ["Flask", "FastAPI", "REST API design", "JWT", "OAuth 2.0", "MongoDB", "SQLite"],
    },
    {
      group: "Frontend and tools",
      items: ["Next.js", "React", "Tailwind CSS", "Git", "Raspberry Pi", "ESP32"],
    },
    {
      group: "Languages",
      items: ["Python", "C++", "Java", "JavaScript", "TypeScript"],
    },
  ],

  experience: [
    {
      role: "Software Development Intern",
      org: "Arizona Automation and Technologies",
      period: "May 2026 – Jun 2026",
      points: [
        "Built and extended Flask + MongoDB REST endpoints for the Smart Agro-Solar platform, which serves ML models for leaf-disease detection and crop analytics.",
        "Worked with front-end and database teammates to integrate the APIs into the platform's web app.",
      ],
    },
  ],

  education: [
    {
      school: "Madhuben & Bhanubhai Patel Institute of Technology, CVM University",
      detail: "B.Tech in Computer Engineering, CGPA 7.5 / 10",
      period: "2023 – 2027",
    },
  ],
};

export type Site = typeof site;
