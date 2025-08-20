import I18nKeys from "./src/locales/keys";
import type { Configuration } from "./src/types/config";

const YukinaConfig: Configuration = {
  title: "Raviyelna's Blog",
  subTitle: "Our journey may have been meaningless. Our past may have been a mistake. But we're not going back.",
  brandTitle: "Ravi",

  description: "This is my profile page, where I share my works and notes. I hope you find something interesting here.",

  site: "https://raviyelna.github.io",

  locale: "en", // set for website language and date format

  navigators: [
    {
      nameKey: I18nKeys.nav_bar_home,
      href: "/",
    },
    {
      nameKey: I18nKeys.nav_bar_archive,
      href: "/archive",
    },
    {
      nameKey: I18nKeys.nav_bar_about,
      href: "/about",
    },
    {
      nameKey: I18nKeys.nav_bar_github,
      href: "https://github.com/raviyelna",
    },
  ],

  username: "Raviyelna",
  sign: "Simple guy who in fond of white/silver hair girl also DFIR and RE",
  avatarUrl: "https://avatars.githubusercontent.com/u/148680564?v=4",
  socialLinks: [
    {
      icon: "mingcute:github-line",
      link: "https://github.com/raviyelna",
    },
    {
      icon: "mingcute:facebook-line",
      link: "https://www.facebook.com/Kann.Raviel",
    },
    {
      icon: "mingcute:social-x-line",
      link: "https://x.com/Kawn28",
    },
    {
      icon:"mingcute:linkedin-line",
      link:"https://www.linkedin.com/in/le-nhut-quoc-khang-838316353",
    },
  ],
  maxSidebarCategoryChip: 6, // It is recommended to set it to a common multiple of 2 and 3
  maxSidebarTagChip: 12,
  maxFooterCategoryChip: 6,
  maxFooterTagChip: 24,

  banners: [
    
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/carlotta2.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/carlotta3.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/carlotta4.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/carlotta6.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/carlotta5.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/idk1.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/idk2.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/sakuya1.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/sakuya2.png",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/smash_head.gif",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/working.gif",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/sleep.gif",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/OT.gif",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/irys1.png",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/irys2.jpeg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/irys3.jpeg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/irys4.jfif",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/irys5.jpg",
    "https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/refs/heads/main/banner/irys6.jpg",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/gacha_animation_zani.gif",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/zani.png",
    "https://raw.githubusercontent.com/raviyelna/Journey-into-the-Fundamental-of-Malware-Analysing/refs/heads/main/Asset/Zani_gif/zani_trans.gif"
  
  ],

  slugMode: "HASH", // 'RAW' | 'HASH'

  license: {
    name: "CC BY-NC-SA 4.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },

  // WIP functions
  bannerStyle: "LOOP", // 'loop' | 'static' | 'hidden'
};

export default YukinaConfig;
