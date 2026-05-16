export interface StorySection {
  heading: string;
  body: string;
  image?: string;
}

export interface StoryHighlight {
  title: string;
  text: string;
}

export interface StoryItem {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  description: string;
  heroImage: string;
  publishDate: string;
  author: string;
  intro: string;
  sections: StorySection[];
  highlights: StoryHighlight[];
  relatedSlugs: string[];
}

const rawStories: Omit<StoryItem, "slug">[] = [
  {
    title: "The Dark Truth Behind Ancient Rome",
    category: "History",
    readTime: "5 min read",
    description:
      "The empire was powerful — but its hidden realities were far more brutal than most people realize.",
    heroImage:
      "https://images.unsplash.com/photo-1545167622-3d1c4b0f3f0a?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Elena Brooks",
    intro:
      "Beneath marble pillars and golden triumphs, Rome was a city of stark contrasts. This story peels back the pageantry to reveal the human cost behind one of history’s greatest civilizations.",
    sections: [
      {
        heading: "Origins",
        body:
          "Rome began as a cluster of villages on the Tiber river, but fast became one of the largest power centers the world had ever seen. Its early success hinged on ruthless ambition, clever diplomacy, and a willingness to bend the rules of war.",
        image:
          "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "Hidden Truths",
        body:
          "Behind triumphant parades were streets filled with slaves, political violence, and public spectacles designed to distract the masses. Many of the stories we still celebrate came at a surprising human price.",
      },
      {
        heading: "Surprising Facts",
        body:
          "Romans used concrete formulas that modern engineers only recently rediscovered, and their sanitation systems were far more advanced than many medieval cities. Yet for all their innovation, the empire could not solve the problem of power concentration.",
        image:
          "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "Historical Impact",
        body:
          "The rise and fall of Rome shaped laws, languages, architecture, and storytelling across continents. Its most enduring legacy may be the way it teaches us to study the past with both admiration and clear-eyed skepticism.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "Ancient Rome once had over 1 million inhabitants — larger than any city in the world at that time.",
      },
    ],
    relatedSlugs: [
      "why-japan-has-vending-machines-everywhere",
      "why-empires-collapse",
      "lost-cities-of-history",
    ],
  },
  {
    title: "Why Japan Has Vending Machines Everywhere",
    category: "Culture",
    readTime: "4 min read",
    description:
      "A simple machine became part of an entire nation’s lifestyle.",
    heroImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Sora Tanaka",
    intro:
      "In Japan, vending machines are more than convenience — they are a cultural phenomenon that reflects trust, design, and a desire for small everyday delight.",
    sections: [
      {
        heading: "The Quiet Revolution",
        body:
          "Vending machines first arrived in the 1960s, and Japan embraced them with a uniquely local twist: careful curation, quality products, and neighborhood placement that feels almost personal.",
      },
      {
        heading: "Design and Trust",
        body:
          "From green tea to umbrellas, Japan’s machines offer surprising variety. Their constant availability depends on social order: clean streets, respect for property, and an unwritten agreement that people look after one another.",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "What It Means Today",
        body:
          "These machines are a sign of how small conveniences can become cultural icons. They tell a story about modern Japan’s balance of technology, hospitality, and everyday wonder.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "Japan has over 5 million vending machines, the highest density of any country in the world.",
      },
    ],
    relatedSlugs: [
      "countries-that-technically-dont-exist",
      "psychology-of-urban-legends",
      "lost-cities-of-history",
    ],
  },
  {
    title: "Countries That Technically Don’t Exist",
    category: "Countries",
    readTime: "6 min read",
    description:
      "Some places have flags, governments, and people — but are still not officially recognized.",
    heroImage:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Mila Jackson",
    intro:
      "The world map is larger than the treaties that define it. These unrecognized states exist in a strange borderland between identity, politics, and global acknowledgement.",
    sections: [
      {
        heading: "What Makes a Country?",
        body:
          "Recognition often comes down to history, diplomacy, and the decisions of other nations. Some regions have all the trappings of statehood but remain unseen by major powers.",
      },
      {
        heading: "Everyday Reality",
        body:
          "These places function with elections, currencies, and schools. Yet their citizens often face travel restrictions, legal ambiguity, and the constant challenge of being ignored on the world stage.",
        image:
          "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "Why It Matters",
        body:
          "Understanding these regions reveals how fragile political borders can be. It also shows how identity and belonging often outrun the lines drawn on paper.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "One unrecognized territory publishes its own coins, but they are not accepted outside its controlled region.",
      },
    ],
    relatedSlugs: [
      "why-japan-has-vending-machines-everywhere",
      "lost-cities-of-history",
      "why-space-tourism-feels-like-a-dream",
    ],
  },
  {
    title: "Psychology of Urban Legends",
    category: "Psychology",
    readTime: "5 min read",
    description:
      "Why we believe unbelievable stories, and what that reveals about the human mind.",
    heroImage:
      "https://images.unsplash.com/photo-1520697222864-4b7123f8e9a4?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Noah Reed",
    intro:
      "Urban legends spread because they tap into fear, hope, and the parts of our brain that crave meaning. They are modern myths with a psychological pulse.",
    sections: [
      {
        heading: "The Anatomy of a Story",
        body:
          "An urban legend usually starts with one unforgettable detail, a warning, or a promise. That hook is what makes it easy to remember and hard to forget.",
      },
      {
        heading: "Why We Share Them",
        body:
          "People pass on legends because they feel useful or entertaining. The stories often reassure us that danger can be predicted, even when it cannot.",
        image:
          "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "Learning From Legends",
        body:
          "Examining these tales helps us understand how facts and fiction blend. It also reveals how culture, memory, and emotion shape the way communities talk about risk.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "Urban legends often become more dramatic each time they are retold — a phenomenon psychologists call narrative exaggeration.",
      },
    ],
    relatedSlugs: [
      "why-japan-has-vending-machines-everywhere",
      "why-empires-collapse",
      "lost-cities-of-history",
    ],
  },
  {
    title: "The Hidden Science Behind Ocean Currents",
    category: "Science",
    readTime: "5 min read",
    description:
      "How invisible rivers in the ocean shape climate, culture, and the future of travel.",
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Aisha Patel",
    intro:
      "Ocean currents are the planet’s quiet highways. They carry heat, nutrients, and stories across the globe, profoundly shaping life above and below the waterline.",
    sections: [
      {
        heading: "A Planetary Engine",
        body:
          "Currents are powered by wind, temperature, and salinity. They circulate warm water toward the poles and cold water back toward the equator, balancing Earth’s climate.",
      },
      {
        heading: "Hidden Connections",
        body:
          "The Gulf Stream warms Europe, while deep currents feed marine life. When these systems slow or shift, weather patterns and ecosystems can change in dramatic ways.",
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "Why It Matters",
        body:
          "Studying currents gives us insight into climate risks and ocean health. It also reminds us that much of the planet’s movement happens far from human sight.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "Some ocean currents move faster than the world’s fastest ships, carrying water around the globe in a few years.",
      },
    ],
    relatedSlugs: [
      "why-space-tourism-feels-like-a-dream",
      "countries-that-technically-dont-exist",
      "lost-cities-of-history",
    ],
  },
  {
    title: "Why Space Tourism Feels Like a Dream",
    category: "Space",
    readTime: "6 min read",
    description:
      "The future of civilian space travel is closer than it seems — but the experience is as much cultural as it is technological.",
    heroImage:
      "https://images.unsplash.com/photo-1533001051565-12ce4ae6a77a?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Luna Hart",
    intro:
      "Voyages to space are no longer just for astronauts. This story explores why the idea of space tourism captures our imagination more than the rocket science itself.",
    sections: [
      {
        heading: "From Fantasy to Reservation",
        body:
          "The first commercial flights aim to make space feel accessible, but the industry is still defining what it means to travel beyond Earth.",
      },
      {
        heading: "The Experience",
        body:
          "Passengers describe weightlessness, curved horizons, and a deep silence that changes how they see the planet. That shift is often as powerful as the engineering behind it.",
        image:
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "What Comes Next",
        body:
          "As companies scale up, space tourism will raise new questions about sustainability, equity, and the meaning of exploration.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "Some space tourism companies are studying how to make flights more like luxury journeys rather than scientific missions.",
      },
    ],
    relatedSlugs: [
      "why-japan-has-vending-machines-everywhere",
      "why-empires-collapse",
      "lost-cities-of-history",
    ],
  },
  {
    title: "Lost Cities of History",
    category: "Mysteries",
    readTime: "5 min read",
    description:
      "Ruins buried beneath sand and jungle still whisper the stories of vanished civilizations.",
    heroImage:
      "https://images.unsplash.com/photo-1522706604298-7adfdd32d4d3?auto=format&fit=crop&w=1600&q=80",
    publishDate: "May 2026",
    author: "Ravi Singh",
    intro:
      "Some cities disappear from maps, but they remain alive in memory, archaeology, and the faint lines that hint at their former glory.",
    sections: [
      {
        heading: "Buried and Forgotten",
        body:
          "Natural forces and human choices can erase a city from sight. Yet each discovery tells us how people lived, traded, and shaped their landscapes.",
      },
      {
        heading: "What Archaeology Reveals",
        body:
          "Modern researchers use satellite imagery, ground-penetrating radar, and ancient texts to piece together vanished urban worlds.",
        image:
          "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
      },
      {
        heading: "The Allure of Mystery",
        body:
          "Lost cities feel like time capsules. They invite us to imagine the people who built them, while reminding us that history is always being rewritten.",
      },
    ],
    highlights: [
      {
        title: "Did You Know?",
        text: "Archaeologists sometimes find entire buildings preserved under ashes, sand, or volcanic debris for centuries.",
      },
    ],
    relatedSlugs: [
      "countries-that-technically-dont-exist",
      "why-empires-collapse",
      "why-space-tourism-feels-like-a-dream",
    ],
  },
];

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const stories: StoryItem[] = rawStories.map((item) => ({
  ...item,
  slug: slugify(item.title),
}));

export const categories = [
  "All",
  "History",
  "Science",
  "Countries",
  "Psychology",
  "Mysteries",
  "Culture",
  "Space",
];

export const getStoryBySlug = (slug: string) =>
  stories.find((story) => story.slug === slug);

export const getRelatedStories = (story: StoryItem) =>
  stories.filter((item) => story.relatedSlugs.includes(item.slug));
