import * as dotenv from "dotenv";
dotenv.config();
import { db } from "@workspace/db";
import {
  workoutsTable,
  mealsTable,
  articlesTable,
  profileTable,
} from "@workspace/db/schema";

async function seed() {
  console.log("Seeding database...");

  // Profile
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

  // Workouts
  await db.delete(workoutsTable);

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
      title: "MOBILITY TEST",
      description: "A neighbor-friendly, no-jump HIIT workout perfect for small spaces. Maximum burn, minimum noise.",
      category: "home",
      difficulty: "intermediate",
      duration: 25,
      calories: 300,
      imageUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=400&fit=crop",
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
    {
      title: "Leg Day Builder",
      description: "Lower body workout for strength and endurance.",
      category: "strength",
      difficulty: "advanced",
      duration: 40,
      calories: 320,
      imageUrl: "https://images.unsplash.com/photo-1434596922112-19c563067271?w=600&h=400&fit=crop",
      steps: JSON.stringify([
        "Barbell squats",
        "Lunges",
        "Deadlifts",
        "Calf raises",
        "Cooldown"
      ]),
      completed: false,
    },
    {
      title: "Home Full Body Burn",
      description: "At-home workout targeting all major muscle groups.",
      category: "home",
      difficulty: "beginner",
      duration: 22,
      calories: 200,
      imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop",
      steps: JSON.stringify([
        "March in place",
        "Bodyweight squats",
        "Wall push-ups",
        "Glute bridges",
        "Cooldown"
      ]),
      completed: false,
    },
    {
      title: "Core Crusher",
      description: "Intense abs and core strengthening circuit.",
      category: "home",
      difficulty: "advanced",
      duration: 20,
      calories: 170,
      imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&h=400&fit=crop",
      steps: JSON.stringify([
        "Plank",
        "Bicycle crunches",
        "Leg raises",
        "Mountain climbers",
        "Side plank"
      ]),
      completed: false,
    },
    {
      title: "Mobility Reset",
      description: "Recovery-focused mobility session for flexibility and posture.",
      category: "yoga",
      difficulty: "beginner",
      duration: 28,
      calories: 110,
      imageUrl: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&h=400&fit=crop",
      steps: JSON.stringify([
        "Neck rolls",
        "Shoulder mobility",
        "Hip openers",
        "Hamstring stretch",
        "Breathing"
      ]),
      completed: false,
    },
  ]);

  console.log("Workouts seeded");

  // Meals
  await db.delete(mealsTable);

  await db.insert(mealsTable).values([
    {
      title: "Protein Power Bowl",
      description: "High-protein quinoa bowl with grilled chicken, roasted veggies, and tahini dressing.",
      goal: "muscle-gain",
      calories: 650,
      protein: 52,
      carbs: 58,
      fat: 18,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
      ingredients: JSON.stringify(["Chicken", "Quinoa", "Corn", "Avocado", "Tomato", "Tahini"]),
      mealType: "lunch",
    },
    {
      title: "Green Detox Smoothie",
      description: "Nutrient-dense green smoothie packed with vitamins, minerals, and fiber.",
      goal: "weight-loss",
      calories: 180,
      protein: 8,
      carbs: 32,
      fat: 3,
      imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800&q=80",
      ingredients: JSON.stringify(["Spinach", "Apple", "Banana", "Chia Seeds", "Water"]),
      mealType: "breakfast",
    },
    {
      title: "Overnight Oats",
      description: "Easy overnight oats with berries and peanut butter for sustained energy.",
      goal: "maintenance",
      calories: 320,
      protein: 14,
      carbs: 42,
      fat: 10,
      imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&q=80",
      ingredients: JSON.stringify(["Oats", "Milk", "Berries", "Peanut Butter", "Honey"]),
      mealType: "breakfast",
    },
    {
      title: "Salmon & Rice Plate",
      description: "Lean salmon served with rice and steamed vegetables.",
      goal: "maintenance",
      calories: 540,
      protein: 40,
      carbs: 48,
      fat: 20,
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
      ingredients: JSON.stringify(["Salmon", "Rice", "Broccoli", "Carrots", "Olive Oil"]),
      mealType: "dinner",
    },
    {
      title: "Turkey Avocado Wrap",
      description: "Whole wheat wrap packed with turkey, avocado, and greens.",
      goal: "weight-loss",
      calories: 390,
      protein: 30,
      carbs: 29,
      fat: 16,
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
      ingredients: JSON.stringify(["Turkey", "Avocado", "Lettuce", "Tomato", "Whole Wheat Wrap"]),
      mealType: "lunch",
    },
    {
      title: "Greek Yogurt Parfait",
      description: "Creamy yogurt with granola and fresh fruit.",
      goal: "maintenance",
      calories: 260,
      protein: 17,
      carbs: 30,
      fat: 8,
      imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
      ingredients: JSON.stringify(["Greek Yogurt", "Granola", "Blueberries", "Honey"]),
      mealType: "breakfast",
    },
    {
      title: "Beef Stir Fry",
      description: "High-protein beef stir fry with colorful vegetables.",
      goal: "muscle-gain",
      calories: 610,
      protein: 46,
      carbs: 44,
      fat: 22,
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
      ingredients: JSON.stringify(["Beef", "Bell Pepper", "Broccoli", "Soy Sauce", "Rice"]),
      mealType: "dinner",
    },
    {
      title: "Egg & Toast Combo",
      description: "Simple protein-rich breakfast with eggs and toast.",
      goal: "maintenance",
      calories: 310,
      protein: 18,
      carbs: 24,
      fat: 15,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
      ingredients: JSON.stringify(["Eggs", "Whole Grain Bread", "Butter", "Parsley"]),
      mealType: "breakfast",
    },
    {
      title: "Chicken Pasta Meal Prep",
      description: "Balanced chicken pasta meal for energy and recovery.",
      goal: "muscle-gain",
      calories: 720,
      protein: 48,
      carbs: 68,
      fat: 21,
      imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
      ingredients: JSON.stringify(["Chicken", "Pasta", "Tomato Sauce", "Parmesan", "Spinach"]),
      mealType: "lunch",
    },
    {
      title: "Tuna Salad Box",
      description: "Light tuna salad meal with greens and olive oil dressing.",
      goal: "weight-loss",
      calories: 290,
      protein: 27,
      carbs: 11,
      fat: 14,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
      ingredients: JSON.stringify(["Tuna", "Lettuce", "Cucumber", "Olives", "Olive Oil"]),
      mealType: "lunch",
    },
    {
      title: "Peanut Banana Shake",
      description: "Calorie-dense shake perfect for post-workout recovery.",
      goal: "muscle-gain",
      calories: 480,
      protein: 24,
      carbs: 45,
      fat: 20,
      imageUrl: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800&q=80",
      ingredients: JSON.stringify(["Milk", "Banana", "Peanut Butter", "Oats", "Protein Powder"]),
      mealType: "snack",
    },
    {
      title: "Veggie Omelette",
      description: "Low-carb omelette loaded with vegetables and flavor.",
      goal: "weight-loss",
      calories: 240,
      protein: 19,
      carbs: 8,
      fat: 14,
      imageUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&q=80",
      ingredients: JSON.stringify(["Eggs", "Spinach", "Mushrooms", "Bell Pepper", "Cheese"]),
      mealType: "dinner",
    },
  ]);

  console.log("Meals seeded");

  await db.delete(articlesTable);

  await db.insert(articlesTable).values([
    {
      title: "The Science Behind Muscle Growth: What You Need to Know",
      excerpt: "Understanding hypertrophy is key to designing an effective training program.",
      content:
        "Muscle growth, or hypertrophy, is the body's adaptive response to a training stimulus it cannot yet easily handle. When you lift progressively heavier loads, or perform more reps under control, you create micro-tears in muscle fibers. The repair process — fueled by protein and driven by recovery — is what actually makes the muscle larger and stronger over time. Without that stimulus, the body has no reason to change.\n\nThree mechanisms drive hypertrophy: mechanical tension, metabolic stress, and muscle damage. Mechanical tension is the most important of the three. It comes from challenging weights taken close to failure, usually in rep ranges between 6 and 20. Metabolic stress is the burn you feel during higher-rep sets, and muscle damage is the normal wear that triggers repair. Programs that emphasize compound lifts, steady progression, and enough weekly volume address all three.\n\nProtein is the raw material for repair. Research consistently points to 1.6 to 2.2 grams per kilogram of body weight per day as a useful target for people training seriously. Spreading that intake across three or four meals tends to support muscle protein synthesis better than loading it into a single large dose. Total calories matter too: a slight surplus makes gaining easier, while a deficit can still build muscle but usually more slowly.\n\nRecovery is the piece most beginners underestimate. Muscles grow between sessions, not during them. Sleep, stress management, and training frequency all shape how much you can adapt. Most intermediate lifters do well training each muscle group twice per week with about 48 hours between heavy sessions for that group.\n\nFinally, patience matters. Real, visible hypertrophy takes months, not weeks. Consistency across a full year produces more change than any single perfect program. Track your lifts, eat enough to recover, and trust the process.",
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
      author: "Dr. Sarah Mitchell",
      publishedAt: "2024-02-15",
      tags: JSON.stringify(["strength", "muscle", "science", "training"]),
      favorited: false,
    },
    {
      title: "10 Best Foods for Post-Workout Recovery",
      excerpt: "What you eat after a workout is just as important as the workout itself.",
      content:
        "What you eat after training helps restore energy, repair tissue, and reduce soreness. No single food is magical, but a handful of staples show up again and again in sports nutrition research. The goal after a hard session is simple: combine some protein with some carbohydrate, add fluids, and eat within a reasonable window.\n\nProtein sources lead the list. Eggs, Greek yogurt, cottage cheese, salmon, chicken, lean beef, and tofu all deliver high-quality protein with the essential amino acids your muscles need to rebuild. Whey protein powder is convenient when appetite is low after training, but real food usually wins when it is an option. Aim for roughly 20 to 40 grams of protein in your post-workout meal.\n\nCarbohydrates restore the muscle glycogen you burned during the session. Sweet potatoes, oats, rice, bananas, and berries all work well. The harder and longer the workout, the more carbs you should include. For a short strength session, a normal meal is plenty; for a long endurance session, you may need more.\n\nHydration is often overlooked. Water alone covers most sessions, but if you trained in the heat or for more than an hour, adding electrolytes through salt, a sports drink, or simply salted food helps recovery. A glass of milk after training is one of the oldest and most effective recovery tools — it gives you protein, carbs, and fluids in one drink.\n\nFinally, think of the post-workout window as forgiving, not urgent. You do not need to eat within 30 minutes. A solid mixed meal within one to two hours is more than enough for most people. Consistency across the whole day matters more than the perfect shake.",
      imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
      author: "Emma Rodriguez, RD",
      publishedAt: "2024-02-20",
      tags: JSON.stringify(["nutrition", "recovery", "food", "health"]),
      favorited: false,
    },
    {
      title: "HIIT vs. Steady State Cardio: Which Burns More Fat?",
      excerpt: "We compare two popular cardio methods to help you choose the right approach.",
      content:
        "The HIIT versus steady-state debate has been running for years, and the honest answer is that both work. High-intensity interval training alternates short bursts of near-maximal effort with active recovery. Steady state is a continuous moderate pace — a long walk, jog, bike, or row where you can still hold a conversation. Each has a place, and the better option for you depends more on recovery and consistency than on any magic metabolic effect.\n\nHIIT is time-efficient. Twenty to thirty minutes of intervals can burn as many calories as 45 to 60 minutes of moderate cardio, and the intensity keeps your heart rate elevated afterward. That is the often-cited afterburn effect. It is real, but smaller than marketing suggests — usually an extra 6 to 15 percent on top of the session itself. If you have limited time and good recovery, HIIT delivers a lot of training stimulus in a short window.\n\nSteady-state cardio is gentler on the nervous system. It builds aerobic base, improves circulation, and stacks well on top of hard strength training. It is also easier to do daily without interfering with lifts. Many experienced athletes use it as their default and save high-intensity work for two sessions per week.\n\nFor fat loss specifically, total weekly energy expenditure and nutrition drive the outcome. A person doing three HIIT sessions per week and a person doing four hours of brisk walking can land in the same place if calorie intake matches. What changes is how tired you feel, how your joints respond, and how well you sleep.\n\nA practical plan is one or two HIIT sessions per week paired with two or three steady-state sessions and a strength routine. Pick formats you actually enjoy — enjoyment is the single best predictor of long-term adherence, and adherence is what produces results.",
      imageUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80",
      author: "Coach Marcus Williams",
      publishedAt: "2024-03-01",
      tags: JSON.stringify(["cardio", "fat-loss", "hiit", "training"]),
      favorited: false,
    },
    {
      title: "Why Sleep Matters for Fitness Progress",
      excerpt: "Training hard means nothing if recovery is neglected.",
      content:
        "Sleep is the most underrated performance tool in fitness. When you sleep, your body releases growth hormone, clears metabolic waste from the brain, and consolidates the motor patterns you practiced during the day. Cutting sleep short cuts recovery short, and the downstream effect is slower progress and more injuries. It is that simple.\n\nResearch on athletes shows a clear pattern: sleeping less than seven hours consistently reduces strength, slows reaction time, and increases injury risk by as much as 60 percent. In one well-known study, basketball players who extended their sleep to ten hours per night improved their sprint times and free-throw accuracy within a few weeks. Your nervous system needs rest to fire the way you trained it to fire.\n\nHormones tell the same story. Poor sleep raises cortisol and ghrelin while lowering leptin and testosterone. That combination means more hunger, more cravings for quick energy, and less drive to train. People who are dieting and sleeping badly lose a higher percentage of their weight from muscle than from fat, which is the opposite of what most people want.\n\nHabit matters more than tricks. Keep a consistent bedtime, even on weekends. Dim lights an hour before sleep and keep the bedroom cool and dark. Caffeine lingers in the body for eight to ten hours, so an afternoon coffee often shows up as a restless night. If you train late, a light protein snack before bed can help you settle.\n\nAim for seven to nine hours per night. Track how you feel and perform, not just how long you slept. If you are missing lifts, feeling unmotivated, or constantly sore, sleep is usually the first place to look before you change your program or diet.",
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=500&fit=crop",
      author: "Lina Foster",
      publishedAt: "2024-03-05",
      tags: JSON.stringify(["sleep", "recovery", "fitness"]),
      favorited: false,
    },
    {
      title: "How to Build a Sustainable Fat Loss Plan",
      excerpt: "Crash diets fail. Sustainable habits win.",
      content:
        "Most fat loss plans fail not because the math is wrong, but because the plan is too aggressive to live with. A sustainable plan respects your biology, your schedule, and the fact that you are a human being who will occasionally go to birthday parties. The goal is steady progress you can maintain, not the fastest theoretical drop on paper.\n\nStart with a modest calorie deficit of 300 to 500 calories below your maintenance level. That usually produces a loss of 0.25 to 0.5 kilograms per week — slow enough to preserve muscle, fast enough to see the scale move. Bigger deficits work short-term but almost always trigger hunger, fatigue, and rebound eating within a few weeks.\n\nProtein is the non-negotiable macronutrient while dieting. Eating 1.6 to 2.2 grams per kilogram of body weight keeps you full, protects your muscle, and raises the thermic cost of eating. Build each meal around a protein source, then add vegetables and a portion of carbs or fats you enjoy. Diets you actually like are the ones that stick.\n\nDaily movement matters as much as formal training. Walking, taking stairs, cleaning, and casual activity make up what physiologists call non-exercise activity thermogenesis — NEAT. NEAT can account for hundreds of calories per day and drops when you diet, so tracking steps helps catch that decline. Aim for 7,000 to 10,000 steps per day as a simple proxy.\n\nFinally, plan for plateaus. Weight loss is never linear. Expect water-weight swings, slower weeks, and the occasional stall. When a true plateau hits — two to three weeks with no change — adjust calories by 100 to 200 per day or add one more activity session. Patience and small corrections beat dramatic overhauls every time.",
      imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
      author: "Noah Grant",
      publishedAt: "2024-03-12",
      tags: JSON.stringify(["fat-loss", "nutrition", "habits"]),
      favorited: false,
    },
    {
      title: "Beginner Strength Training Mistakes",
      excerpt: "Avoid these common errors when starting in the gym.",
      content:
        "The first six months in the gym shape how the next ten years feel. Beginners who build good habits early make steady progress for a long time. Beginners who chase shortcuts usually end up frustrated, injured, or quitting. Most of the mistakes in this article are not dramatic — they are small choices repeated day after day.\n\nThe biggest mistake is adding weight too quickly at the expense of form. A squat that looks solid at 40 kilograms often breaks down at 80 if the movement pattern was never owned in the first place. Spend the first few weeks practicing the main lifts with light loads and full range of motion. Your nervous system is learning the pattern, and what you groove now will show up under heavier loads later.\n\nProgram hopping is the second common trap. Switching plans every two weeks because a new video looked exciting means you never give any program enough time to work. Pick a simple beginner routine — something with squats, hinges, presses, rows, and carries — and run it for at least eight to twelve weeks before judging it. Progress in strength training is measured in months, not days.\n\nSkipping the boring parts is the third. Warm-ups, mobility work, and accessory exercises feel less exciting than main lifts, but they protect your joints and balance out the muscles that support your big movements. Five to ten minutes of dedicated warm-up before each session pays for itself over a training career.\n\nFinally, do not neglect recovery. Beginners who train six days per week with maximum effort on every set burn out within months. Three to four well-structured sessions per week, with real food, real sleep, and real rest days, produces more progress than constant grinding. Start slower than you think you need to — and let the long game take care of itself.",
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
      author: "Coach Nina Patel",
      publishedAt: "2024-03-18",
      tags: JSON.stringify(["strength", "beginner", "gym"]),
      favorited: false,
    },
    {
      title: "Meal Timing: Does It Really Matter?",
      excerpt: "The basics matter more, but timing still has some value.",
      content:
        "Meal timing is one of the most overcomplicated topics in nutrition. Supplement companies have sold the idea of a tight anabolic window for decades, and apps tell you exactly when to eat your macros to the minute. The truth is less dramatic and far more freeing: for most people, total daily calories and total daily protein are what drive results. Timing sits on top of that as a small optimization, not a foundation.\n\nThe evidence for a narrow post-workout window is weak. Studies that actually measure muscle protein synthesis over 24 hours show that as long as you eat a protein-rich meal within a few hours of training, the difference between 30 minutes and 2 hours is negligible. If you already ate a proper meal two to three hours before your session, your body is still drawing on those amino acids during and after training.\n\nWhere timing does matter is performance. Training on an empty stomach works fine for light sessions, but for heavy lifting or long cardio, a meal 90 to 180 minutes before helps you work harder. That meal should include some carbohydrate and a moderate amount of protein. Fat and fiber are fine in normal amounts but are usually kept lower close to training to avoid digestive discomfort.\n\nProtein distribution across the day matters a little more than post-workout timing. Spreading your daily target across three to five meals, each containing 25 to 45 grams of protein, supports muscle protein synthesis better than eating most of it in one sitting. This is practical rather than magical — it just means regular, protein-focused meals.\n\nSo worry about the big rocks first: are you hitting a reasonable calorie target, is your protein intake adequate, are you eating mostly whole foods, and are you hydrated? Once those are in place, meal timing can be a small bonus. Before that, it is a distraction.",
      imageUrl: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80",
      author: "Omar Salah",
      publishedAt: "2024-03-25",
      tags: JSON.stringify(["nutrition", "meal-timing", "performance"]),
      favorited: false,
    },
    {
      title: "Home Workouts That Actually Work",
      excerpt: "You do not need a full gym to make progress.",
      content:
        "Home workouts used to be dismissed as a backup plan — something you did when you could not make it to the gym. That has changed. With a little creativity and the right approach, training at home can produce real strength, real muscle, and real conditioning gains. The main requirement is the same as in any gym: progressive overload and consistency.\n\nBodyweight movements form the foundation. Push-ups, squats, lunges, rows under a sturdy table, glute bridges, planks, and dead hangs cover most major movement patterns. The trick is understanding how to progress them. Once regular push-ups are easy, move to elevated feet, then archer variations, then pseudo-planche versions. Each pattern has a ladder of harder variations that can challenge you for years.\n\nA small amount of equipment multiplies your options. A set of resistance bands, a pull-up bar fitted to a doorway, and a pair of adjustable dumbbells cover perhaps 80 percent of what a commercial gym offers. For around the cost of three months of gym membership, you can build a home setup that lasts a decade.\n\nThe key to home training is structure. Without the ritual of driving to a gym, it is easy to let sessions drift into casual exercise. Write your session on paper or in a notes app before you start. Warm up deliberately. Track sets, reps, and the hardest variation you managed. When you hit your target rep range, move to the next progression. That pattern — the same one any good gym program uses — is what separates a productive 30 minutes from a half-hearted workout.\n\nFinally, accept that home training has trade-offs. Very advanced lifters who chase heavy squats and deadlifts will eventually need more equipment. For everyone else — which is most people — a well-run home program is more than enough to build a strong, capable body.",
      imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
      author: "Maya Chen",
      publishedAt: "2024-04-01",
      tags: JSON.stringify(["home", "training", "bodyweight"]),
      favorited: false,
    },
    {
      title: "Protein Intake Explained Simply",
      excerpt: "How much protein do you really need?",
      content:
        "Protein has become the star macronutrient in fitness, and for good reason. It builds and repairs muscle tissue, keeps you full between meals, and requires more energy to digest than carbs or fat. Still, the noise around protein can make a simple topic feel complicated. Most people can cover what they need by following a few clear rules.\n\nA practical target for active people is between 1.6 and 2.2 grams of protein per kilogram of body weight per day. A 70-kilogram adult training three to five times per week would aim for roughly 110 to 150 grams daily. If you are in a calorie deficit, push toward the higher end of that range to better protect your muscle. If you are sedentary and not training, you can get by with less — around 1 gram per kilogram is still a solid baseline.\n\nDistribution matters more than timing. Your body can use roughly 25 to 45 grams of protein per meal for muscle protein synthesis. Eating one enormous 120-gram dose at dinner is less effective than spreading the same total across three or four meals of 30 to 40 grams each. That distribution is what research repeatedly points to.\n\nFood quality matters, but not as much as people think. Animal sources — chicken, beef, eggs, fish, Greek yogurt, milk, and whey — are rich in all nine essential amino acids and easy to hit targets with. Plant sources like beans, lentils, tofu, tempeh, and seitan work too, but you usually need slightly more total protein and more variety to cover the full amino acid profile.\n\nSupplements are convenient, not necessary. Whey and casein are just concentrated milk proteins, and a scoop of either is a fast way to add 20 to 25 grams to a meal or snack. If you hit your target with food alone, you do not need powder. The magic is in the total, and in doing it consistently.",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
      author: "Yara Mostafa",
      publishedAt: "2024-04-06",
      tags: JSON.stringify(["protein", "nutrition", "muscle"]),
      favorited: false,
    },
    {
      title: "Mobility vs. Flexibility: What Is the Difference?",
      excerpt: "People mix them up all the time.",
      content:
        "Flexibility and mobility sound interchangeable, but they describe two different qualities. Flexibility is the passive range of motion available at a joint — how far a limb can be moved when someone else, or gravity, is doing the work. Mobility is the active range of motion you can control under your own power. You can be extremely flexible and still have poor mobility, which is why people who can touch their toes effortlessly sometimes still struggle with a deep squat.\n\nThis distinction matters because injuries rarely happen in passive ranges. They happen in active ones — when a muscle is asked to produce force at a length it cannot control. A dancer with huge passive range but no strength at the end of that range is more injury-prone than a lifter with a smaller active range they fully own. The goal is strength through the range you actually use, not just the ability to fold your body into pretty shapes.\n\nStatic stretching is useful for flexibility but limited for mobility. Holding a hamstring stretch for 30 seconds can increase passive range, but it does not teach your nervous system to generate force at that length. Mobility drills address that gap. Controlled articular rotations, deep squat holds, and end-range isometrics gradually expand the range your body considers safe under load.\n\nA practical approach is to do a short mobility routine — 5 to 10 minutes — before training, focused on the joints you are about to use. Hips and ankles before squats. Shoulders before pressing. Thoracic spine before rowing or overhead work. The sessions themselves build strength through range when you use full, controlled reps. Over months, your usable range expands without needing hours of separate stretching.\n\nBoth qualities have their place. Spend a few minutes each day on mobility, train through full ranges in the gym, and save longer flexibility work for activities that demand it specifically. For most people, that combination produces joints that feel good, move well, and last.",
      imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop",
      author: "Hana Ali",
      publishedAt: "2024-04-10",
      tags: JSON.stringify(["mobility", "flexibility", "recovery"]),
      favorited: false,
    },
    {
      title: "How to Stay Consistent When Motivation Drops",
      excerpt: "Discipline beats waiting for inspiration.",
      content:
        "Motivation is a terrible long-term strategy. It is a feeling, and feelings change with sleep, stress, weather, and a dozen things outside your control. The people who stay fit for decades do not have a secret reserve of willpower — they have systems that make training the default, so showing up does not require a burst of emotion every time.\n\nThe first lever is lowering the friction to start. Keep your gym bag packed. Lay out your clothes the night before. Pick a gym close to home or work, even if a better one is 30 minutes away. The harder a workout is to begin, the fewer you will do. Small environmental tweaks save more sessions than any motivational video ever has.\n\nThe second lever is identity. Habits tied to who you think you are stick better than habits tied to a goal. There is a difference between I want to lose weight and I am someone who trains four times a week. Goals end; identities continue. When you miss a session, an identity-driven person skips one workout and comes back. A goal-driven person skips one workout and quits.\n\nThe third is making consistency easy to measure. Track workouts on a calendar or an app. The visual streak becomes its own reward. Miss a day and you break the streak; missing two is harder than missing one. The rule most experienced trainees follow is never miss twice. Bad weeks happen, but never let a bad week become a bad month.\n\nFinally, expect motivation to come and go. Some sessions will feel amazing; some will feel like a chore. Neither one defines your progress. What defines progress is what you do across the dull middle — the ordinary Tuesday sessions that are neither inspiring nor catastrophic. Keep those, and the rest takes care of itself.",
      imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
      author: "Karim Adel",
      publishedAt: "2024-04-14",
      tags: JSON.stringify(["mindset", "habits", "consistency"]),
      favorited: false,
    },
    {
      title: "The Best Beginner Weekly Workout Split",
      excerpt: "A simple weekly structure is enough to make progress.",
      content:
        "Beginners often spend too much time designing the perfect split and not enough time actually training. The good news is that for your first year in the gym, almost any reasonable program will work if you run it consistently. The structure below is one of the simplest — three full-body sessions per week — and it builds a surprising amount of strength in a short time.\n\nA full-body split works because it hits each muscle group two to three times per week with modest volume per session. That frequency is ideal for learning movement patterns and driving adaptation while leaving plenty of recovery time. Train on non-consecutive days — Monday, Wednesday, Friday is the classic layout — and rest or walk in between.\n\nEach session should cover five movement patterns: a squat, a hinge, a horizontal push, a horizontal pull, and a vertical press or pull. A representative Day A might be goblet squats, Romanian deadlifts, push-ups or bench press, dumbbell rows, and an overhead press, with a short core finisher. Day B could swap in lunges, hip thrusts, incline presses, lat pulldowns, and band pull-aparts. Day C rotates back to the first variations. Three sets of 6 to 12 reps per exercise is enough.\n\nOnce you can do four or five weeks of that program comfortably, you can graduate to an upper/lower split four days per week. That structure gives you more room to add accessory work and slightly increases total volume, which matches the slightly higher recovery capacity you build as a trained lifter. After six months to a year of upper/lower work, you can explore push/pull/legs or more specialized options.\n\nIgnore the temptation to copy advanced bodybuilder splits early on. A program that works for a lifter with five years of experience will not produce the same results for a beginner. Keep it simple, keep the frequency reasonable, and let your body catch up to the structure before you add complexity.",
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
      author: "Rana Tarek",
      publishedAt: "2024-04-18",
      tags: JSON.stringify(["workout", "beginner", "split"]),
      favorited: false,
    },
  ]);
  console.log("Articles seeded");

  console.log("Seeding complete!");


}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});