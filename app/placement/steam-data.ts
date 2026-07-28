export interface SteamMonth {
  month: string;
  theme: string;
  kit: string | null;
  kitUrl: string | null;
  scripture: string | null;
  chapel: string | null;
  intervention: string;
  onLevel: string;
  advanced: string;
  garden: string | null;
}

const steamMonthsRaw = [
  {
    month:"August", theme:"Designed with Purpose",
    kit:"Thames & Kosmos: Genetics & DNA 2.0", kitUrl:"https://store.thamesandkosmos.com/products/genetics-dna-lab",
    chapel:"Fearfully Made · Known Before Birth · Identity in Christ · Walking in Purpose",
    scripture:"Psalm 139:14 · Jeremiah 1:5",
    garden:"Plant 2 varieties of bean seeds. Before planting, predict which will grow taller. Start a Garden Observation Journal — this is your class genetics experiment.",
    levels:{
      k2:{int:'With teacher, touch the DNA model pieces. Draw a cell and label it "where DNA lives." Copy one sentence: "DNA tells my body how to grow."',
          on:'Complete Experiment 1 — extract DNA from a tomato with teacher guidance. Draw what you saw. Answer: What is DNA? Why is everyone different?',
          adv:'Complete Experiment 1. Assemble 4-base-pair section of the DNA helix. Write 2 sentences connecting Psalm 139:14 to what you learned about DNA.'},
      "35":{int:'Complete Experiment 1 with teacher support. Label the cell diagram from the kit. Answer 3 guided questions.',
          on:'Complete Experiment 1 independently. Write a lab report (hypothesis, observations, conclusion). Use the chromosome puzzle.',
          adv:'Experiments 1 and 5 — isolate DNA AND assemble the double helix model. Use the decoder film. Write: What does Psalm 139:14 mean scientifically?'},
      "68":{int:'Complete Experiments 1 and 3 with teacher support. Label diagrams. Play the chip inheritance game. Write a 3-sentence summary.',
          on:'Complete Experiments 1, 3, and 5 — DNA extraction, inheritance game, and double helix assembly. Write a full lab report.',
          adv:'All experiments including Experiment 7 — DNA fingerprinting. Write a 1-page lab report. Research Watson, Crick, and Rosalind Franklin.'},
      "912":{int:'Complete all kit experiments with structured lab report template. Present one finding to the class verbally.',
           on:'Complete all experiments. Full lab report. Connect DNA fingerprinting to a real forensic science career.',
           adv:'Complete all experiments and lead the class discussion. Research CRISPR gene editing — ethical implications from a biblical worldview.'}
    }
  },
  {
    month:"September", theme:"Think Like a Scientist",
    kit:"Thames & Kosmos: Forces & Interactions", kitUrl:"https://store.thamesandkosmos.com/products/forces-interactions-middle-school-classroom-kit",
    chapel:"Seeking Truth · Testing What We Learn · Wisdom vs. Assumptions · Understanding Through God",
    scripture:"Proverbs 25:2 · 1 Thessalonians 5:21",
    garden:"Set up a controlled experiment: 3 identical pots, different watering amounts. Write a hypothesis. Measure and record plant heights weekly.",
    levels:{
      k2:{int:'With teacher, build the balance beam. Add one weight at a time. Draw what happens. Name one thing that changed.',
          on:'Build the balance beam. Test what happens when you move the weight closer and farther. Draw your results.',
          adv:'Build the beam, test three positions, record data in a table. Write a hypothesis first, then compare to results.'},
      "35":{int:'Complete Activity 1 — build the balance beam. Identify the independent variable. Record observations.',
          on:'Complete Activities 1 and 2. Record data in a table. Write: do your results support the instructions?',
          adv:'Activities 1 and 2. Calculate results. Create a bar graph. Connect to September chapel theme.'},
      "68":{int:'Build kit glider. Test 2 designs, record distances, write a structured comparison paragraph.',
          on:'Build and test 3 wing configurations. Full lab report comparing designs using the 4 forces of flight.',
          adv:'Build 3+ designs. Calculate lift-to-drag ratio. Research computational aerodynamics.'},
      "912":{int:'Complete Activities 1 and 2 with structured template. Present results to class.',
           on:'Activities 1 and 2. Full formal lab report with error analysis.',
           adv:'Activities 1–4. Design one additional experiment using the kit. Run it, collect data, and present findings.'}
    }
  },
  {
    month:"October", theme:"Build It. Test It. Improve It.",
    kit:"Thames & Kosmos: Forces & Interactions — Activities 5–8", kitUrl:"https://store.thamesandkosmos.com/products/forces-interactions-middle-school-classroom-kit",
    chapel:"Building with Wisdom · Following Instructions · Perseverance · Excellence",
    scripture:"Proverbs 24:3 · Genesis 6:14",
    garden:"Engineering challenge: design and build a trellis or plant support using bamboo stakes and twine. Apply all 5 EDP steps.",
    levels:{
      k2:{int:'With teacher, stack kit pieces to build a tower. Add blocks until it falls. Draw what happened. Name one change you would make.',
          on:'Build a tower from kit pieces. Add weights one at a time. When it falls, make ONE change and rebuild. Draw both towers.',
          adv:'Build and test two different tower designs. Record how much weight each held. Write which design was stronger and why.'},
      "35":{int:'Complete Activity 5 — structural load testing with teacher support. Draw what failed and name one change.',
          on:'Activity 5 — build, test to failure, rebuild with one change, test again. Record loads. Write: What engineering principle did you apply?',
          adv:'Activity 5 with three iteration cycles. Graph load capacity vs. iteration. Research: What makes a triangle stronger than a square?'},
      "68":{int:'Activity 5 with teacher. Apply the 5-step EDP with a graphic organizer. Participate in class challenge.',
          on:'Activities 5–7. Design journal documenting all 5 EDP steps. Class bridge challenge — 20cm+ span.',
          adv:'Activities 5–8. Engineering design report with sketches, data, 3+ iteration cycles. Compare to a real structure.'},
      "912":{int:'Activities 5–6 with structured template. Participate in challenge and explain design choices.',
           on:'Activities 5–8. Full engineering report. Calculate load-to-weight ratio. Connect Proverbs 24:3 to engineering.',
           adv:'All activities. Formal engineering report with iterations, calculations, and a "next steps" proposal. Research an engineering failure.'}
    }
  },
  {
    month:"November", theme:"Design. Code. Move.",
    kit:"Thames & Kosmos: Robotics Workshop with micro:bit", kitUrl:"https://roboticsworkshop.thamesandkosmos.com/",
    chapel:"God Gives Skill · Creating with Purpose · Planning vs. Direction · Innovation with Integrity",
    scripture:"Exodus 35:31–32 · Proverbs 16:9",
    garden:"Design challenge: sketch a robot that could help in the school garden — sensors, actions, and code logic.",
    levels:{
      k2:{int:'With teacher, build Robot #1 from step-by-step guide. Press run and watch it move. Draw the robot and name its parts.',
          on:'Build Robot #1. Use MakeCode to add two instructions: move forward, stop. Run the program.',
          adv:'Build Robot #1. Program it to move forward, turn, and return. Add one more instruction. Explain your code to a partner.'},
      "35":{int:'Build Robot #1 with teacher. Add one block of code using MakeCode. Draw: what does the robot do now?',
          on:'Build Robot #1. Code it to move in a pattern using a loop. Write: What is a loop?',
          adv:'Build Robot #1. Add a loop and a sensor condition (if obstacle → stop). Write about conditional statements. Connect to Proverbs 16:9.'},
      "68":{int:'Build Robot #1 with support. Code movement with block code. Write a 3-sentence description.',
          on:'Build Robots #1 and #2. Code with loops and conditionals. Translate one block program to Python.',
          adv:'Build 3+ robots. Code in Python. Write a 1-page reflection on ethical issues in designing autonomous robots.'},
      "912":{int:'Build Robot #1–2. Code with MakeCode block code. Demonstrate robot completing a task.',
           on:'Build 3 robots. Code in Python. Lead a mini-lesson explaining loops, conditionals, or functions.',
           adv:'Build 3+ robots, full Python program, career research paper on robotics in healthcare, agriculture, aerospace, or education.'}
    }
  },
  {
    month:"December", theme:"Making a Difference",
    kit:"Thames & Kosmos: Renewable Energy Kits", kitUrl:"https://thamesandkosmos.com/collections/alternative-energy",
    chapel:"Let Your Light Shine · Serving Others · Giving Matters · Impacting the World",
    scripture:"Matthew 5:16 · Acts 20:35",
    garden:"Discuss: how could renewable energy power a school greenhouse through winter? Sketch a solar-powered grow light setup.",
    levels:{
      k2:{int:'With teacher, build a solar-powered model. Cover the panel — what happens? Draw: What does solar energy do?',
          on:'Build the solar model. Test in sun vs. shade. Draw results. Where in our community could solar energy help?',
          adv:'Build the solar model. Test in sun, shade, and flashlight. Write about solar energy helping a community in need.'},
      "35":{int:'Build the solar model with teacher. Draw the energy conversion — sun → electricity → motion.',
          on:'Build and test the solar model. Write a 1-paragraph community solution with a renewable energy source.',
          adv:'Build and test 2 energy types. Compare output. Write a 1-page proposal for a Jacksonville neighborhood.'},
      "68":{int:'Build solar model. Research Florida\'s renewable energy percentage. Write a 3-sentence summary.',
          on:'Build 2 renewable energy models. Compare efficiency. Design a renewable energy solution for a community need.',
          adv:'Build and test 3 energy types. Calculate and compare efficiency. Write a 1-page evidence-based proposal.'},
      "912":{int:'Build 2 models. Participate in class discussion. Write a structured proposal paragraph.',
           on:'Build all models. Research Florida renewable energy. Write a 1-page proposal and present.',
           adv:'All models + independent research. Present a full "Renewable Energy Plan for Father\'s Harbor Academy."'}
    }
  },
  {
    month:"January", theme:"Think. Plan. Achieve.",
    kit:"Thames & Kosmos: Ubongo Puzzle Game", kitUrl:"http://thamesandkosmos.com/images/tip_sheets/Ubongo_Teacher_Tip_Sheet.pdf",
    chapel:"Setting Goals · Planning Wisely · Discipline · Execution",
    scripture:"Proverbs 16:3 · Luke 14:28",
    garden:"January garden planning: create a spring garden calendar (January–May). What will you plant, where, and when?",
    levels:{
      k2:{int:'Play Ubongo with teacher. After playing, draw one goal for the rest of the school year.',
          on:'Play Ubongo. Write one personal goal on a goal card: What is my goal? What do I need to do? How will I know I succeeded?',
          adv:'Play Ubongo. Set 2 goals — one academic, one personal. Write each using: I will ___ by ___ because ___.'},
      "35":{int:'Play Ubongo tournament with teacher guidance. Set 1 academic goal. Write it on a goal card.',
          on:'Play Ubongo tournament. Set 3 personal goals. Write a 4-step action plan for your most important goal.',
          adv:'Help organize the Ubongo tournament. Set SMART goals. Research: What is backward design planning?'},
      "68":{int:'Play and participate in tournament. Set goals for the semester. Write a goal card.',
          on:'Play competitive rounds. Set 3 SMART goals. Create a 4-week action plan. Present to a partner.',
          adv:'Lead the tournament structure. Research backward design planning. Plan a personal STEAM project for second semester.'},
      "912":{int:'Participate in tournament. Set semester goals and create a study plan for SAT/ACT prep.',
           on:'Lead a tournament bracket. Set semester goals including SAT/ACT target score. Build a weekly study schedule.',
           adv:'Run the full tournament. Write a personal academic roadmap — courses, SAT/ACT plan, college timeline, career direction.'}
    }
  },
  {
    month:"February", theme:"The Science of Healing",
    kit:"Thames & Kosmos: Human Body Lab / Biology Kits", kitUrl:"https://thamesandkosmos.com/collections/biology",
    chapel:"Body as a Temple · Health & Wellness · Emotional & Mental Health · Helping Others Heal",
    scripture:"1 Corinthians 6:19 · Proverbs 17:22",
    garden:"Research the nutritional value of one plant in the school garden. Create a Garden Nutrition Card.",
    levels:{
      k2:{int:'With teacher, label diagrams of the heart and lungs. Match each organ to what it does. Write: What is one way to take care of your heart?',
          on:'Use the kit to explore 2 body systems. Fill in a body system diagram. What does each system do?',
          adv:'Kit activities for 2 systems. Write a "Body Report Card" — grade how well you care for each system (A–F). Connect to 1 Corinthians 6:19.'},
      "35":{int:'Kit diagram activities for 2 body systems with teacher. Card sort: match organ to function. Write 2 sentences connecting body care to the Bible verse.',
          on:'Kit activities for 2 systems. Write a "Body System Report Card" — grade and explain using one fact from the kit manual.',
          adv:'Kit activities for 2 systems. Research a healthcare career. Write a 1-page career profile.'},
      "68":{int:'Kit activities with template. Research one body system. Write a structured summary with 3 facts and one health goal.',
          on:'Kit activities for 2 systems. Write a full body system report with personal health assessment and improvement goal.',
          adv:'Kit activities + choose one healthcare career. Write a 1-page evidence-based argument on physical, mental, and spiritual health.'},
      "912":{int:'Kit activities. Complete the body system report. Present one finding to class.',
           on:'Kit activities + career research. Write a 1-page "Healthcare Career Profile" and present.',
           adv:'Kit activities + career shadow plan. Write a 1-page plan for a healthcare career path with education timeline.'}
    }
  },
  {
    month:"March", theme:"Soar to New Heights",
    kit:"Thames & Kosmos: Aerospace / Engineering Kits", kitUrl:"https://thamesandkosmos.com/collections/engineering",
    chapel:"Soaring with God · Principles of Flight · Direction & Trust · Elevation & Purpose",
    scripture:"Isaiah 40:31 · Psalm 104:12",
    garden:"Spring planting begins! Plant the spring garden. Observe seed dispersal — how do seeds 'fly'? Sketch a maple seed's flight path.",
    levels:{
      k2:{int:'With teacher, fold and fly a basic paper glider. Identify the 4 forces of flight on a diagram. Draw your glider and label the forces.',
          on:'Build a glider from kit. Test it 3 times. Record distance each time. What happened differently each throw?',
          adv:'Build a glider. Test 2 wing positions. Record which flew farther. Connect to Isaiah 40:31.'},
      "35":{int:'Build kit glider with teacher. Identify the 4 forces. Test and record 3 distances.',
          on:'Build and test 2 wing configurations. Measure and record. Create a bar graph. Write: Which flew farthest and why?',
          adv:'Build and test 3+ configurations. Calculate average distance. Research the Wright Brothers. Compare your glider to the 1903 Flyer.'},
      "68":{int:'Build kit glider. Test 2 designs, record distances, write a comparison paragraph.',
          on:'Build and test 3 wing configurations. Full lab report using the 4 forces of flight. Connect to Isaiah 40:31.',
          adv:'Build 3+ designs. Calculate lift-to-drag ratio. Research computational aerodynamics. Write a 1-page analysis.'},
      "912":{int:'Build kit glider. Test 3 designs. Write a structured lab report with data table.',
           on:'Build and test designs. Full lab report with force analysis. Research an aviation or aerospace career.',
           adv:'Build and test with calculations. Research a specific aircraft. Present a 3-minute "Flight Briefing."'}
    }
  },
  {
    month:"April", theme:"Money Matters",
    kit:"Budget Bible Platform + iExcel Financial Modeling", kitUrl:"https://www.budgetbible.com",
    chapel:"Faithfulness in Finances · Planning & Budgeting · Saving vs. Spending · Stewardship & Giving",
    scripture:"Luke 16:10 · Proverbs 21:5",
    garden:"Calculate the full garden budget this year. Estimate the market value of produce grown. Is the garden 'profitable'?",
    levels:{
      k2:{int:'Sort coins and bills by type. Use play money to "buy" items. Discuss: Why do we need to save money?',
          on:'Sort coins and bills. Fill in a budget for $10 — giving, saving, spending. Discuss Luke 16:10.',
          adv:'Fill in a $20 budget — 10% give, 20% save, 70% spend. Draw a plan for what you would save for.'},
      "35":{int:'Fill in a printed budget template for $20. Categorize: needs, wants, giving, saving.',
          on:'Build a monthly budget for a scenario ($40/month babysitting). Allocate across give, save, spend.',
          adv:'Budget scenario with iExcel. Calculate compound interest on $100 at 5% for 5 years. Write: Why does starting to save young matter?'},
      "68":{int:'Build a personal monthly budget in iExcel. Categorize income and expenses.',
          on:'iExcel budget spreadsheet. Calculate compound interest for 10 years. Research Roth IRA vs. savings account.',
          adv:'Budget Bible Module 1. iExcel 12-month cash flow projection with formulas. Write a 1-page "Stewardship Plan."'},
      "912":{int:'Budget Bible onboarding. Build a personal budget. Present to a partner.',
           on:'Budget Bible Module 1. iExcel financial projection. Write about compound interest — starting at 18 vs. 28.',
           adv:'Budget Bible full plan. Build a 5-year financial projection in iExcel. Design a "giving portfolio."'}
    }
  },
  {
    month:"May", theme:"From Soil to System",
    kit:"School Garden + Thames & Kosmos Biology Lab Kit", kitUrl:"https://thamesandkosmos.com/collections/biology",
    chapel:"Stewardship of the Earth · Caring for Creation · Growth Takes Time · Harvest & Responsibility",
    scripture:"Genesis 2:15 · Psalm 24:1",
    garden:"HARVEST CELEBRATION — harvest the garden, wash and prepare vegetables, share a meal, thank God for the food.",
    levels:{
      k2:{int:'Test soil pH with teacher. Touch and describe 3 soil types. Draw the garden food web. Participate in the harvest.',
          on:'Test soil in 2 beds. Draw a food web from the organisms in the school garden. Review your observation journal.',
          adv:'Test soil in 3 beds. Create a comparison chart. Write: What did you learn? What surprised you? What would you plant differently?'},
      "35":{int:'Soil pH test with teacher. Draw a food web. Participate in harvest. Share one thing you learned.',
          on:'Soil test 2+ beds. Map the full garden ecosystem. Create a year-long growth timeline.',
          adv:'Full soil analysis with amendment recommendations. Write a complete garden science report. Present at harvest.'},
      "68":{int:'Soil test 2 beds. Write a garden ecosystem report. Participate in harvest presentation.',
          on:'Full soil analysis. Map garden ecosystem with 3+ interdependencies. Write: What does "you reap what you sow" mean in science AND life?',
          adv:'Full soil analysis + amendment proposal. Compare school garden to monoculture farm. Write a 1-page argument for biodiversity. Present to faculty.'},
      "912":{int:'Full soil analysis with structured report template. Present findings at harvest.',
           on:'Complete soil analysis. Full garden science report. Propose 3 improvements for next year.',
           adv:'Full "State of the Garden" presentation — data, ecosystem findings, expansion proposal, and budget estimate. STEAM capstone for 9–12.'}
    }
  }
];

type BandKey = "k2" | "35" | "68" | "912";
const BAND_MAP: Record<string, BandKey> = { "K-2": "k2", "3-5": "35", "6-8": "68", "9-12": "912" };

function expandForBand(band: string): SteamMonth[] {
  const key = BAND_MAP[band];
  if (!key) return [];
  return steamMonthsRaw.map((m) => {
    const lvl = m.levels[key];
    return {
      month: m.month,
      theme: m.theme,
      kit: m.kit,
      kitUrl: m.kitUrl,
      scripture: m.scripture,
      chapel: m.chapel,
      intervention: lvl.int,
      onLevel: lvl.on,
      advanced: lvl.adv,
      garden: m.garden,
    };
  });
}

export const STEAM_DATA: Record<string, SteamMonth[]> = {
  "K-2": expandForBand("K-2"),
  "3-5": expandForBand("3-5"),
  "6-8": expandForBand("6-8"),
  "9-12": expandForBand("9-12"),
};
