import { db } from "@workspace/db";
import {
  workoutsTable,
  mealsTable,
  articlesTable,
  profileTable,
} from "@workspace/db/schema";

async function seed() {
  console.log("Seeding database...");

  // Seed profile
  const existingProfiles = await db.select().from(profileTable).limit(1);
  if (existingProfiles.length === 0) {
    await db.insert(profileTable).values({
      name: "Alex Johnson",
      email: "alex@fittrack.com",
      age: 28,
      weight: 75.5,
      height: 178,
      goal: "muscle-gain",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      points: 350,
      level: 1,
      joinedAt: new Date("2024-01-15").toISOString(),
    });
    console.log("Profile seeded");
  }

  // Seed workouts
  const existingWorkouts = await db.select().from(workoutsTable).limit(1);
  if (existingWorkouts.length === 0) {
    await db.insert(workoutsTable).values([
      {
        title: "Full Body Strength",
        description: "A comprehensive strength training session targeting all major muscle groups for balanced development.",
        category: "strength",
        difficulty: "intermediate",
        duration: 45,
        calories: 380,
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "Warm up with 5 minutes light cardio",
          "3x10 Barbell Squats at 70% max",
          "3x8 Bench Press",
          "3x10 Bent Over Rows",
          "3x12 Overhead Press",
          "3x15 Dumbbell Lunges",
          "Cool down with stretching",
        ]),
        completed: false,
      },
      {
        title: "HIIT Cardio Blast",
        description: "High-intensity interval training to torch calories and boost cardiovascular endurance in record time.",
        category: "cardio",
        difficulty: "advanced",
        duration: 30,
        calories: 450,
        imageUrl: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "2 min warm-up jog",
          "30s sprint / 30s walk x10",
          "20 Burpees",
          "Mountain Climbers 1 min",
          "Jump Squats 3x15",
          "High Knees 1 min",
          "1 min cool-down walk",
        ]),
        completed: false,
      },
      {
        title: "Morning Yoga Flow",
        description: "Start your day with this energizing yoga sequence designed to improve flexibility, balance, and mental clarity.",
        category: "yoga",
        difficulty: "beginner",
        duration: 25,
        calories: 120,
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "Child's Pose - 1 minute",
          "Cat-Cow Stretch - 10 reps",
          "Downward Dog - 30 seconds",
          "Sun Salutation x3",
          "Warrior I & II each side",
          "Tree Pose - 30s each side",
          "Savasana - 2 minutes",
        ]),
        completed: false,
      },
      {
        title: "Home Bodyweight Circuit",
        description: "No equipment needed! This bodyweight circuit builds strength and endurance using just your body and a small space.",
        category: "home",
        difficulty: "beginner",
        duration: 35,
        calories: 280,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "5 min dynamic warm-up",
          "Push-ups 3x12",
          "Bodyweight Squats 3x20",
          "Plank Hold 3x30s",
          "Tricep Dips (chair) 3x10",
          "Glute Bridges 3x15",
          "Flutter Kicks 3x30s",
          "Cool down stretch",
        ]),
        completed: false,
      },
      {
        title: "Upper Body Power",
        description: "Build impressive upper body strength with this focused session targeting chest, back, shoulders, and arms.",
        category: "strength",
        difficulty: "advanced",
        duration: 50,
        calories: 420,
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "Pull-ups 4x6",
          "Dips 4x8",
          "Incline Dumbbell Press 3x10",
          "Cable Rows 3x12",
          "Face Pulls 3x15",
          "Bicep Curls 3x12",
          "Tricep Pushdowns 3x12",
        ]),
        completed: false,
      },
      {
        title: "Steady State Run",
        description: "A moderate-paced endurance run to build your aerobic base and improve cardiovascular efficiency.",
        category: "cardio",
        difficulty: "intermediate",
        duration: 40,
        calories: 350,
        imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "5 min walk warm-up",
          "Run at 65-70% max heart rate for 30 min",
          "Maintain conversational pace",
          "5 min cool-down walk",
          "Post-run stretching",
        ]),
        completed: false,
      },
      {
        title: "Power Yoga",
        description: "A challenging yoga flow that builds strength, flexibility, and core stability through dynamic movements.",
        category: "yoga",
        difficulty: "intermediate",
        duration: 45,
        calories: 200,
        imageUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "Breathing exercises 3 min",
          "Sun Salutation A x5",
          "Sun Salutation B x3",
          "Standing poses sequence",
          "Balance poses",
          "Core strengthening poses",
          "Restorative finish",
        ]),
        completed: false,
      },
      {
        title: "Apartment HIIT",
        description: "A neighbor-friendly, no-jump HIIT workout perfect for small spaces. Maximum burn, minimum noise.",
        category: "home",
        difficulty: "intermediate",
        duration: 25,
        calories: 300,
        imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop",
        steps: JSON.stringify([
          "Marching in place 2 min",
          "Squat Pulses 45s / rest 15s x3",
          "Push-up to plank rotation x3",
          "Standing Oblique Crunches x3",
          "Reverse Lunges x3",
          "Wall Sit 45s x3",
          "Cool-down stretches",
        ]),
        completed: false,
      },
    ]);
    console.log("Workouts seeded");
  }

  // Seed meals
  const existingMeals = await db.select().from(mealsTable).limit(1);
  if (existingMeals.length === 0) {
    await db.insert(mealsTable).values([
      {
        title: "Protein Power Bowl",
        description: "High-protein quinoa bowl with grilled chicken, roasted veggies, and tahini dressing. Perfect post-workout fuel.",
        goal: "muscle-gain",
        calories: 650,
        protein: 52,
        carbs: 58,
        fat: 18,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["150g grilled chicken breast", "1 cup cooked quinoa", "1 cup roasted broccoli", "1 cup cherry tomatoes", "2 tbsp tahini", "1 lemon", "Salt & pepper", "Olive oil"]),
        mealType: "lunch",
      },
      {
        title: "Green Detox Smoothie",
        description: "Nutrient-dense green smoothie packed with vitamins, minerals, and fiber to kickstart your morning.",
        goal: "weight-loss",
        calories: 180,
        protein: 8,
        carbs: 32,
        fat: 4,
        imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["2 cups spinach", "1 banana", "1 cup almond milk", "1 tbsp chia seeds", "1 scoop protein powder", "Ice cubes"]),
        mealType: "breakfast",
      },
      {
        title: "Overnight Oats",
        description: "Simple, customizable overnight oats that are ready when you wake up. Great balance of carbs and protein.",
        goal: "maintenance",
        calories: 420,
        protein: 18,
        carbs: 65,
        fat: 10,
        imageUrl: "https://images.unsplash.com/photo-1484723091739-30990ceecb29?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["1 cup rolled oats", "1 cup Greek yogurt", "1 cup oat milk", "2 tbsp honey", "Mixed berries", "1 tbsp almond butter", "Chia seeds"]),
        mealType: "breakfast",
      },
      {
        title: "Grilled Salmon & Asparagus",
        description: "Omega-3 rich salmon with perfectly grilled asparagus. Clean eating at its finest for muscle recovery.",
        goal: "muscle-gain",
        calories: 520,
        protein: 48,
        carbs: 12,
        fat: 28,
        imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["200g salmon fillet", "1 bunch asparagus", "2 cloves garlic", "1 lemon", "2 tbsp olive oil", "Fresh dill", "Salt & pepper"]),
        mealType: "dinner",
      },
      {
        title: "Mediterranean Salad",
        description: "Fresh and light Mediterranean salad with feta, olives, and a zesty herb dressing. Low calorie, high satisfaction.",
        goal: "weight-loss",
        calories: 280,
        protein: 12,
        carbs: 22,
        fat: 16,
        imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["Mixed greens", "Cherry tomatoes", "Cucumber", "Kalamata olives", "Feta cheese 50g", "Red onion", "Lemon dressing", "Fresh herbs"]),
        mealType: "lunch",
      },
      {
        title: "Egg & Avocado Toast",
        description: "Classic, nutrient-packed breakfast with poached eggs on sourdough with creamy avocado.",
        goal: "maintenance",
        calories: 380,
        protein: 20,
        carbs: 35,
        fat: 18,
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["2 slices sourdough bread", "1 ripe avocado", "2 eggs", "Cherry tomatoes", "Red pepper flakes", "Sea salt", "Lemon juice"]),
        mealType: "breakfast",
      },
      {
        title: "Turkey Meatball Zoodles",
        description: "Guilt-free pasta alternative with zucchini noodles and lean turkey meatballs in a rich marinara.",
        goal: "weight-loss",
        calories: 340,
        protein: 35,
        carbs: 20,
        fat: 12,
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["300g ground turkey", "3 zucchini (spiralized)", "1 cup marinara sauce", "1 egg", "Breadcrumbs 2 tbsp", "Garlic", "Italian seasoning", "Parmesan"]),
        mealType: "dinner",
      },
      {
        title: "Greek Yogurt Parfait",
        description: "Protein-rich snack layered with crunchy granola and fresh berries. Great for mid-day energy.",
        goal: "muscle-gain",
        calories: 290,
        protein: 22,
        carbs: 35,
        fat: 6,
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop",
        ingredients: JSON.stringify(["200g Greek yogurt (0% fat)", "1/4 cup granola", "Mixed berries", "1 tsp honey", "Almonds"]),
        mealType: "snack",
      },
    ]);
    console.log("Meals seeded");
  }

  // Seed articles
  const existingArticles = await db.select().from(articlesTable).limit(1);
  if (existingArticles.length === 0) {
    await db.insert(articlesTable).values([
      {
        title: "The Science Behind Muscle Growth: What You Need to Know",
        excerpt: "Understanding hypertrophy is key to designing an effective training program. We break down the science so you can train smarter.",
        content: "Muscle hypertrophy occurs when muscle fibers sustain damage and repair through protein synthesis. The key mechanisms involve mechanical tension, metabolic stress, and muscle damage. To optimize muscle growth, you need progressive overload — consistently increasing the challenge on your muscles over time. Aim for 6-12 reps in the hypertrophy range, get adequate protein (1.6-2.2g per kg of bodyweight), and prioritize sleep as growth hormone is primarily released during deep sleep. Recovery is just as important as the workout itself — muscles don't grow in the gym, they grow when you rest.",
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop",
        author: "Dr. Sarah Mitchell",
        publishedAt: new Date("2024-02-15").toISOString(),
        tags: JSON.stringify(["strength", "muscle", "science", "training"]),
        favorited: false,
      },
      {
        title: "10 Best Foods for Post-Workout Recovery",
        excerpt: "What you eat after a workout is just as important as the workout itself. Discover the top foods to accelerate your recovery.",
        content: "The post-workout nutrition window is crucial for recovery. Your body needs carbohydrates to replenish glycogen stores and protein to repair muscle fibers. Top foods include: chocolate milk (perfect ratio of carbs to protein), Greek yogurt with berries, eggs on whole grain toast, salmon with sweet potato, and a banana with almond butter. Aim to eat within 30-60 minutes of finishing your workout. Hydration is equally important — for every hour of exercise, drink an extra 500-750ml of water. Anti-inflammatory foods like tart cherry juice and turmeric can also speed up recovery time.",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=500&fit=crop",
        author: "Emma Rodriguez, RD",
        publishedAt: new Date("2024-02-20").toISOString(),
        tags: JSON.stringify(["nutrition", "recovery", "food", "health"]),
        favorited: false,
      },
      {
        title: "HIIT vs. Steady State Cardio: Which Burns More Fat?",
        excerpt: "The age-old debate settled with science. We compare these two popular cardio methods to help you choose the right approach.",
        content: "Both HIIT and steady-state cardio have their place in a well-rounded fitness program, but they work differently. HIIT (High-Intensity Interval Training) burns more calories in less time and creates an 'afterburn effect' (EPOC) where you continue burning calories for hours post-workout. Steady-state cardio is easier to recover from, great for building aerobic base, and sustainable for longer durations. For fat loss, HIIT has a slight edge. For endurance athletes, steady-state is essential. The best approach? Combine both — do 2-3 HIIT sessions and 1-2 steady-state sessions per week for optimal results.",
        imageUrl: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&h=500&fit=crop",
        author: "Coach Marcus Williams",
        publishedAt: new Date("2024-03-01").toISOString(),
        tags: JSON.stringify(["cardio", "fat loss", "HIIT", "training"]),
        favorited: false,
      },
      {
        title: "The Beginner's Complete Guide to Yoga",
        excerpt: "Never done yoga before? This comprehensive guide will help you start your yoga journey with confidence and safety.",
        content: "Yoga is more than just flexibility — it builds strength, improves balance, reduces stress, and enhances body awareness. As a beginner, start with Hatha or Yin yoga classes, which are slower-paced. Focus on breathing: inhale through the nose, exhale fully. Don't compare yourself to others — every body is different. Essential beginner poses include Child's Pose, Cat-Cow, Downward Dog, Warrior I & II, and Tree Pose. Practice on an empty stomach for best results. Aim for 2-3 sessions per week initially. The most important thing is consistency over intensity — even 20 minutes daily will create dramatic improvements in just a few weeks.",
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop",
        author: "Priya Sharma, E-RYT",
        publishedAt: new Date("2024-03-08").toISOString(),
        tags: JSON.stringify(["yoga", "beginner", "flexibility", "mindfulness"]),
        favorited: false,
      },
      {
        title: "How to Build a Home Gym on Any Budget",
        excerpt: "You don't need an expensive gym membership to get fit. Here's how to build an effective home gym from $50 to $500.",
        content: "A home gym can be as simple or as elaborate as you want. Under $50: resistance bands (full body workout), a jump rope, and a yoga mat. Under $150: add adjustable dumbbells and a pull-up bar. Under $300: a kettlebell set and a bench. Under $500: add a barbell and basic weight plates. The most important piece of equipment is the one you'll actually use. Space requirement is minimal — a 6x6 foot area is enough for most workouts. Focus on compound movements that work multiple muscle groups. Key exercises that require minimal equipment: push-ups, squats, deadlifts with dumbbells, rows, and planks.",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
        author: "Jake Thompson",
        publishedAt: new Date("2024-03-15").toISOString(),
        tags: JSON.stringify(["home gym", "equipment", "budget", "fitness"]),
        favorited: false,
      },
      {
        title: "Sleep and Fitness: Why Rest Is Your Secret Weapon",
        excerpt: "Most athletes underestimate sleep's impact on performance. Discover how optimizing your sleep can transform your results.",
        content: "Sleep is arguably the most anabolic (muscle-building) activity you can do. During deep sleep, your body releases 70% of its daily growth hormone. Poor sleep increases cortisol (a stress hormone that breaks down muscle and promotes fat storage), reduces testosterone, impairs cognitive function, and slows recovery. Most adults need 7-9 hours. To optimize sleep: maintain a consistent sleep schedule, keep your room cool (65-68°F / 18-20°C), avoid screens 1 hour before bed, limit caffeine after 2pm, and consider magnesium supplementation. Even one night of poor sleep reduces strength output by up to 20% and cardiovascular endurance significantly.",
        imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=500&fit=crop",
        author: "Dr. Lisa Chen",
        publishedAt: new Date("2024-03-22").toISOString(),
        tags: JSON.stringify(["sleep", "recovery", "performance", "health"]),
        favorited: false,
      },
    ]);
    console.log("Articles seeded");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
