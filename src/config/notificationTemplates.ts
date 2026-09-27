/**
 * Manually Controlled Notification Library for NoteIT AI
 * Defines message templates, categories, prioritization, and delivery constraints.
 */

export interface NotificationTemplate {
  id: string;
  category: string;
  title: string;
  body: string;
  enabled: boolean;
  priority: 'normal' | 'high';
  route: string;
  fallbackTitle?: string;
  requiresCondition?: 'hasLearningKit' | 'hasLecturesToRevise';
}

export const SCHEDULER_CONFIG = {
  DEFAULT_MAX_NORMAL_NOTIFICATIONS_PER_DAY: 2,
  DEFAULT_MIN_NOTIFICATION_COOLDOWN_MINUTES: 240, // 4 hours
  DEFAULT_QUIET_HOURS_START: "22:30", // 10:30 PM
  DEFAULT_QUIET_HOURS_END: "08:00",   // 8:00 AM
  DEFAULT_VAPID_KEY: "BARE_bsVoSaQGCqY4n21B6zdYP5oA2hBdk3u8yez4g022jKL1HBjxtiQ1-aLh-Pwny2WYh7fWRSpm41L9fl6JAc"
};

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ==================================================
  // CATEGORY 1 â€” YOU MISSED SOMETHING (MISSED_SOMETHING)
  // ==================================================
  {
    id: "missed_01",
    category: "MISSED_SOMETHING",
    title: "we found something you missed ðŸ‘€",
    body: "want to know what?",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "missed_02",
    category: "MISSED_SOMETHING",
    title: "thereâ€™s a tiny detail in yesterdayâ€™s lectureâ€¦",
    body: "and it might actually matter.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "missed_03",
    category: "MISSED_SOMETHING",
    title: "your professor said something important.",
    body: "we saved it. did you?",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "missed_04",
    category: "MISSED_SOMETHING",
    title: "you remember that confusing part?",
    body: "yeahâ€¦ we found it. ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "missed_05",
    category: "MISSED_SOMETHING",
    title: "something in your lecture stood out.",
    body: "we're not spoiling it. ðŸ˜Œ",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "missed_06",
    category: "MISSED_SOMETHING",
    title: "we found the important bit.",
    body: "you should probably see it.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "missed_07",
    category: "MISSED_SOMETHING",
    title: "ðŸš¨ lecture investigation complete",
    body: "we found 3 things worth revising.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio",
    requiresCondition: "hasLecturesToRevise"
  },

  // ==================================================
  // CATEGORY 2 â€” DO YOU ACTUALLY REMEMBER? (MEMORY_CHECK)
  // ==================================================
  {
    id: "remember_01",
    category: "MEMORY_CHECK",
    title: "be honestâ€¦",
    body: "could you explain yesterday's lecture right now? ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "remember_02",
    category: "MEMORY_CHECK",
    title: "you understood it yesterday.",
    body: "let's see if your brain still agrees. ðŸ§ ",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "remember_03",
    category: "MEMORY_CHECK",
    title: "we have a question.",
    body: "and your memory is about to answer it. ðŸ’€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "remember_04",
    category: "MEMORY_CHECK",
    title: "your brain says â€˜easy.â€™",
    body: "okay. prove it.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "remember_05",
    category: "MEMORY_CHECK",
    title: "you said â€˜haan haan samajh gaya.â€™",
    body: "we made a quiz. ðŸ˜­",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "remember_06",
    category: "MEMORY_CHECK",
    title: "quick memory check?",
    body: "5 questions. zero professor judgement.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "remember_07",
    category: "MEMORY_CHECK",
    title: "don't worry, it's easy.",
    body: "(famous last words) ðŸ’€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },

  // ==================================================
  // CATEGORY 3 â€” FUTURE YOU (FUTURE_YOU)
  // ==================================================
  {
    id: "future_01",
    category: "FUTURE_YOU",
    title: "future you just sent a message.",
    body: "PLEASE revise this. ðŸ˜­",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "future_02",
    category: "FUTURE_YOU",
    title: "tomorrow's you has a problem.",
    body: "today's you can fix it.",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "future_03",
    category: "FUTURE_YOU",
    title: "future you is going to askâ€¦",
    body: "why didn't I revise this? ðŸ’€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "future_04",
    category: "FUTURE_YOU",
    title: "exam-you would like a word.",
    body: "apparently current-you has some explaining to do.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "future_05",
    category: "FUTURE_YOU",
    title: "you have two options:",
    body: "revise now or meet this topic again at 2 AM. ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "future_06",
    category: "FUTURE_YOU",
    title: "future-you is watching.",
    body: "make them proud. ðŸ«¡",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },


  // ==================================================
  // CATEGORY 5 â€” WE KNOW SOMETHING YOU DON'T (CURIOSITY)
  // ==================================================
  {
    id: "curiosity_01",
    category: "CURIOSITY",
    title: "we noticed something about your lecturesâ€¦",
    body: "you might want to see this. ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "curiosity_02",
    category: "CURIOSITY",
    title: "we checked your latest lecture.",
    body: "interesting. very interesting.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "curiosity_03",
    category: "CURIOSITY",
    title: "your lecture has a secret.",
    body: "okay, not literally. but open it. ðŸ˜­",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "curiosity_04",
    category: "CURIOSITY",
    title: "we found a pattern in your notes.",
    body: "want to see it?",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "curiosity_05",
    category: "CURIOSITY",
    title: "we have some information.",
    body: "you have 7 seconds to open this. ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "curiosity_06",
    category: "CURIOSITY",
    title: "we could tell youâ€¦",
    body: "but where's the fun in that?",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 6 â€” YOU'VE ALREADY DONE THE HARD PART (HARD_PART_DONE)
  // ==================================================
  {
    id: "hard_01",
    category: "HARD_PART_DONE",
    title: "you already attended the lecture.",
    body: "now let us do the boring part. ðŸ˜Œ",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "hard_02",
    category: "HARD_PART_DONE",
    title: "you listened for 50 minutes.",
    body: "give us 30 seconds.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "hard_03",
    category: "HARD_PART_DONE",
    title: "lecture = done âœ…",
    body: "revision = waiting ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "hard_04",
    category: "HARD_PART_DONE",
    title: "you did the hard part.",
    body: "your learning kit is ready.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio",
    requiresCondition: "hasLearningKit"
  },
  {
    id: "hard_05",
    category: "HARD_PART_DONE",
    title: "no notes to write.",
    body: "we already made them. ðŸ˜Œ",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "hard_06",
    category: "HARD_PART_DONE",
    title: "you don't need to remember everything.",
    body: "that's literally our job.",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 7 â€” PERSONAL CHALLENGE (PERSONAL_CHALLENGE)
  // ==================================================
  {
    id: "personal_01",
    category: "PERSONAL_CHALLENGE",
    title: "okay [name]â€¦",
    body: "let's see what you actually remember. ðŸ‘€",
    fallbackTitle: "okay scholarâ€¦",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "personal_02",
    category: "PERSONAL_CHALLENGE",
    title: "[name], we have a challenge.",
    body: "5 questions. that's all.",
    fallbackTitle: "hey scholar, we have a challenge.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "personal_03",
    category: "PERSONAL_CHALLENGE",
    title: "hey [name] ðŸ‘‹",
    body: "your brain has unfinished business.",
    fallbackTitle: "hey scholar ðŸ‘‹",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "personal_04",
    category: "PERSONAL_CHALLENGE",
    title: "[name] vs. yesterday's lecture.",
    body: "round 1 starts now. ðŸ¥Š",
    fallbackTitle: "you vs. yesterday's lecture.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },

  // ==================================================
  // CATEGORY 8 â€” FRIENDLY ROAST CATEGORY (FRIENDLY_ROAST)
  // ==================================================
  {
    id: "roast_01",
    category: "FRIENDLY_ROAST",
    title: "you opened Instagram.",
    body: "NoteIT saw that. ðŸ‘ï¸ðŸ‘„ðŸ‘ï¸",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "roast_02",
    category: "FRIENDLY_ROAST",
    title: "you remembered that meme from 2019.",
    body: "but not yesterday's lecture? ðŸ˜­",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "roast_03",
    category: "FRIENDLY_ROAST",
    title: "your screen time is impressive.",
    body: "your revision time could use some competition.",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "roast_04",
    category: "FRIENDLY_ROAST",
    title: "you said â€˜bas 5 min reels.â€™",
    body: "we've been waiting. ðŸ’€",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "roast_05",
    category: "FRIENDLY_ROAST",
    title: "your notes have been sitting hereâ€¦",
    body: "like an abandoned group project.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "roast_06",
    category: "FRIENDLY_ROAST",
    title: "attendance: secured âœ…",
    body: "knowledge: loadingâ€¦ ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "roast_07",
    category: "FRIENDLY_ROAST",
    title: "you survived the lecture.",
    body: "now survive the quiz. ðŸ«¡",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },

  // ==================================================
  {
    id: "fomo_04",
    category: "REAL_FOMO",
    title: "your latest learning kit is ready.",
    body: "your classmates are still making notes. ðŸ˜­",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio",
    requiresCondition: "hasLearningKit"
  },

  // ==================================================
  // CATEGORY 10 â€” OPEN-TO-COMPLETE-THE-STORY (COMPLETE_STORY)
  // ==================================================
  {
    id: "story_01",
    category: "COMPLETE_STORY",
    title: "we made 5 questions from today's lecture. ðŸ‘€",
    body: "let's see what you actually remember.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "story_02",
    category: "COMPLETE_STORY",
    title: "we know which part you probably forgot.",
    body: "prove us wrong. ðŸ§ ",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },

  // ==================================================
  // CATEGORY 11 â€” REVERSE PSYCHOLOGY (REVERSE_PSYCHOLOGY)
  // ==================================================
  {
    id: "reverse_01",
    category: "REVERSE_PSYCHOLOGY",
    title: "don't open this.",
    body: "unless you want to finally catch up on your backlog. 👀",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "reverse_02",
    category: "REVERSE_PSYCHOLOGY",
    title: "seriously, don't.",
    body: "your quiz is waiting anyway.",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "reverse_03",
    category: "REVERSE_PSYCHOLOGY",
    title: "you probably shouldn't check your lecture.",
    body: "we definitely didn't find anything interesting. ðŸ˜Œ",
    enabled: true,
    priority: "normal",
    route: "/knowledge-studio"
  },
  {
    id: "reverse_04",
    category: "REVERSE_PSYCHOLOGY",
    title: "ignore this notification.",
    body: "your academic comeback won't mind. ðŸ’€",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "reverse_05",
    category: "REVERSE_PSYCHOLOGY",
    title: "DO NOT OPEN.",
    body: "unless you're curious. ðŸ‘€",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  }
];

/**
 * Helper to personalize notification title or body with user's name
 */
export function personalizeText(text: string, userName?: string, fallbackTitle?: string): string {
  if (text.includes('[name]')) {
    if (userName && userName.trim()) {
      const firstName = userName.trim().split(' ')[0];
      return text.replace(/\[name\]/g, firstName);
    } else if (fallbackTitle) {
      return fallbackTitle;
    } else {
      return text.replace(/\[name\]/g, 'scholar');
    }
  }
  return text;
}
