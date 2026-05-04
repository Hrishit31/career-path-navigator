"""
Career Path Navigator - Dataset Generator
Generates a synthetic labeled dataset for career prediction model training.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 1000  # number of samples

# Career labels and their typical profile ranges
CAREERS = [
    "Software Engineer",
    "Data Scientist",
    "Doctor",
    "Lawyer",
    "Graphic Designer",
    "Mechanical Engineer",
    "Teacher",
    "Accountant",
    "Psychologist",
    "Entrepreneur",
]

def generate_profile(career):
    """Generate a realistic user profile for a given career."""
    profiles = {
        "Software Engineer":     dict(math=np.random.randint(75,100), science=np.random.randint(65,95), english=np.random.randint(55,85), arts=np.random.randint(30,60), commerce=np.random.randint(40,70), coding_skill=np.random.randint(75,100), communication=np.random.randint(50,80), creativity=np.random.randint(40,75), analytical=np.random.randint(75,100), leadership=np.random.randint(40,75), interest_tech=np.random.randint(80,100), interest_science=np.random.randint(60,90), interest_arts=np.random.randint(20,50), interest_business=np.random.randint(30,65), stress_tolerance=np.random.randint(60,90)),
        "Data Scientist":        dict(math=np.random.randint(80,100), science=np.random.randint(70,95), english=np.random.randint(55,80), arts=np.random.randint(25,55), commerce=np.random.randint(40,70), coding_skill=np.random.randint(65,95), communication=np.random.randint(55,80), creativity=np.random.randint(50,80), analytical=np.random.randint(80,100), leadership=np.random.randint(40,70), interest_tech=np.random.randint(75,100), interest_science=np.random.randint(75,100), interest_arts=np.random.randint(20,45), interest_business=np.random.randint(35,65), stress_tolerance=np.random.randint(55,85)),
        "Doctor":                dict(math=np.random.randint(70,95), science=np.random.randint(85,100), english=np.random.randint(60,85), arts=np.random.randint(30,60), commerce=np.random.randint(30,60), coding_skill=np.random.randint(20,50), communication=np.random.randint(70,95), creativity=np.random.randint(40,70), analytical=np.random.randint(70,95), leadership=np.random.randint(60,90), interest_tech=np.random.randint(40,70), interest_science=np.random.randint(85,100), interest_arts=np.random.randint(20,50), interest_business=np.random.randint(25,55), stress_tolerance=np.random.randint(65,95)),
        "Lawyer":                dict(math=np.random.randint(55,80), science=np.random.randint(50,75), english=np.random.randint(80,100), arts=np.random.randint(40,70), commerce=np.random.randint(55,80), coding_skill=np.random.randint(15,45), communication=np.random.randint(80,100), creativity=np.random.randint(55,80), analytical=np.random.randint(70,95), leadership=np.random.randint(65,90), interest_tech=np.random.randint(25,55), interest_science=np.random.randint(30,60), interest_arts=np.random.randint(40,70), interest_business=np.random.randint(60,90), stress_tolerance=np.random.randint(60,90)),
        "Graphic Designer":      dict(math=np.random.randint(40,70), science=np.random.randint(35,65), english=np.random.randint(55,80), arts=np.random.randint(80,100), commerce=np.random.randint(35,65), coding_skill=np.random.randint(35,65), communication=np.random.randint(60,85), creativity=np.random.randint(85,100), analytical=np.random.randint(40,70), leadership=np.random.randint(40,70), interest_tech=np.random.randint(50,80), interest_science=np.random.randint(20,50), interest_arts=np.random.randint(85,100), interest_business=np.random.randint(35,65), stress_tolerance=np.random.randint(50,80)),
        "Mechanical Engineer":   dict(math=np.random.randint(75,100), science=np.random.randint(75,100), english=np.random.randint(50,75), arts=np.random.randint(30,60), commerce=np.random.randint(35,65), coding_skill=np.random.randint(45,75), communication=np.random.randint(50,75), creativity=np.random.randint(55,80), analytical=np.random.randint(75,100), leadership=np.random.randint(45,75), interest_tech=np.random.randint(80,100), interest_science=np.random.randint(75,100), interest_arts=np.random.randint(20,50), interest_business=np.random.randint(30,60), stress_tolerance=np.random.randint(55,85)),
        "Teacher":               dict(math=np.random.randint(60,85), science=np.random.randint(55,80), english=np.random.randint(75,100), arts=np.random.randint(50,80), commerce=np.random.randint(40,65), coding_skill=np.random.randint(20,50), communication=np.random.randint(80,100), creativity=np.random.randint(65,90), analytical=np.random.randint(55,80), leadership=np.random.randint(70,95), interest_tech=np.random.randint(30,60), interest_science=np.random.randint(45,75), interest_arts=np.random.randint(55,80), interest_business=np.random.randint(30,60), stress_tolerance=np.random.randint(55,85)),
        "Accountant":            dict(math=np.random.randint(80,100), science=np.random.randint(45,70), english=np.random.randint(60,85), arts=np.random.randint(25,55), commerce=np.random.randint(80,100), coding_skill=np.random.randint(30,60), communication=np.random.randint(55,80), creativity=np.random.randint(30,60), analytical=np.random.randint(75,100), leadership=np.random.randint(45,75), interest_tech=np.random.randint(35,65), interest_science=np.random.randint(30,60), interest_arts=np.random.randint(20,50), interest_business=np.random.randint(75,100), stress_tolerance=np.random.randint(55,85)),
        "Psychologist":          dict(math=np.random.randint(50,75), science=np.random.randint(55,80), english=np.random.randint(75,100), arts=np.random.randint(55,80), commerce=np.random.randint(35,65), coding_skill=np.random.randint(15,45), communication=np.random.randint(80,100), creativity=np.random.randint(60,85), analytical=np.random.randint(65,90), leadership=np.random.randint(60,85), interest_tech=np.random.randint(25,55), interest_science=np.random.randint(60,85), interest_arts=np.random.randint(55,80), interest_business=np.random.randint(30,60), stress_tolerance=np.random.randint(65,95)),
        "Entrepreneur":          dict(math=np.random.randint(60,85), science=np.random.randint(45,75), english=np.random.randint(65,90), arts=np.random.randint(45,75), commerce=np.random.randint(70,100), coding_skill=np.random.randint(40,70), communication=np.random.randint(75,100), creativity=np.random.randint(75,100), analytical=np.random.randint(65,90), leadership=np.random.randint(80,100), interest_tech=np.random.randint(55,85), interest_science=np.random.randint(35,65), interest_arts=np.random.randint(45,75), interest_business=np.random.randint(80,100), stress_tolerance=np.random.randint(65,95)),
    }
    return profiles[career]

rows = []
for _ in range(N):
    career = np.random.choice(CAREERS)
    profile = generate_profile(career)
    profile["career_label"] = career
    rows.append(profile)

df = pd.DataFrame(rows)

# Save to CSV
out_path = os.path.join(os.path.dirname(__file__), "career_dataset.csv")
df.to_csv(out_path, index=False)
print(f"Dataset saved: {out_path}  ({len(df)} rows)")
print(df["career_label"].value_counts())
