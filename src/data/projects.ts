export interface Project {
  name: string;
  url: string;
  description: string;
  language?: string;
  stars: number;
  forks: number;
  updatedAt: string;
  homepage?: string;
  fork: boolean;
  pinned: boolean;
}

export const projectSource = {
  profileUrl: "https://github.com/raviyelna",
  reposUrl: "https://api.github.com/users/raviyelna/repos?sort=updated&per_page=100",
  syncedAt: "2026-06-21",
};

export const projects: Project[] = [
  {
    name: "Journey-into-the-Fundamental-of-Malware-Analysing",
    url: "https://github.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing",
    description:
      "Reports, notes, and malware analysis material collected while learning DFIR and reverse engineering.",
    language: "Python",
    stars: 1,
    forks: 1,
    updatedAt: "2025-07-26T16:48:39Z",
    fork: false,
    pinned: true,
  },
  {
    name: "raviyelna.github.io",
    url: "https://github.com/raviyelna/raviyelna.github.io",
    description:
      "Personal Astro blog based on the Yukina theme, deployed through GitHub Pages.",
    language: "Astro",
    stars: 0,
    forks: 0,
    updatedAt: "2025-10-23T11:26:07Z",
    homepage: "https://raviyelna.github.io/",
    fork: true,
    pinned: true,
  },
  {
    name: "LibraNia",
    url: "https://github.com/raviyelna/LibraNia",
    description: "TypeScript project from the recent public GitHub activity feed.",
    language: "TypeScript",
    stars: 4,
    forks: 0,
    updatedAt: "2026-06-19T16:49:50Z",
    fork: false,
    pinned: false,
  },
  {
    name: "Self-Decide",
    url: "https://github.com/raviyelna/Self-Decide",
    description: "Python project from the recent public GitHub activity feed.",
    language: "Python",
    stars: 0,
    forks: 0,
    updatedAt: "2026-06-17T16:24:54Z",
    fork: false,
    pinned: false,
  },
  {
    name: "Reverse-and-Chill",
    url: "https://github.com/raviyelna/Reverse-and-Chill",
    description: "Reverse engineering and chill workspace from the public GitHub repos.",
    language: "PowerShell",
    stars: 1,
    forks: 1,
    updatedAt: "2026-06-08T22:18:57Z",
    fork: false,
    pinned: false,
  },
  {
    name: "Notepad--",
    url: "https://github.com/raviyelna/Notepad--",
    description: "Python script to delete Notepad++.",
    language: "Python",
    stars: 2,
    forks: 0,
    updatedAt: "2026-02-03T05:54:53Z",
    fork: false,
    pinned: false,
  },
  {
    name: "Group-Exercise---MobileDev2025",
    url: "https://github.com/raviyelna/Group-Exercise---MobileDev2025",
    description: "Group exercise for MobileDev2025.",
    language: "Java",
    stars: 0,
    forks: 0,
    updatedAt: "2026-01-06T19:14:33Z",
    fork: false,
    pinned: false,
  },
  {
    name: "Midterm",
    url: "https://github.com/raviyelna/Midterm",
    description: "Java midterm project from the public GitHub repos.",
    language: "Java",
    stars: 0,
    forks: 1,
    updatedAt: "2025-12-04T01:42:21Z",
    fork: false,
    pinned: false,
  },
  {
    name: "AndroidDEV",
    url: "https://github.com/raviyelna/AndroidDEV",
    description: "Android development project from the public GitHub repos.",
    language: "Kotlin",
    stars: 0,
    forks: 0,
    updatedAt: "2025-11-21T07:25:47Z",
    fork: false,
    pinned: false,
  },
  {
    name: "Payload",
    url: "https://github.com/raviyelna/Payload",
    description: "Python payload workspace from the public GitHub repos.",
    language: "Python",
    stars: 0,
    forks: 0,
    updatedAt: "2025-03-07T14:33:23Z",
    fork: false,
    pinned: false,
  },
];
