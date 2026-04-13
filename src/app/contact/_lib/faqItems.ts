export const FAQ_ITEMS = [
  {
    question: "Why does my lineup show more than $15 in total value?",
    answer:
      "The $15 budget is only enforced when you first create a lineup. After that, the total value can increase through two things: gambling a player and receiving a higher-value replacement, or an admin updating a player's value over time. This is by design and part of the fun.",
  },
  {
    question: "How does the gamble mechanic work?",
    answer:
      "You can gamble any player in your lineup for a random replacement. The outcome is determined by weighted odds based on your current player's value. Lower-value players have a higher chance of upgrading (but it's risky), while higher-value players are safer to gamble. You get 3 gambles per lineup per day.",
  },
  {
    question: "What do the player dollar values mean?",
    answer:
      "$5 players are superstars, $4 are all-stars, $3 are quality starters, $2 are solid contributors, and $1 players are role players. The values are set by the team and may be adjusted over time based on real-world performance.",
  },
  {
    question: "Can I edit my lineup after creating it?",
    answer:
      "You can reorder player positions within your lineup at any time. To swap in different players, use the gamble feature. You cannot directly replace a player outside of gambling.",
  },
  {
    question: "How do ratings work?",
    answer:
      "Anyone can rate a lineup from 1 to 10. The lineup's displayed rating is the average of all ratings it has received. You cannot rate your own lineup.",
  },
  {
    question: "What are featured lineups?",
    answer:
      'You can mark up to 3 of your lineups as "featured" to showcase them at the top of your profile page.',
  },
  {
    question: "How do I request a player that's not in the database?",
    answer:
      'Use the "Request a Player" form on this page. Fill in the player\'s name, suggest a value, and optionally add a note. We review requests and add players periodically.',
  },
  {
    question: "Can I follow other users?",
    answer:
      'Yes! Visit any user\'s profile and click the follow button. You can find users through the "Find Users" search page. Your followers and following counts are displayed on your profile.',
  },
] as const;
