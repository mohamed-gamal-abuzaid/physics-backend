import { db } from './index.js';
import { reviews } from './models/reviews.js';

const FAKE_REVIEWS = [
  {
    name: 'Ahmed Mostafa',
    cohort: 'Cambridge A-Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Mr. Mohammed simplified electromagnetic induction and circular motion like no one else. I jumped from a C in mock exams to an A* in the June series! His notes are gold.',
  },
  {
    name: 'Mariam El-Shenawy',
    cohort: 'Edexcel IGCSE Physics 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The weekly problem-solving masterclasses completely changed how I think about physics. I ended up getting a 9 in Edexcel Physics with 98% raw score!',
  },
  {
    name: 'Dr. Tarek Fouad (Parent)',
    cohort: 'Class of 2024 Parent',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'As a university professor myself, I deeply appreciate Mr. Mohammed’s pedagogical clarity and rigorous intuition. Both of my sons achieved A* under his guidance.',
  },
  {
    name: 'Youssef El-Husseiny',
    cohort: 'Cambridge AS Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The past paper classified booklets and detailed worked solutions saved my life before the May/June exams. Best physics teacher in Egypt by far.',
  },
  {
    name: 'Salma Khaled',
    cohort: 'Oxford AQA A-Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Thermal physics and thermodynamics used to give me headaches until Mr. Mohammed broke them down step by step. His dedication during exam season is unmatched.',
  },
  {
    name: 'Ziad Nour',
    cohort: 'Cambridge IGCSE 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The interactive 1-on-1 sessions were incredibly productive. Every minute was focused on high-yield exam techniques and tackling tricky paper 4 questions.',
  },
  {
    name: 'Farida Abdel-Rahman',
    cohort: 'Edexcel International A2 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Scored an A* in A2 Physics! Mr. Mohammed always emphasized mathematical derivations and understanding formulas rather than blind memorization.',
  },
  {
    name: 'Hany Zaghloul (Parent)',
    cohort: 'IGCSE 2024 Parent',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The academy portal made tracking attendance, homework submissions, and lecture recordings seamless. Excellent mentorship and regular feedback.',
  },
  {
    name: 'Laila Mansour',
    cohort: 'Cambridge A-Level 2023',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'I got accepted into Imperial College London for Mechanical Engineering thanks to my A* in Physics. Mr. Mohammed made me fall in love with engineering mechanics.',
  },
  {
    name: 'Omar Sherif',
    cohort: 'Cambridge AS Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Wave theory, diffraction grating, and superposition were made crystal clear through animations and hands-on demonstrations. Highly recommended!',
  },
  {
    name: 'Nouran Badr',
    cohort: 'Edexcel IGCSE 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Mr. Mohammed has an extraordinary ability to make you confident in solving any unseen problem. Got an A* with full marks on Paper 1!',
  },
  {
    name: 'Karim Ezzat',
    cohort: 'Cambridge A2 Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The nuclear physics and quantum mechanics modules were taught with such depth and excitement. The mock exam marking sessions were eye-opening.',
  },
  {
    name: 'Dina Wagdy (Parent)',
    cohort: 'A-Level 2024 Parent',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Thank you Mr. Mohammed for your endless patience and encouragement with my daughter. Her confidence soared and she achieved her dream score of A*!',
  },
  {
    name: 'Hassan Al-Attar',
    cohort: 'Cambridge IGCSE 2023',
    rating: 4,
    status: 'APPROVED' as const,
    content: 'Great session pacing, challenging assignments, and great homework feedback. Improved my grades from a 5 to an 8 in just 3 months.',
  },
  {
    name: 'Malak Soliman',
    cohort: 'Oxford AQA AS 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The formula cheat sheets and classified question banks provided in the student portal are the most organized resources I have ever seen.',
  },
  {
    name: 'Mostafa Kamel',
    cohort: 'Cambridge A-Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Mr. Mohammed doesn’t just teach you how to pass the exam; he teaches you to think like a true physicist. Worth every single pound.',
  },
  {
    name: 'Rana Essam',
    cohort: 'Edexcel A-Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Gravitational and electric fields used to confuse me constantly. One 1-to-1 session with Mr. Mohammed cleared everything up completely.',
  },
  {
    name: 'Dr. Mona Radwan (Parent)',
    cohort: 'Class of 2025 Parent',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Very professional platform and teacher. Mr. Mohammed is punctual, caring, and keeps parents informed about every progress milestone.',
  },
  {
    name: 'Seif El-Din Tamer',
    cohort: 'Cambridge IGCSE 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Never felt overwhelmed even during crunch time before the exams. The revision marathons and live Q&A roundups gave us the winning edge.',
  },
  {
    name: 'Jana Hatem',
    cohort: 'Cambridge AS Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Physics went from being my most stressful subject to my absolute favorite. Achieved Top in School award for Physics AS Level!',
  },
  {
    name: 'Ibrahim Sabry',
    cohort: 'Edexcel International A2 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Oscillations, simple harmonic motion, and astrophysics were explained brilliantly. The session recordings were invaluable for revision.',
  },
  {
    name: 'Heba Al-Qadi (Parent)',
    cohort: 'IGCSE Parent 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'I saw my son transform from avoiding physics homework to staying up late solving classified papers with enthusiasm. Thank you Mr. Mohammed!',
  },
  {
    name: 'Nabil Gohar',
    cohort: 'Cambridge IGCSE 2024',
    rating: 4,
    status: 'APPROVED' as const,
    content: 'Very thorough explanations and lots of past papers practice. Mr. Mohammed makes sure no student is left behind during group sessions.',
  },
  {
    name: 'Amina Shalaby',
    cohort: 'Cambridge A-Level 2023',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Secured an A* in Cambridge 9702 Physics and got accepted into TU Munich. The conceptual foundations built here are still helping me in university!',
  },
  {
    name: 'Tarek Mehanna',
    cohort: 'Oxford AQA A2 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Practical physics paper 5 skills and experimental design were covered with surgical precision. Full marks on the planning question!',
  },
  {
    name: 'Yara Bassiouny',
    cohort: 'Edexcel IGCSE 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'The small group masterclasses are interactive, engaging, and packed with insights. Achieved Grade 9 with flying colors.',
  },
  {
    name: 'Sherif El-Naggar (Parent)',
    cohort: 'A-Level 2024 Parent',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'High-quality education and impeccable character. Mr. Mohammed is a true mentor who instills discipline and love for science in his students.',
  },
  {
    name: 'Rami Kassem',
    cohort: 'Cambridge AS Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Electricity, circuits, and internal resistance questions used to be tricky, but Mr. Mohammed’s systematic analysis makes them super intuitive.',
  },
  {
    name: 'Nour El-Deen',
    cohort: 'Cambridge IGCSE 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'Fast responses on WhatsApp and always ready to help with difficult questions outside of class hours. Fantastic teacher!',
  },
  {
    name: 'Hoda Metwally',
    cohort: 'Edexcel A-Level 2024',
    rating: 5,
    status: 'APPROVED' as const,
    content: 'From day one, the structure of the curriculum and the quality of homework reviews set this academy apart. Scored an A* with distinction!',
  },
];

async function seed() {
  console.log(`Inserting ${FAKE_REVIEWS.length} approved reviews...`);
  for (const review of FAKE_REVIEWS) {
    await db.insert(reviews).values({
      name: review.name,
      cohort: review.cohort,
      content: review.content,
      rating: review.rating,
      status: review.status,
    });
  }
  console.log('Successfully inserted 30 fake reviews!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding reviews:', err);
  process.exit(1);
});
