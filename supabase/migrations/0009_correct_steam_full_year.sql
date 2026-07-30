-- Migration 0007 seeded placeholder STEAM themes that don't match the
-- client's actual Thames & Kosmos curriculum (the real themes/kits live in
-- app/placement/steam-data.ts, used by the Placement Guide page). This
-- replaces the steam_modules seed data with the correct 10-month (Aug-May)
-- school-year curriculum so Student Detail's STEAM recommendations pull the
-- right modules too.
--
-- Safe to wipe: no student_steam_assignments exist yet (all test data was
-- cleared before client launch), and the cascade delete confirms that.
delete from steam_modules;

insert into steam_modules (month, theme, grade_band, description) values
  -- August: Designed with Purpose (Genetics & DNA 2.0)
  ('August', 'Designed with Purpose', 'K-2', 'Explore what DNA is and how it shapes living things through the Genetics & DNA 2.0 kit'),
  ('August', 'Designed with Purpose', '3-5', 'Extract DNA from a tomato and explore inheritance and chromosomes with the Genetics & DNA 2.0 kit'),
  ('August', 'Designed with Purpose', '6-8', 'Extract DNA, play the inheritance game, and assemble a double helix model'),
  ('August', 'Designed with Purpose', '9-12', 'Full genetics lab sequence including DNA fingerprinting, plus research on CRISPR and bioethics'),

  -- September: Think Like a Scientist (Forces & Interactions)
  ('September', 'Think Like a Scientist', 'K-2', 'Build a balance beam and test how weight and position affect balance'),
  ('September', 'Think Like a Scientist', '3-5', 'Investigate variables and record data using the Forces & Interactions kit'),
  ('September', 'Think Like a Scientist', '6-8', 'Build and test gliders, comparing designs using the four forces of flight'),
  ('September', 'Think Like a Scientist', '9-12', 'Run structured experiments with error analysis and design an original test using the kit'),

  -- October: Build It. Test It. Improve It. (Forces & Interactions, Activities 5-8)
  ('October', 'Build It. Test It. Improve It.', 'K-2', 'Build a tower, test its limits, and redesign after it fails'),
  ('October', 'Build It. Test It. Improve It.', '3-5', 'Load-test structures and apply engineering principles through iteration'),
  ('October', 'Build It. Test It. Improve It.', '6-8', 'Apply the 5-step engineering design process to a class bridge challenge'),
  ('October', 'Build It. Test It. Improve It.', '9-12', 'Full engineering design report with iteration cycles and load-to-weight calculations'),

  -- November: Design. Code. Move. (Robotics Workshop with micro:bit)
  ('November', 'Design. Code. Move.', 'K-2', 'Build and run a simple robot using step-by-step instructions'),
  ('November', 'Design. Code. Move.', '3-5', 'Program a robot with MakeCode loops and conditionals'),
  ('November', 'Design. Code. Move.', '6-8', 'Build multiple robots and translate block code into Python'),
  ('November', 'Design. Code. Move.', '9-12', 'Build and program robots in Python, with a career research paper on robotics applications'),

  -- December: Making a Difference (Renewable Energy Kits)
  ('December', 'Making a Difference', 'K-2', 'Build a solar-powered model and explore how solar energy works'),
  ('December', 'Making a Difference', '3-5', 'Test and compare renewable energy models and propose a community solution'),
  ('December', 'Making a Difference', '6-8', 'Build multiple renewable energy models and design a solution for a community need'),
  ('December', 'Making a Difference', '9-12', 'Research and present a full renewable energy plan for the school'),

  -- January: Think. Plan. Achieve. (Ubongo Puzzle Game)
  ('January', 'Think. Plan. Achieve.', 'K-2', 'Play Ubongo and set a personal goal for the rest of the school year'),
  ('January', 'Think. Plan. Achieve.', '3-5', 'Play in a tournament and write a step-by-step action plan for a goal'),
  ('January', 'Think. Plan. Achieve.', '6-8', 'Set SMART goals and build a 4-week action plan'),
  ('January', 'Think. Plan. Achieve.', '9-12', 'Build a personal academic roadmap including SAT/ACT and college planning'),

  -- February: The Science of Healing (Human Body Lab / Biology Kits)
  ('February', 'The Science of Healing', 'K-2', 'Learn about the heart and lungs and one way to care for the body'),
  ('February', 'The Science of Healing', '3-5', 'Explore two body systems and write a body system report card'),
  ('February', 'The Science of Healing', '6-8', 'Research a body system and healthcare career, writing a personal health goal'),
  ('February', 'The Science of Healing', '9-12', 'Research a healthcare career and evaluate physical, mental, and spiritual health'),

  -- March: Soar to New Heights (Aerospace / Engineering Kits)
  ('March', 'Soar to New Heights', 'K-2', 'Build and fly a paper glider and identify the four forces of flight'),
  ('March', 'Soar to New Heights', '3-5', 'Test multiple glider wing configurations and graph the results'),
  ('March', 'Soar to New Heights', '6-8', 'Build and test gliders, calculating lift-to-drag ratios'),
  ('March', 'Soar to New Heights', '9-12', 'Research an aircraft and present a flight briefing with performance calculations'),

  -- April: Money Matters (Budget Bible + iExcel Financial Modeling)
  ('April', 'Money Matters', 'K-2', 'Sort coins and bills and build a simple give/save/spend budget'),
  ('April', 'Money Matters', '3-5', 'Build a monthly budget scenario and calculate simple compound interest'),
  ('April', 'Money Matters', '6-8', 'Build a personal budget and calculate compound interest over 10 years'),
  ('April', 'Money Matters', '9-12', 'Build a multi-year financial projection and a personal stewardship plan'),

  -- May: From Soil to System (School Garden + Biology Lab Kit)
  ('May', 'From Soil to System', 'K-2', 'Test soil types, draw the garden food web, and take part in the harvest'),
  ('May', 'From Soil to System', '3-5', 'Map the garden ecosystem and build a year-long growth timeline'),
  ('May', 'From Soil to System', '6-8', 'Analyze soil and garden biodiversity, presenting findings at the harvest'),
  ('May', 'From Soil to System', '9-12', 'Deliver a "State of the Garden" capstone presentation with data and an expansion proposal')
on conflict (month, grade_band) do nothing;
