-- Add a unique constraint so ON CONFLICT DO NOTHING works reliably.
alter table steam_modules
  add constraint steam_modules_month_grade_band_key unique (month, grade_band);

insert into steam_modules (month, theme, grade_band, description) values
  -- November: Life Sciences & Health
  ('November', 'Life Sciences & Health', 'K-2', 'Explore the human body, healthy habits, and living things through hands-on activities'),
  ('November', 'Life Sciences & Health', '3-5', 'Investigate ecosystems, nutrition, and the systems of the human body'),
  ('November', 'Life Sciences & Health', '6-8', 'Study cell biology, disease prevention, and public health concepts'),
  ('November', 'Life Sciences & Health', '9-12', 'Analyze anatomy, physiology, and bioethics through lab-based inquiry'),

  -- December: Light, Sound & Energy
  ('December', 'Light, Sound & Energy', 'K-2', 'Discover how light and sound travel through simple experiments'),
  ('December', 'Light, Sound & Energy', '3-5', 'Investigate energy transfer, waves, and electrical circuits'),
  ('December', 'Light, Sound & Energy', '6-8', 'Explore electromagnetic spectrum, acoustics, and energy conservation'),
  ('December', 'Light, Sound & Energy', '9-12', 'Apply physics of waves, optics, and thermodynamics to real-world problems'),

  -- January: Coding & Computational Thinking
  ('January', 'Coding & Computational Thinking', 'K-2', 'Introduce sequencing, patterns, and basic coding with unplugged activities'),
  ('January', 'Coding & Computational Thinking', '3-5', 'Build block-based programs and practice algorithmic problem-solving'),
  ('January', 'Coding & Computational Thinking', '6-8', 'Learn text-based programming fundamentals and data structures'),
  ('January', 'Coding & Computational Thinking', '9-12', 'Develop software projects using Python or JavaScript with version control'),

  -- February: Invention & Innovation
  ('February', 'Invention & Innovation', 'K-2', 'Design and build simple inventions that solve everyday problems'),
  ('February', 'Invention & Innovation', '3-5', 'Research inventors and prototype a solution to a community need'),
  ('February', 'Invention & Innovation', '6-8', 'Apply the engineering design process to create and pitch an original invention'),
  ('February', 'Invention & Innovation', '9-12', 'Develop a market-ready prototype with business plan and patent research'),

  -- March: Environmental Science & Sustainability
  ('March', 'Environmental Science & Sustainability', 'K-2', 'Learn about recycling, conservation, and caring for God''s creation'),
  ('March', 'Environmental Science & Sustainability', '3-5', 'Study water cycles, ecosystems, and local environmental stewardship'),
  ('March', 'Environmental Science & Sustainability', '6-8', 'Analyze climate data, renewable energy, and sustainability practices'),
  ('March', 'Environmental Science & Sustainability', '9-12', 'Conduct environmental impact assessments and design sustainability solutions'),

  -- April: Robotics & Automation
  ('April', 'Robotics & Automation', 'K-2', 'Program simple robots to follow paths and complete basic tasks'),
  ('April', 'Robotics & Automation', '3-5', 'Build and program robots with sensors to navigate challenges'),
  ('April', 'Robotics & Automation', '6-8', 'Design autonomous robots and explore industrial automation concepts'),
  ('April', 'Robotics & Automation', '9-12', 'Engineer advanced robotic systems with sensor fusion and control algorithms'),

  -- May: Capstone Projects & Presentations
  ('May', 'Capstone Projects & Presentations', 'K-2', 'Present a favorite STEAM project from the year to classmates and families'),
  ('May', 'Capstone Projects & Presentations', '3-5', 'Complete a cross-disciplinary capstone project with a public presentation'),
  ('May', 'Capstone Projects & Presentations', '6-8', 'Design and defend a semester capstone integrating multiple STEAM disciplines'),
  ('May', 'Capstone Projects & Presentations', '9-12', 'Deliver a portfolio-quality capstone with research paper and public defense'),

  -- June: Summer STEAM Enrichment
  ('June', 'Summer STEAM Enrichment', 'K-2', 'Optional summer exploration of nature, art, and simple machines'),
  ('June', 'Summer STEAM Enrichment', '3-5', 'Optional summer workshops in coding, gardening, or maker projects'),
  ('June', 'Summer STEAM Enrichment', '6-8', 'Optional summer intensive in drone piloting, 3D printing, or app development'),
  ('June', 'Summer STEAM Enrichment', '9-12', 'Optional summer internship prep, research project, or certification course'),

  -- July: Summer STEAM Enrichment
  ('July', 'Summer STEAM Enrichment', 'K-2', 'Optional summer exploration of nature, art, and simple machines'),
  ('July', 'Summer STEAM Enrichment', '3-5', 'Optional summer workshops in coding, gardening, or maker projects'),
  ('July', 'Summer STEAM Enrichment', '6-8', 'Optional summer intensive in drone piloting, 3D printing, or app development'),
  ('July', 'Summer STEAM Enrichment', '9-12', 'Optional summer internship prep, research project, or certification course'),

  -- August: STEAM Orientation & Goal Setting
  ('August', 'STEAM Orientation & Goal Setting', 'K-2', 'Welcome activities introducing the year''s STEAM themes and expectations'),
  ('August', 'STEAM Orientation & Goal Setting', '3-5', 'Set personal STEAM goals and preview the year''s monthly themes'),
  ('August', 'STEAM Orientation & Goal Setting', '6-8', 'Orientation workshop covering STEAM pathways, tools, and goal setting'),
  ('August', 'STEAM Orientation & Goal Setting', '9-12', 'STEAM portfolio kickoff with career exploration and pathway planning')
on conflict (month, grade_band) do nothing;
