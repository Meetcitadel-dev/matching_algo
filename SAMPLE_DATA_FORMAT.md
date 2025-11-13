# Sample Data Format

## CSV Format

The CSV file should have the following columns:

```
name,phone,university,year,gender,instagram,city,course,spontaneous,personality_type,introvert_score,creative_score,college_life_score,social_score,family_importance,humor_importance,academic_importance,fitness,weekend_plan,music_vibe,college_vibe,relationship_status
```

### Example CSV Row:

```
Arjun Sharma,9876543210,IIT Delhi,Second,Male,arjun_sharma,Delhi,Computer Science,Yes,Funny,3,8,7,8,5,8,6,Yes,Partying,EDM,Chaos & fun,Single
```

### Column Descriptions:

- **name**: User's full name
- **phone**: Phone number
- **university**: College/University name
- **year**: First/Second/Third/Fourth
- **gender**: Male or Female
- **instagram**: Instagram handle (without @)
- **city**: City name
- **course**: Course/Field of study
- **spontaneous**: Yes/No - Do they enjoy spontaneous plans?
- **personality_type**: Smart or Funny
- **introvert_score**: 1-10 (1=extrovert, 10=introvert)
- **creative_score**: 1-10 rating of creativity
- **college_life_score**: 1-10 rating of college experience
- **social_score**: 1-10 (how much they enjoy going out with friends)
- **family_importance**: 1-10 (how important is family)
- **humor_importance**: 1-10 (how important is humor)
- **academic_importance**: 1-10 (how much academic success matters)
- **fitness**: Yes/No - Do they work out regularly?
- **weekend_plan**: One of: Partying, Chill in cafe, Long drives, Bed rotting, Binge watching
- **music_vibe**: One of: Bollywood, Indie, Rap, Lo-fi, EDM, Depends on mood
- **college_vibe**: One of: Hustle & grind, Chill & spontaneous, Balanced, Chaos & fun
- **relationship_status**: One of: Single, Committed, Not looking for anything

## JSON Format

Alternatively, provide a JSON array of profile objects:

```json
[
  {
    "name": "Arjun Sharma",
    "phone": "9876543210",
    "university": "IIT Delhi",
    "year": "Second",
    "gender": "Male",
    "instagram": "arjun_sharma",
    "city": "Delhi",
    "course": "Computer Science",
    "spontaneous_preference": true,
    "personality_type": "Funny",
    "introvert_score": 3,
    "creative_score": 8,
    "college_life_score": 7,
    "social_score": 8,
    "family_importance": 5,
    "humor_importance": 8,
    "academic_importance": 6,
    "fitness_active": true,
    "weekend_plan": "Partying",
    "music_vibe": "EDM",
    "college_vibe": "Chaos & fun",
    "relationship_status": "Single"
  }
]
```

## Weighting System

The algorithm uses these weightings for compatibility scoring:

- Spontaneous preference: 6x
- Smart/Funny personality: 2x
- Introvert score: 9x (HIGH PRIORITY)
- Creative score: 5x
- College life score: 9x (HIGH PRIORITY)
- Social score: 6x
- Family importance: 2x
- Humor importance: 4x
- Academic importance: 8x
- Fitness active: 8x
- Weekend plan: 8x
- Music vibe: 6x
- College vibe: 6x
- Relationship status: 10x (HIGHEST PRIORITY)

## Grouping Constraints

Each dinner group has these requirements:

- **Group Size**: 6 people
- **Gender**: 2-3 females, rest males
- **Personality**: Maximum 2 introverts per group (prioritizes extroverts)
- **Interests**: At least 2-3 people with shared interests
- **Diversity**: Prefers people from different colleges/years when possible

## Output

The system generates:
- Groups with 6 optimally matched people
- Compatibility scores for each group
- Key reasons why people were matched
- Detailed matching breakdown
- Export options (CSV/JSON)
