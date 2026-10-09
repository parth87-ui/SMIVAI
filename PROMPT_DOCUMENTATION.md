# SMIVAI — Prompt Documentation

**Project:** SMIVAI — Care Closer to You · AI-based cognitive gaming and memory assistance platform for elderly people in the North Eastern Region  
**Documented:** 10 October 2026

## About this document
git push origin main
This file records the prompts given to the AI coding assistant (Claude Code) that built and improved SMIVAI, in chronological order, grouped by development phase.

- **Source.** Every prompt below is copied **verbatim** from the locally stored Claude Code session transcripts for this project (three sessions, 25 Aug – 10 Oct 2026). Spelling, grammar and capitalisation are left exactly as written.
- **Original vs. reconstructed.** Every prompt in this document is **Original (verbatim)**. **No prompt has been reconstructed or invented.** The *Purpose* lines are short summaries written by the documenter and are not part of the prompts.
- **Unavailable history.** (1) Screenshots and images attached to some prompts are not stored as text; those prompts are marked *screenshot attached*. (2) Two attachments referenced in 2.1 (a Markdown file and a ZIP archive) are not in the accessible history. (3) Work done outside these sessions (other tools, manual edits, earlier chats) is not recorded here. (4) Wrapper tags added by the tool around pasted text have been removed; the pasted text itself is unchanged.
- **Session-control messages** such as "continue" and "Try again", and automatic system notifications, are listed in Appendix A for completeness.

## Contents

1. [Phase 1 — Initial prototype build](#1-phase-1--initial-prototype-build)
2. [Phase 2 — Northeast UI redesign](#2-phase-2--northeast-ui-redesign)
3. [Phase 3 — Complete product and UI/UX implementation](#3-phase-3--complete-product-and-uiux-implementation)
4. [Phase 4 — UI/UX refinement iterations](#4-phase-4--uiux-refinement-iterations)
5. [Phase 5 — Adaptive engine (Rasch model) and game progression](#5-phase-5--adaptive-engine-rasch-model-and-game-progression)
6. [Phase 6 — SIH 2026 full product development brief](#6-phase-6--sih-2026-full-product-development-brief)
7. [Phase 7 — Code analysis and product improvement (local, no deployment)](#7-phase-7--code-analysis-and-product-improvement-local-no-deployment)
8. [Phase 8 — HUN, Facts, doctor sorting, Rasch, charity, donor and payments](#8-phase-8--hun-facts-doctor-sorting-rasch-charity-donor-and-payments)
9. [Phase 9 — Bug reports, local server and repository preparation](#9-phase-9--bug-reports-local-server-and-repository-preparation)
10. [Appendix A — Session-control messages](#appendix-a--session-control-messages)


---

## 1. Phase 1 — Initial prototype build

### 1.1 Master build prompt: SMIVAI cognitive gaming and memory assistance prototype

- **Purpose:** Defines the complete SIH 2026 prototype: product vision, elderly-first design, patient/caregiver/doctor roles, cognitive games, memory assistance, reminders, AI companion and North Eastern Region focus.
- **Status:** Original (verbatim)
- **Source:** Session A (25 Aug - 19 Sep 2026) · 2026-08-25

~~~~text
Build a complete, polished, fully functional prototype called:

SMIVAI

FULL PROJECT NAME:
AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER)


============================================================
0. MOST IMPORTANT INSTRUCTION
============================================================

BUILD THE COMPLETE APPLICATION IN ONE GO.

Do NOT create a partial mockup.
Do NOT create disconnected demo pages.
Do NOT leave important features as "Coming Soon".
Do NOT ask me to provide features one by one.
Do NOT rebuild the same feature multiple times.
Do NOT use placeholder lorem ipsum content.

Build a coherent application where Patient, Caregiver and Doctor experiences use the SAME underlying patient data.

Prioritize:
1. Working functionality
2. Elderly accessibility
3. Clean premium UI
4. Meaningful cognitive activities
5. Patient → Caregiver → Doctor data flow
6. Adaptive difficulty
7. Offline-first behavior
8. Reliable demo experience

This is a prototype for a hackathon, not a production medical system.

============================================================
1. PRODUCT PURPOSE
============================================================

SMIVAI is an AI-assisted cognitive gaming and memory assistance platform designed for elderly users, particularly elderly users in the North-Eastern Region of India.

The platform should provide:

• Cognitive stimulation activities
• Memory assistance
• Personalised activity difficulty
• Daily reminders
• Voice assistance
• Familiar/local content
• Offline-first functionality
• Caregiver monitoring
• Doctor insights
• Activity-performance tracking

IMPORTANT MEDICAL POSITIONING:

SMIVAI is NOT a medical diagnosis system.

It must NEVER claim:

• dementia diagnosis
• dementia detection
• dementia severity
• dementia cure
• dementia treatment
• guaranteed cognitive improvement
• replacement of doctors

Use terminology such as:

• Cognitive Activity
• Cognitive Performance
• Activity Score
• Performance Trend
• Personalised Difficulty
• Caregiver Insight
• Activity Monitoring

Include a small disclaimer where appropriate:

"SMIVAI provides cognitive activity and performance insights. It does not replace professional medical diagnosis."

============================================================
2. DESIGN PHILOSOPHY
============================================================

The application must be:

• Extremely simple
• Elderly-friendly
• Comfortable
• Premium
• Calm
• Trustworthy
• Human
• Accessible
• Modern without looking futuristic
• Healthcare-oriented without looking like a hospital management system

The patient interface is the highest design priority.

Think:

"Premium wellness application designed for elderly users."

Do NOT make it look like:

• a generic AI dashboard
• a cryptocurrency dashboard
• a gaming leaderboard
• a hospital administration system
• an overly futuristic AI interface
• an AI-generated template

Avoid:

• excessive gradients
• glassmorphism
• neon colors
• excessive animations
• tiny icons
• tiny text
• crowded dashboards
• unnecessary decorative elements
• excessive shadows
• complicated menus

Premium feeling must come from:

• whitespace
• typography
• consistency
• spacing
• hierarchy
• subtle shadows
• restrained colors

============================================================
3. OFFICIAL SMIVAI COLOR PALETTE
============================================================

Use this exact palette consistently throughout the application.

PRIMARY BACKGROUND:
Warm Ivory
#F8F6F0

PRIMARY BRAND:
Deep Forest Green
#2F6F59

DARK PRIMARY:
#245744

LIGHT GREEN:
Soft Sage
#DDEBE4

CARD:
White
#FFFFFF

PRIMARY TEXT:
Charcoal
#27332E

SECONDARY TEXT:
Muted Grey-Green
#68756F

ACCENT:
Soft Amber
#E7A45B

SUCCESS:
#3E8066

WARNING:
#D98B38

ERROR:
Muted Coral
#C96B62

DIVIDER:
Soft Beige
#E5DED3

IMPORTANT COLOR RULE:

Do not introduce random colors.

Use the green palette for primary actions and branding.

Use amber/orange for reminders and attention.

Use muted coral only for genuine errors or important missed items.

Do not use bright red for normal mistakes in cognitive games.

============================================================
4. TYPOGRAPHY
============================================================

Use a highly readable modern font.

Preferred:
Nunito Sans

Fallback:
Inter

PATIENT MODE:

Main heading:
32–36px

Section heading:
24–28px

Card title:
21–24px

Body:
18–20px

Secondary text:
16–18px

Button text:
18–20px

CAREgiver/DOCTOR:

Can use slightly smaller text where necessary, but maintain readability.

Never make important patient information tiny.

============================================================
5. ACCESSIBILITY RULES
============================================================

These are HARD requirements.

Patient mode:

• Minimum touch target: 60–64px
• Prefer 64–72px buttons
• Large text
• High contrast
• Large icons
• Large images
• Generous spacing
• Clear labels
• One primary action per screen
• Simple navigation
• No confusing gestures
• No tiny controls
• No tiny checkboxes
• No stressful countdown timers

Every important action should have both:
ICON + TEXT

Do not rely on icons alone.

============================================================
6. APP STRUCTURE
============================================================

Create three user roles:

PATIENT
CAREGIVER
DOCTOR

Landing screen:

SMIVAI

"Smart Cognitive Support for Everyday Life"

Supporting text:

"Personalised cognitive activities and memory assistance for elderly users."

Then three large role cards:

👴 PATIENT
"Activities & memories"

👥 CAREGIVER
"Support a loved one"

👨‍⚕️ DOCTOR
"View patient insights"

============================================================
7. PATIENT EXPERIENCE
============================================================

Patient mode must be the simplest interface.

Patient bottom navigation:

🏠 Home
🧠 Play & Practice
🔔 Reminders
❤️ Memories

Do not add complicated navigation.

============================================================
8. PATIENT HOME
============================================================

Show:

Good Morning, [Patient Name]

"Let's do a little activity today."

Today's Progress:

3 / 4 activities completed

Then large cards:

🧠 Continue Today's Activity

🔔 Next Reminder

❤️ My Memories

Also show a subtle connectivity indicator:

🟢 Online

or

🟠 Offline — Your progress is saved

Do not overwhelm the patient with analytics.

The patient should NOT see technical information such as:

• Rasch parameters
• response latency
• database status
• API status
• medical terminology

============================================================
9. PLAY & PRACTICE
============================================================

DO NOT make SMIVAI a single-game application.

Create a dedicated:

"PLAY & PRACTICE"

section.

Subtitle:

"Choose an activity and take your time."

Provide SIX cognitive-support activities.

1. Picture Matching
2. Memory Pairs
3. Picture Bingo
4. Category Sorting
5. Simple Jigsaw
6. My Memories

Each activity must be accessible through a large card with:

• large icon
• large title
• short description
• large START button

============================================================
10. GAME 1 — PICTURE MATCHING
============================================================

Purpose:
Visual recognition and attention.

Gameplay:

Show familiar pictures.

Ask the patient to match identical or related pictures.

Examples:

• Food
• Fruits
• Household objects
• Clothing
• Plants
• Familiar local objects

Difficulty:

EASY:
3 pairs

MEDIUM:
5 pairs

HARD:
7 pairs

Track:

• accuracy
• mistakes
• attempts
• response time
• score
• difficulty
• completion
• timestamp

No countdown timer.

Feedback:

Correct:
"Good job!"

Incorrect:
"That's okay. Let's try again."

============================================================
11. GAME 2 — MEMORY PAIRS
============================================================

Purpose:

Short-term memory and recall.

Gameplay:

Show cards briefly.

Hide them.

Patient finds matching pairs.

Difficulty increases through:

• number of cards
• number of pairs
• similarity of images

Track:

• accuracy
• mistakes
• attempts
• response time
• score
• difficulty
• completion

Use supportive feedback.

============================================================
12. GAME 3 — PICTURE BINGO
============================================================

Purpose:

Visual recognition, attention and simple interaction.

Create a simple picture grid.

The application asks:

"Can you find the cup?"

Patient taps the matching picture.

Use familiar objects.

Keep it non-competitive.

Do not create a stressful timer.

Difficulty can increase through:

• number of objects
• similarity between objects
• grid size

Track performance.

============================================================
13. GAME 4 — CATEGORY SORTING
============================================================

Purpose:

Thinking, memory and language association.

Patient sorts familiar objects into categories.

Example:

FOOD
CLOTHES
HOUSEHOLD

Show objects:

🍎
👕
☕
🍚
👞
🥄

Patient places them in the correct category.

Difficulty:

Easy:
2 categories

Medium:
3 categories

Hard:
4 categories

Increase complexity gradually.

Track:

• accuracy
• mistakes
• attempts
• response time
• difficulty
• completion

============================================================
14. GAME 5 — SIMPLE JIGSAW
============================================================

Purpose:

Visual processing and simple problem solving.

Use familiar images.

Difficulty:

Easy:
4 large pieces

Medium:
6 pieces

Hard:
9 pieces

Pieces must remain large enough for elderly users.

Do not make the puzzle frustrating.

Use supportive feedback.

============================================================
15. GAME 6 — MY MEMORIES
============================================================

This is one of SMIVAI's signature features.

Connect it directly to the patient's Memory Bank.

The caregiver can store:

• family members
• favourite foods
• important places
• favourite music
• daily routines
• familiar objects
• personal memories

Example:

Memory Bank:

Favourite food:
Momos

Family:
Rahul — Son

Important place:
Home Village

The activity can ask:

"What is Ramesh's favourite food?"

Options:

Momos
Apple
Rice

Another:

"Who is Rahul?"

Options:

Son
Doctor
Friend

Only use the selected patient's own Memory Bank.

Never expose one patient's memories to another patient.

============================================================
16. THREE LEVELS OF CONTENT
============================================================

Where practical, games should support:

LEVEL 1:
General familiar content

LEVEL 2:
NER/local familiar content

LEVEL 3:
Patient-personalised content

NER content may include:

• familiar foods
• household objects
• plants
• traditional clothing
• everyday surroundings
• familiar cultural situations

Do not stereotype the region.

Make content expandable.

============================================================
17. DAILY PERSONALIZED SESSION
============================================================

Do NOT require the patient to play all six activities.

Create a short personalized daily session.

Example:

TODAY'S SESSION

🧠 Memory Pairs — about 3 min

🗂️ Category Sorting — about 3 min

❤️ My Memories — about 2 min

Total:
"About 8 minutes"

Choose 2–3 activities based on recent performance.

The patient can still manually choose another activity from Play & Practice.

============================================================
18. ADAPTIVE DIFFICULTY / RASCH CONCEPT
============================================================

SMIVAI uses an adaptive difficulty approach based on the Rasch / Item Response Theory concept.

Do not expose technical mathematics to the patient.

Each activity has:

Easy
Medium
Hard

The system considers:

• accuracy
• response time
• mistakes
• attempts
• previous performance
• current difficulty

Example:

Good performance:
Easy → Medium

Very good performance:
Medium → Hard

Struggling:
Hard → Medium

Repeated difficulty:
Medium → Easy

Show a friendly message:

"We adjusted your next activity to your level."

The system must actually change the next activity's difficulty.

Do not simply display fake text saying difficulty changed.

============================================================
19. COGNITIVE ACTIVITY SCORE
============================================================

Create:

COGNITIVE ACTIVITY SCORE

This is NOT a medical score.

Example:

76 / 100

Calculate it from:

• accuracy
• response time
• mistakes
• completion
• recent activity performance

Show trend:

↑ Improving

→ Stable

↓ Lower than recent average

Do not call it:

• Dementia Score
• Dementia Severity
• Medical Score

============================================================
20. PATIENT FEEDBACK
============================================================

Never use:

WRONG!
FAILED!
GAME OVER!
TRY HARDER!

Use:

"Good effort!"

"That's okay. Let's try again."

"Take your time."

"Let's try another one."

"Well done!"

"You're doing great."

No stressful timers.

============================================================
21. VOICE SUPPORT
============================================================

Provide a visible:

🔊 LISTEN

button on patient activity instructions.

Example:

"Match the two similar pictures."

"Put these activities in the correct order."

Architecture should support:

Bhashini / AI4Bharat

Languages where practical:

• English
• Assamese
• Bodo
• Manipuri

For unsupported speech languages, use:

• recorded native-speaker prompts
• text/tap fallback

Do not fake unsupported AI voice functionality.

============================================================
22. REMINDER SYSTEM
============================================================

Create a complete reminder system shared by:

Patient
Caregiver
Doctor

Patient can VIEW reminders.

Caregiver and Doctor can CREATE and MANAGE reminders for the selected patient.

Reminder fields:

• reminder_id
• patient_id
• title
• description
• category
• date
• time
• repeat
• priority
• status
• created_by_role
• created_by_id
• voice_enabled

Categories:

💊 Medicine
💧 Hydration
🍽️ Meal
🧠 Cognitive Activity
🚶 Activity / Exercise
👨‍⚕️ Appointment
😴 Rest
📝 Custom

Allow:

• Once
• Daily
• Weekdays
• Weekly
• Custom days

Allow:

• Create
• Edit
• Delete
• Pause
• Resume

============================================================
23. CAREGIVER REMINDERS
============================================================

Caregiver dashboard should contain:

REMINDER MANAGEMENT

Button:

+ ADD REMINDER

Example:

Patient:
Ramesh Das

Reminder:
Drink Water

Time:
10:30 AM

Repeat:
Every Day

Priority:
Normal

Voice:
ON

Create Reminder.

The reminder must immediately appear in Ramesh's Patient Reminders.

============================================================
24. DOCTOR REMINDERS
============================================================

Doctor can select a patient and create reminders.

Examples:

• Appointment
• Follow-up
• Cognitive activity
• Existing medication/care-plan reminder
• General care instruction

IMPORTANT:

Do not make the application look like it is prescribing medicine.

The doctor is creating a reminder based on an existing care plan/instruction.

============================================================
25. REMINDER STATUS
============================================================

Statuses:

Upcoming
Completed
Missed
Skipped

Patient sees:

💊 TAKE MEDICINE
8:00 AM

[ DONE ]

Caregiver sees:

✓ Completed

Doctor sees appropriate activity/reminder status.

Missed reminder example:

⚠ Medicine reminder missed

Do NOT automatically interpret this as medical deterioration.

============================================================
26. VOICE REMINDERS
============================================================

Allow:

🔊 Voice Reminder ON

Example:

"Ramesh, it is time to take your medicine."

Use simple language.

============================================================
27. REMINDER INSIGHTS
============================================================

Caregiver:

Today's reminders:
4

Completed:
3

Missed:
1

Completion:
75%

Doctor:

Reminder adherence:
85%

Recent missed reminders:
2

Keep reminder adherence separate from Cognitive Activity Score.

============================================================
28. SMART REMINDER SUGGESTIONS
============================================================

Show optional suggestions to caregivers/doctors:

💧 Drink water
🧠 Cognitive activity
🍽️ Breakfast
🚶 Evening walk
😴 Rest
📞 Call family

The user must explicitly press:

+ Add

before the reminder is created.

Never automatically create reminders.

============================================================
29. MEMORY BANK
============================================================

Create:

❤️ MY MEMORIES

Patient sees a simple read-only version.

Caregiver can:

• Add
• Edit
• Delete

Categories:

👨‍👩‍👧 Family
🍲 Favourite Food
🏡 Important Places
🎵 Favourite Music
📅 Daily Routine
❤️ Personal Memories
🧺 Familiar Objects

Example:

Rahul
Son

Momos
Favourite food

Village
Important place

Use Memory Bank data inside My Memories activities.

============================================================
30. DAILY ROUTINE
============================================================

Create a simple daily routine/timeline.

Example:

7:00 AM
Wake Up

8:00 AM
Breakfast

8:30 AM
Medicine

10:00 AM
Cognitive Activity

5:00 PM
Walk

The patient should see a very simple timeline.

Caregiver can manage relevant routine reminders.

============================================================
31. CAREGIVER DASHBOARD
============================================================

Create a complete Caregiver dashboard.

Sections:

1. Patient Overview
2. Today's Activity
3. Cognitive Game Performance
4. Reminder Management
5. Memory Bank
6. Alerts
7. Activity History

Caregiver can:

• Select patient
• Add patient
• View profile
• View activities
• View performance
• Create reminders
• Manage Memory Bank
• View alerts
• View activity history

============================================================
32. PATIENT OVERVIEW
============================================================

Example:

Ramesh Das
Age: 72
Language: Assamese

Today's Progress:
3 / 4

Cognitive Activity Score:
76 / 100

Recent Trend:
Stable

Activities:

Memory Pairs — 82%
Category Sorting — 74%
Picture Matching — 79%

Keep it clean.

============================================================
33. CAREGIVER ACTIVITY MONITORING
============================================================

Show:

Completed
Pending
Missed

Example:

✓ Memory Pairs
✓ Drink Water
○ Category Sorting
⚠ Medicine Reminder

============================================================
34. CAREGIVER GAME PERFORMANCE
============================================================

Show:

• Games played
• Accuracy
• Average response time
• Mistakes
• Difficulty
• Recent scores
• Performance trend

Use simple charts.

Do not overload the dashboard.

============================================================
35. CAREGIVER ALERT CENTER
============================================================

Create:

🔔 NEEDS ATTENTION

Examples:

"Ramesh missed his morning activity."

"Recent activity performance is lower than his recent average."

"2 reminders were missed today."

Use neutral language.

Never say:

"Dementia is worsening."

Instead:

"Recent activity performance has decreased."

"Consider checking in with the patient."

============================================================
36. CARE NOTES
============================================================

Add optional Care Notes.

Caregiver can record:

"Patient seemed tired today."

"Enjoyed the memory activity."

"Had difficulty with today's routine."

Doctor can view appropriate notes.

Keep this as observational notes, not diagnosis.

============================================================
37. MOOD CHECK-IN
============================================================

Add a very simple optional patient feature:

"How are you feeling today?"

😊 Good

😐 Okay

😔 Not good

Store the response.

Caregiver can see recent mood entries.

Do not turn mood into a medical diagnosis.

============================================================
38. FAMILY CONTACT
============================================================

Allow caregiver to store emergency/family contacts.

Example:

Rahul
Son

[ CALL ]

Patient can see:

❤️ Call Family

Keep this simple.

============================================================
39. DOCTOR DASHBOARD
============================================================

Create a professional Doctor dashboard.

Doctor can:

• Select patient
• View patient overview
• View cognitive activity trend
• View game performance
• View activity completion
• View reminder adherence
• View care notes
• View alerts
• View history

Show:

Cognitive Activity Score
Accuracy
Response Time
Activity Completion
Performance Trend
Game History
Reminder Adherence

Use clean charts.

Do NOT show a medical diagnosis.

============================================================
40. DOCTOR INSIGHTS
============================================================

Use neutral wording:

"Recent activity performance"

"Performance trend"

"Change from recent average"

"Activity completion"

"Reminder adherence"

"Consider reviewing recent activity."

Never:

"Dementia detected."

"Dementia progression."

============================================================
41. PATIENT MANAGEMENT
============================================================

Use unique:

patient_id

Create fictional demo patients:

Ramesh Das
Age 72
Language Assamese

Anjali Devi
Age 68
Language Manipuri

Bimal Singh
Age 75
Language Bodo

Use fictional information only.

Every patient's:

• games
• scores
• reminders
• memories
• mood
• notes
• history

must remain separate.

Switching patient must update ALL information.

============================================================
42. OFFLINE-FIRST SYSTEM
============================================================

SMIVAI must be designed around poor connectivity.

When offline:

• Patient can play games
• Patient can view reminders
• Patient can view Memory Bank
• Game sessions are saved locally
• Progress remains available
• Reminder status can be updated

Show:

🟠 Offline — Your progress is saved

When connection returns:

"Connection restored."

"Syncing your data..."

"All data synced."

============================================================
43. SYNC ENGINE
============================================================

Implement a clean sync layer.

Concept:

LOCAL DATA
↓
PENDING SYNC QUEUE
↓
INTERNET AVAILABLE
↓
FASTAPI
↓
POSTGRESQL
↓
SYNCED

Show a small sync status:

Pending:
2 records

Syncing...

Synced:
2

Status:
Up to date

If true cloud synchronization cannot be reliably implemented in the development environment, create a realistic local simulation while keeping the architecture modular.

Do not sacrifice the working app for unnecessary backend complexity.

============================================================
44. LOCAL DATABASE
============================================================

Preferred local architecture:

SQLite

Store:

• patients
• game sessions
• reminders
• memory bank
• cognitive activity scores
• mood
• care notes
• pending sync records

If the Replit environment is primarily web-based, use an appropriate local persistence layer while keeping the code modular for SQLite/mobile deployment later.

============================================================
45. SECURITY
============================================================

Treat patient information as sensitive.

Use:

• patient_id separation
• role-based access
• secure API structure
• protected local storage where supported

The intended architecture can use AES-256 encryption for sensitive local data.

Do not falsely claim encryption if it is not actually implemented.

Use:

Patient:
Own data

Caregiver:
Assigned patient data

Doctor:
Assigned patient analytics

============================================================
46. BACKEND
============================================================

Preferred architecture:

Frontend:
React / Next.js / TypeScript

Backend:
FastAPI

Central database:
PostgreSQL

If FastAPI/PostgreSQL cannot be deployed in the current Replit environment, create clean service interfaces and local demo data so the application remains functional.

The intended flow:

Patient App
↓
Local Storage
↓
Sync Engine
↓
FastAPI
↓
PostgreSQL
↓
Caregiver / Doctor Dashboard

============================================================
47. DATA MODELS
============================================================

Create clean data structures for:

PATIENT

patient_id
name
age
language
caregiver_id
doctor_id

GAME_SESSION

session_id
patient_id
game_type
difficulty
score
accuracy
response_time
mistakes
attempts
completion_status
timestamp

REMINDER

reminder_id
patient_id
title
description
category
date
time
repeat
priority
status
created_by_role
created_by_id
voice_enabled

MEMORY_BANK

memory_id
patient_id
category
title
content

COGNITIVE_ACTIVITY_SCORE

patient_id
date
score
trend

MOOD

mood_id
patient_id
date
mood

CARE_NOTE

note_id
patient_id
created_by
content
timestamp

============================================================
48. NAVIGATION
============================================================

PATIENT:

🏠 Home
🧠 Play & Practice
🔔 Reminders
❤️ Memories

CAREGIVER:

Dashboard
Patients
Activities
Reminders
Memory Bank

DOCTOR:

Dashboard
Patients
Insights
Reminders

If the current implementation requires a slightly different structure, preserve functionality but maintain the same logical separation.

============================================================
49. ONLINE STATUS
============================================================

Subtle status indicator:

🟢 Online

🟠 Offline

🔄 Syncing

✓ Synced

Do not make Offline appear like a system failure.

============================================================
50. MOBILE / TABLET DESIGN
============================================================

The application must be responsive.

Optimize for:

• Android phones
• Android tablets
• Desktop/laptop

Patient mode should be especially optimized for tablet/mobile.

Use:

• touch-friendly controls
• responsive cards
• proper scrolling
• large buttons
• readable charts
• no horizontal scrolling

============================================================
51. PREMIUM UI DETAILS
============================================================

Use:

• Warm ivory background #F8F6F0
• Deep green #2F6F59
• White cards
• Rounded 18–22px corners
• Subtle shadows
• Large whitespace
• Consistent 8px spacing system
• Consistent iconography
• Calm transitions

Do not overanimate.

Do not use gradients unless extremely subtle and necessary.

============================================================
52. PATIENT GAME SCREEN DESIGN
============================================================

Example structure:

← Back

Remember the cards

"Take your time."

Large game area

🔊 Listen

[ LARGE ACTION BUTTON ]

At completion:

"Well done!"

"You completed today's activity."

[ CONTINUE ]

Do not display technical analytics to the patient.

============================================================
53. ERROR HANDLING
============================================================

Never show technical errors to elderly users.

Instead of:

"API request failed"

show:

"We couldn't connect right now. Your progress is saved and we'll try again."

Instead of:

"Database error"

show:

"Something went wrong. Please try again."

============================================================
54. DEMO DATA
============================================================

Populate realistic fictional demo data.

Ramesh Das:

Age 72
Language Assamese
Favourite food: Momos
Son: Rahul
Important place: Home Village

Anjali Devi:

Age 68
Language Manipuri
Favourite food: Rice
Family: Meena
Important place: Home

Bimal Singh:

Age 75
Language Bodo
Favourite food: Dal
Family: Amit
Important place: Guwahati

Give each patient:

• different game history
• different scores
• different reminders
• different Memory Bank entries
• different activity completion
• different trends

============================================================
55. COMPLETE DEMO FLOW
============================================================

The application must support this exact demonstration:

START

SMIVAI

↓

Choose:

PATIENT | CAREGIVER | DOCTOR

--------------------------------
PATIENT DEMO
--------------------------------

Patient
↓

Home

↓

Play & Practice

↓

Memory Pairs

↓

Complete game

↓

Performance calculated

↓

Difficulty updated

↓

Game session saved

↓

Cognitive Activity Score updated

↓

Reminder appears

↓

Memory Bank available

--------------------------------
CAREGIVER DEMO
--------------------------------

Caregiver

↓

Select Ramesh

↓

Patient Overview

↓

Today's Activity

↓

Game Performance

↓

Create Reminder

"Drink Water"
10:30 AM
Every Day

↓

Create

↓

Reminder appears in Ramesh's Patient account

↓

Open Memory Bank

Add:
Favourite food = Momos

↓

My Memories activity uses that information

--------------------------------
DOCTOR DEMO
--------------------------------

Doctor

↓

Select Ramesh

↓

Performance Trend

↓

Activity History

↓

Reminder Adherence

↓

Care Notes

↓

Important Activity Changes

--------------------------------
OFFLINE DEMO
--------------------------------

Turn Offline Mode ON

↓

Play a game

↓

Game completes

↓

Data saved locally

↓

Show:

"Offline — Your progress is saved"

Turn connection ON

↓

"Syncing your data..."

↓

"All data synced"

↓

Caregiver dashboard updates

============================================================
56. GAME PERFORMANCE → CAREGIVER FLOW
============================================================

This is extremely important.

When:

Ramesh completes Memory Pairs

Score:
82%

Difficulty:
Medium

Mistakes:
2

Response time:
8 seconds

The caregiver dashboard must be able to display the same session.

Doctor must also be able to see the corresponding performance trend.

Do not use disconnected fake numbers.

============================================================
57. PATIENT-SPECIFIC REMINDERS
============================================================

If caregiver creates:

Ramesh:
Drink Water
10:30 AM

It must NOT appear for:

Anjali
Bimal

When switching patients, all reminders update.

============================================================
58. PATIENT-SPECIFIC MEMORY BANK
============================================================

Ramesh's memories must never appear in Anjali's My Memories.

Use patient_id for every relevant record.

============================================================
59. COGNITIVE GAME EVIDENCE POSITIONING
============================================================

The application should be designed around cognitive stimulation concepts including:

• memory
• recognition
• attention
• thinking
• language association
• sequencing
• visual processing
• reminiscence

Do NOT claim that any individual game clinically treats dementia.

The platform provides structured cognitive-support activities.

============================================================
60. FINAL PRODUCT POSITIONING
============================================================

The product should communicate:

"SMIVAI makes cognitive support simple, personalised and accessible for elderly users while helping caregivers and healthcare professionals understand activity and performance over time."

============================================================
61. FINAL QUALITY CHECK
============================================================

Before finishing the implementation:

TEST EVERYTHING.

Test:

• Patient role
• Caregiver role
• Doctor role
• Patient switching
• Every cognitive game
• Easy difficulty
• Medium difficulty
• Hard difficulty
• Adaptive difficulty
• Game scoring
• Game session saving
• Cognitive Activity Score
• Memory Bank
• My Memories integration
• Reminders
• Recurring reminders
• Custom reminders
• Caregiver-created reminders
• Doctor-created reminders
• Patient reminder completion
• Missed reminders
• Voice toggle
• Online status
• Offline mode
• Sync simulation/engine
• Care notes
• Mood
• Family contacts
• Charts
• Activity history
• Mobile layout
• Tablet layout
• Desktop layout

Ensure:

• No broken buttons
• No dead navigation
• No duplicate screens
• No placeholder content
• No "Coming Soon"
• No lorem ipsum
• No console errors
• No patient data leakage
• No horizontal scrolling
• No unreadably small text
• No tiny patient buttons

============================================================
62. FINAL DESIGN CHECK
============================================================

Before completing, review every patient screen specifically for:

"Could a 70+ year old user understand this screen without someone explaining it?"

If not:

Simplify it.

Make buttons larger.

Reduce text.

Increase contrast.

Remove unnecessary information.

============================================================
63. FINAL IMPLEMENTATION RULE
============================================================

Do not stop after creating the visual interface.

The application must be FUNCTIONAL.

Patient actions should update data.

Game sessions should update performance.

Performance should update caregiver/doctor views.

Caregiver-created reminders should appear for the patient.

Doctor-created reminders should appear for the patient.

Memory Bank entries should affect My Memories activities.

Offline actions should persist.

Sync should update the central/demo state.

Patient data must remain separated by patient_id.

============================================================
FINAL INSTRUCTION
============================================================

Build the COMPLETE SMIVAI prototype now in one coherent implementation.

Do not ask me for additional prompts.

Do not rebuild unnecessarily.

Do not add random features.

Do not remove the core features.

Prioritize a polished, accessible, elderly-first interface and a fully demonstrable Patient → Caregiver → Doctor ecosystem.

The final application should look like a real premium healthcare/wellness product designed specifically for elderly cognitive support, while remaining technically understandable and defensible for a   presentation.
~~~~

### 1.2 System architecture request

- **Purpose:** Requests a system architecture for the application (delivered as an architecture diagram).
- **Status:** Original (verbatim)
- **Source:** Session A (25 Aug - 19 Sep 2026) · 2026-08-30

~~~~text
CAN YOU MAKE THE  ARCHITECTURE
~~~~

### 1.3 Multilingual support with Bhashini and AI4Bharat

- **Purpose:** Adds regional-language interaction for every patient, focusing on Northeast Indian languages, via Bhashini / AI4Bharat.
- **Status:** Original (verbatim)
- **Source:** Session A (25 Aug - 19 Sep 2026) · 2026-08-30

~~~~text
I want to make changes to my application by adding a multilingual language support feature for every patient, especially focusing on patients from Northeast India. Each patient should be able to interact with the system in their preferred regional language.

The language integration should support multiple Indian and Northeast regional languages using platforms such as Bhashini and AI4Bharat. The system should enable speech-to-text, text-to-speech, translation, and natural language interaction in the patient's selected language.

The application should provide a language selection option during patient registration or onboarding. Based on the patient's preference, all communication, AI responses, voice interactions, and important healthcare information should be available in their chosen language.

The implementation should integrate Bhashini and AI4Bharat APIs/models wherever appropriate to ensure accurate Indian language translation and speech processing, making the healthcare system more accessible for patients who are not comfortable communicating in English or Hindi.
~~~~


---

## 2. Phase 2 — Northeast UI redesign

### 2.1 Northeast redesign specification review (v4/v5)

- **Purpose:** Shares a redesign specification and an implementation summary for review and adoption: elderly-friendly typography, prototype login, role selection, new navigation.
- **Status:** Original (verbatim)
- **Source:** Session A (25 Aug - 19 Sep 2026) · 2026-09-19
- **Note:** The prompt referenced two attachments (`Pasted markdown(7).md`, `SMIVAI_Northeast_Redesign_v4(1).zip`). Their contents are not stored in the accessible history. The body text was pasted by the author from an earlier tool output.

~~~~text
yeh sahi rahega kya 
Pasted markdown(7).md
File
SMIVAI_Northeast_Redesign_v4(1).zip
Zip Archive

Implemented the SMIVAI Northeast frontend redesign v5 based on the supplied specification.

Included
Elderly-friendly typography and larger touch targets
Mandatory prototype login with User ID / ABHA ID + 4-digit PIN
Patient / Caregiver / Doctor role selection
New bottom navigation: Home · Talk · Games · Photos · Profile
Prominent Talk with SMIVAI
Done button that immediately stops the voice/listening interaction
Teach Me a New Skill
Daily Fact
Complete the Pattern
Word Hustle
Expanded Brain Games hub
My Photos / Memories with browser photo upload
Photo → Talk with SMIVAI interaction
Standard vs Premium plan UI
Patient profile with reminders, memories, family and plans
Existing caregiver/doctor experiences retained
Existing backend/API/database structure left untouched, consistent with the requested frontend-first approach.
Northeast India imagery remains part of the experience.
Download the updated prototype

Download SMIVAI Northeast Redesign v5 ZIP

I also included a SMIVAI_Northeast_Redesign_v5_CHANGES.md file inside the ZIP with the implementation summary.

Redesign and enhance the existing SMIVAI prototype to make it feel like a polished, premium, simple, and highly accessible healthcare/wellness application for elderly users.

IMPORTANT:

Do NOT remove or break any existing SMIVAI functionality.
Do NOT change the existing backend, APIs, database, authentication logic, or core functionality.
Make changes primarily to the frontend/UI/UX.
Reuse the existing components and data wherever possible.
The application should remain easy to use for elderly users and caregivers.
Keep the interface clean, friendly, warm, modern, and premium rather than making it look like a generic dashboard.
1. Typography & Font Size

Improve typography throughout the application.

Increase the default font size for important text.
Make headings clearly readable.
Use large, high-contrast buttons.
Make labels and instructions easy for elderly users to read.
Avoid tiny text.
Maintain a clear visual hierarchy.
Use accessible font weights and spacing.
Important actions such as Talk with SMIVAI, Done, Start Game, Emergency, Profile etc. should be immediately visible.

The interface should feel accessible without looking oversized or childish.

2. Premium & Standard Plans

Add a clear Premium Plan vs Standard Plan section.

Standard

Show features available in the free/standard experience.

Example:

Basic Talk with SMIVAI
Daily Fact
Daily Skill
Basic games
Basic patient/caregiver features
Premium

Show additional advanced features.

Example:

Extended AI conversations
Additional cognitive games
Personalized daily activities
Advanced progress tracking
More personalization
Additional caregiver insights
Premium AI features

Create attractive plan cards with:

Standard

Simple pricing/plan information
Clear "Current Plan" or "Choose Standard" button

Premium

Highlight premium benefits
Clear "Upgrade to Premium" button

Do not implement real payment processing unless it already exists. This is currently a prototype UI.

3. Photo Feature

Add a dedicated Photo / Memories feature.

The elderly user should be able to:

View photos
Add/upload photos if supported by the existing frontend
Open a photo in a larger view
Add simple context/caption where appropriate
Use photos as conversation starters with SMIVAI

Example:

"Who is in this photo?"

"Tell me about this memory."

"Would you like to talk about this?"

Make this feature warm and emotionally engaging rather than technical.

Use large photo cards and simple controls.

4. "Talk with SMIVAI"

Make Talk with SMIVAI one of the most prominent features on the home screen.

Create a large, easy-to-understand button/card:

🗣️ Talk with SMIVAI

"I'm here to talk with you."

Include:

Large microphone/talk button
Clear listening state
Clear speaking/response state
Simple conversation interface
Large text
Minimal distractions
VERY IMPORTANT — DONE BUTTON

When the user presses DONE, the conversation/audio interaction must stop immediately.

Do not continue listening.
Do not continue recording.
Do not keep the microphone active.
Do not continue generating interaction after the user presses Done.

Show a clear state such as:

Conversation Ended

and return the user to the previous screen/home screen.

If the existing backend already controls the voice interaction, only modify the frontend behavior/state handling necessary to ensure the user experience ends immediately.

5. Daily "Teach Me a New Skill"

Add a daily activity called:

🎓 Teach Me a New Skill Today

Every day show one short, simple skill.

Make it feel like a small game/activity rather than a textbook.

Example:

Today's Skill

How to fold a simple paper envelope

Step 1: Take a rectangular sheet of paper.

Step 2: Fold the bottom upward.

Step 3: Fold the sides inward.

Then provide:

"I learned it!"

or

"Show me another skill"

The content should be short, practical, and easy to understand.

Possible categories:

Household skills
Technology skills
Memory techniques
Cooking tips
Safety tips
Gardening
Communication
General life skills

Track whether today's activity has been completed.

6. "Tell Me a New Fact Today"

Add another daily feature:

💡 Tell Me a New Fact Today

Show one interesting fact every day.

Example:

🌍 Did You Know?

Honey never naturally spoils when stored properly.

Add a simple interaction:

"I learned something new!"

Optionally allow:

"Tell me another fact"

Keep facts:

Short
Easy to understand
Interesting
Educational
Appropriate for elderly users

Avoid overwhelming the user with large blocks of text.

7. Pattern Recognition Game

Add a cognitive game called:

🔢 Complete the Pattern

Show a number sequence and ask the user to identify the next number.

Example:

1 → 3 → 5 → 7 → 9 → ?

Answer:

11

Provide multiple-choice answers using large buttons.

Example:

8 | 10 | 11 | 12

After answering:

Correct 🎉

Great job! The pattern increases by 2 each time.

or

Try Again

Look at how much each number increases.

Create different difficulty levels:

Easy

2 → 4 → 6 → 8 → ?

Medium

3 → 6 → 12 → 24 → ?

Hard

2 → 5 → 10 → 17 → 26 → ?

Make the game visually engaging and provide a simple score/progress system.

8. Mandatory Login

The current prototype should NOT allow everyone to simply enter using a common demo ID/PIN.

Create a proper prototype login screen.

Login

User ID / ABHA ID

[________________]

4-digit PIN / Password

[________________]

Login

Also provide:

Forgot PIN?

and, if appropriate for the prototype:

Create Account

The login should be mandatory before accessing the main SMIVAI application.

Prototype requirement

For demonstration purposes, the prototype can use a mock authentication flow, but the UI should behave like a real application.

Do not expose a universal demo ID/PIN prominently on the login screen.

If ABHA integration is not actually implemented, clearly treat ABHA ID as a prototype field and do not claim that real ABHA authentication is occurring.

9. Word Hustle Game

Add a new cognitive game:

🔤 Word Hustle

The user receives a jumbled alphabet grid.

They must find hidden words:

Horizontally →
Vertically ↓
Diagonally ↘ / ↙

Example:

C  A  T  X  P
R  O  M  E  L
B  W  E  R  D
S  A  T  H  N
F  I  S  H  Q



The user can select letters by dragging across them or tapping the letters in sequence.

When a word is found:

Highlight it
Show a small success animation
Increase the score
Show remaining words

Example:

Find:

CAT
FISH
WORD

Difficulty levels:

Easy

5 × 5 grid
3 words

Medium

6 × 6 grid
5 words

Hard

8 × 8 grid
7–10 words

Use familiar vocabulary appropriate for elderly users.

10. Games & Cognitive Activities Hub

Create a dedicated section:

🧠 Brain Games

Cards:

🔢 Complete the Pattern

Pattern recognition

🔤 Word Hustle

Find hidden words

🧠 Memory Match

Match identical cards

👀 Spot the Difference

Find differences between two images

🧩 Simple Puzzle

Solve a simple visual puzzle

📝 Quick Quiz

Answer simple general-knowledge questions

Each game should have:

Large Start button
Difficulty
Score
Progress
Simple instructions
Completion feedback
11. Home Dashboard

Redesign the SMIVAI home screen around simple daily actions.

The first screen should prioritize:

Good Morning 👋

What would you like to do today?

Then large cards:

🗣️ Talk with SMIVAI

📸 My Photos

🎓 Learn a Skill

💡 Daily Fact

🧠 Brain Games

❤️ My Progress

Keep the number of choices manageable.

Do not overload the screen with too many cards.

12. Elderly-Friendly UX

The entire application should follow accessibility-first design principles.

Use:

Large touch targets
Large buttons
Clear icons
High contrast
Simple language
Minimal navigation depth
Consistent placement of Back/Home buttons
Clear success/error messages
Large readable text
Avoid unnecessary animations
Avoid complicated menus
Avoid technical terminology

The user should understand what to do without needing instructions from a caregiver.

13. Visual Design

The overall SMIVAI design should feel:

Warm + Premium + Trustworthy + Human + Accessible

Use high-quality photographs showing elderly people actually using technology and interacting with caregivers/doctors.

The imagery should represent Indian users, including people from Northeast India, rather than relying only on generic Western stock imagery.

Use authentic-looking scenes such as:

Elderly person talking to SMIVAI
Elderly person with caregiver
Elderly person interacting with doctor
Family using SMIVAI together
Elderly people enjoying cognitive games
Elderly person looking at family photos

Avoid making the interface look like a hospital management dashboard.

14. Navigation

Keep navigation extremely simple.

Suggested bottom navigation:

Home | Talk | Games | Photos | Profile

The most important actions should always remain accessible.

For elderly users, avoid nested menus whenever possible.

15. Micro-interactions

Add subtle interactions:

Button press feedback
Success animation
Game completion animation
Progress indicators
Friendly messages
Gentle transitions

Do NOT make animations excessive or distracting.

16. Final Prototype Goal

The final SMIVAI prototype should feel like a real, production-quality AI companion platform for elderly users, not a basic college project.

The primary experience should be:

Login → Home → Talk / Learn / Daily Fact / Photos / Games → Progress

The interface should be immediately understandable to an elderly person.

Most importantly:

Keep the existing backend and existing functionality intact. Make the frontend significantly more polished, accessible, interactive, and engaging.

Close
~~~~

### 2.2 Northeast redesign edit request

- **Purpose:** Asks for the pasted v5 redesign summary to be applied and edited into the project.
- **Status:** Original (verbatim)
- **Source:** Session A (25 Aug - 19 Sep 2026) · 2026-09-19
- **Note:** Contains text pasted by the author from an earlier tool output.

~~~~text
edit this

Implemented the SMIVAI Northeast frontend redesign v5 based on the supplied specification.

Included
Elderly-friendly typography and larger touch targets
Mandatory prototype login with User ID / ABHA ID + 4-digit PIN
Patient / Caregiver / Doctor role selection
New bottom navigation: Home · Talk · Games · Photos · Profile
Prominent Talk with SMIVAI
Done button that immediately stops the voice/listening interaction
Teach Me a New Skill
Daily Fact
Complete the Pattern
Word Hustle
Expanded Brain Games hub
My Photos / Memories with browser photo upload
Photo → Talk with SMIVAI interaction
Standard vs Premium plan UI
Patient profile with reminders, memories, family and plans
Existing caregiver/doctor experiences retained
Existing backend/API/database structure left untouched, consistent with the requested frontend-first approach.
Northeast India imagery remains part of the experience.
Download the updated prototype

Download SMIVAI Northeast Redesign v5 ZIP

I also included a SMIVAI_Northeast_Redesign_v5_CHANGES.md file inside the ZIP with the implementation summary.

Redesign and enhance the existing SMIVAI prototype to make it feel like a polished, premium, simple, and highly accessible healthcare/wellness application for elderly users.

IMPORTANT:

Do NOT remove or break any existing SMIVAI functionality.
Do NOT change the existing backend, APIs, database, authentication logic, or core functionality.
Make changes primarily to the frontend/UI/UX.
Reuse the existing components and data wherever possible.
The application should remain easy to use for elderly users and caregivers.
Keep the interface clean, friendly, warm, modern, and premium rather than making it look like a generic dashboard.
1. Typography & Font Size

Improve typography throughout the application.

Increase the default font size for important text.
Make headings clearly readable.
Use large, high-contrast buttons.
Make labels and instructions easy for elderly users to read.
Avoid tiny text.
Maintain a clear visual hierarchy.
Use accessible font weights and spacing.
Important actions such as Talk with SMIVAI, Done, Start Game, Emergency, Profile etc. should be immediately visible.

The interface should feel accessible without looking oversized or childish.

2. Premium & Standard Plans

Add a clear Premium Plan vs Standard Plan section.

Standard

Show features available in the free/standard experience.

Example:

Basic Talk with SMIVAI
Daily Fact
Daily Skill
Basic games
Basic patient/caregiver features
Premium

Show additional advanced features.

Example:

Extended AI conversations
Additional cognitive games
Personalized daily activities
Advanced progress tracking
More personalization
Additional caregiver insights
Premium AI features

Create attractive plan cards with:

Standard

Simple pricing/plan information
Clear "Current Plan" or "Choose Standard" button

Premium

Highlight premium benefits
Clear "Upgrade to Premium" button

Do not implement real payment processing unless it already exists. This is currently a prototype UI.

3. Photo Feature

Add a dedicated Photo / Memories feature.

The elderly user should be able to:

View photos
Add/upload photos if supported by the existing frontend
Open a photo in a larger view
Add simple context/caption where appropriate
Use photos as conversation starters with SMIVAI

Example:

"Who is in this photo?"

"Tell me about this memory."

"Would you like to talk about this?"

Make this feature warm and emotionally engaging rather than technical.

Use large photo cards and simple controls.

4. "Talk with SMIVAI"

Make Talk with SMIVAI one of the most prominent features on the home screen.

Create a large, easy-to-understand button/card:

🗣️ Talk with SMIVAI

"I'm here to talk with you."

Include:

Large microphone/talk button
Clear listening state
Clear speaking/response state
Simple conversation interface
Large text
Minimal distractions
VERY IMPORTANT — DONE BUTTON

When the user presses DONE, the conversation/audio interaction must stop immediately.

Do not continue listening.
Do not continue recording.
Do not keep the microphone active.
Do not continue generating interaction after the user presses Done.

Show a clear state such as:

Conversation Ended

and return the user to the previous screen/home screen.

If the existing backend already controls the voice interaction, only modify the frontend behavior/state handling necessary to ensure the user experience ends immediately.

5. Daily "Teach Me a New Skill"

Add a daily activity called:

🎓 Teach Me a New Skill Today

Every day show one short, simple skill.

Make it feel like a small game/activity rather than a textbook.

Example:

Today's Skill

How to fold a simple paper envelope

Step 1: Take a rectangular sheet of paper.

Step 2: Fold the bottom upward.

Step 3: Fold the sides inward.

Then provide:

"I learned it!"

or

"Show me another skill"

The content should be short, practical, and easy to understand.

Possible categories:

Household skills
Technology skills
Memory techniques
Cooking tips
Safety tips
Gardening
Communication
General life skills

Track whether today's activity has been completed.

6. "Tell Me a New Fact Today"

Add another daily feature:

💡 Tell Me a New Fact Today

Show one interesting fact every day.

Example:

🌍 Did You Know?

Honey never naturally spoils when stored properly.

Add a simple interaction:

"I learned something new!"

Optionally allow:

"Tell me another fact"

Keep facts:

Short
Easy to understand
Interesting
Educational
Appropriate for elderly users

Avoid overwhelming the user with large blocks of text.

7. Pattern Recognition Game

Add a cognitive game called:

🔢 Complete the Pattern

Show a number sequence and ask the user to identify the next number.

Example:

1 → 3 → 5 → 7 → 9 → ?

Answer:

11

Provide multiple-choice answers using large buttons.

Example:

8 | 10 | 11 | 12

After answering:

Correct 🎉

Great job! The pattern increases by 2 each time.

or

Try Again

Look at how much each number increases.

Create different difficulty levels:

Easy

2 → 4 → 6 → 8 → ?

Medium

3 → 6 → 12 → 24 → ?

Hard

2 → 5 → 10 → 17 → 26 → ?

Make the game visually engaging and provide a simple score/progress system.

8. Mandatory Login

The current prototype should NOT allow everyone to simply enter using a common demo ID/PIN.

Create a proper prototype login screen.

Login

User ID / ABHA ID

[________________]

4-digit PIN / Password

[________________]

Login

Also provide:

Forgot PIN?

and, if appropriate for the prototype:

Create Account

The login should be mandatory before accessing the main SMIVAI application.

Prototype requirement

For demonstration purposes, the prototype can use a mock authentication flow, but the UI should behave like a real application.

Do not expose a universal demo ID/PIN prominently on the login screen.

If ABHA integration is not actually implemented, clearly treat ABHA ID as a prototype field and do not claim that real ABHA authentication is occurring.

9. Word Hustle Game

Add a new cognitive game:

🔤 Word Hustle

The user receives a jumbled alphabet grid.

They must find hidden words:

Horizontally →
Vertically ↓
Diagonally ↘ / ↙

Example:

C  A  T  X  P
R  O  M  E  L
B  W  E  R  D
S  A  T  H  N
F  I  S  H  Q



The user can select letters by dragging across them or tapping the letters in sequence.

When a word is found:

Highlight it
Show a small success animation
Increase the score
Show remaining words

Example:

Find:

CAT
FISH
WORD

Difficulty levels:

Easy

5 × 5 grid
3 words

Medium

6 × 6 grid
5 words

Hard

8 × 8 grid
7–10 words

Use familiar vocabulary appropriate for elderly users.

10. Games & Cognitive Activities Hub

Create a dedicated section:

🧠 Brain Games

Cards:

🔢 Complete the Pattern

Pattern recognition

🔤 Word Hustle

Find hidden words

🧠 Memory Match

Match identical cards

👀 Spot the Difference

Find differences between two images

🧩 Simple Puzzle

Solve a simple visual puzzle

📝 Quick Quiz

Answer simple general-knowledge questions

Each game should have:

Large Start button
Difficulty
Score
Progress
Simple instructions
Completion feedback
11. Home Dashboard

Redesign the SMIVAI home screen around simple daily actions.

The first screen should prioritize:

Good Morning 👋

What would you like to do today?

Then large cards:

🗣️ Talk with SMIVAI

📸 My Photos

🎓 Learn a Skill

💡 Daily Fact

🧠 Brain Games

❤️ My Progress

Keep the number of choices manageable.

Do not overload the screen with too many cards.

12. Elderly-Friendly UX

The entire application should follow accessibility-first design principles.

Use:

Large touch targets
Large buttons
Clear icons
High contrast
Simple language
Minimal navigation depth
Consistent placement of Back/Home buttons
Clear success/error messages
Large readable text
Avoid unnecessary animations
Avoid complicated menus
Avoid technical terminology

The user should understand what to do without needing instructions from a caregiver.

13. Visual Design

The overall SMIVAI design should feel:

Warm + Premium + Trustworthy + Human + Accessible

Use high-quality photographs showing elderly people actually using technology and interacting with caregivers/doctors.

The imagery should represent Indian users, including people from Northeast India, rather than relying only on generic Western stock imagery.

Use authentic-looking scenes such as:

Elderly person talking to SMIVAI
Elderly person with caregiver
Elderly person interacting with doctor
Family using SMIVAI together
Elderly people enjoying cognitive games
Elderly person looking at family photos

Avoid making the interface look like a hospital management dashboard.

14. Navigation

Keep navigation extremely simple.

Suggested bottom navigation:

Home | Talk | Games | Photos | Profile

The most important actions should always remain accessible.

For elderly users, avoid nested menus whenever possible.

15. Micro-interactions

Add subtle interactions:

Button press feedback
Success animation
Game completion animation
Progress indicators
Friendly messages
Gentle transitions

Do NOT make animations excessive or distracting.

16. Final Prototype Goal

The final SMIVAI prototype should feel like a real, production-quality AI companion platform for elderly users, not a basic college project.

The primary experience should be:

Login → Home → Talk / Learn / Daily Fact / Photos / Games → Progress

The interface should be immediately understandable to an elderly person.

Most importantly:

Keep the existing backend and existing functionality intact. Make the frontend significantly more polished, accessible, interactive, and engaging.

Close
~~~~

### 2.3 First-impression and regional visual quality

- **Purpose:** Asks for a polished first impression, with great UI/UX everywhere and a Northeastern visual identity.
- **Status:** Original (verbatim)
- **Source:** Session A (25 Aug - 19 Sep 2026) · 2026-09-19

~~~~text
and add that  ki jesa hi khulta hai toh lage wah nice website best ui ux evrywhere look great  northeastern people using that best look bestest


and continue
~~~~


---

## 3. Phase 3 — Complete product and UI/UX implementation

### 3.1 Complete product + UI/UX implementation prompt

- **Purpose:** A design-system-level brief to evolve the existing app into SMIVAI — Care Closer to You: brand, layout, components, accessibility and product behaviour across all roles.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-19
- **Note:** A screenshot was attached to one or more messages in this entry; images are not reproducible in this document.

~~~~text
SMIVAI — COMPLETE PRODUCT + UI/UX IMPLEMENTATION PROMPT

You are an expert senior product engineer, UI/UX designer, and design-system architect working on the existing SMIVAI application.

SMIVAI stands for:

SMIVAI — Care Closer to You

Use the existing SMIVAI application as the starting point.

Do not create a disconnected mockup.

Preserve existing working functionality wherever appropriate and extend the application where necessary.

The final result must feel like a real, polished healthcare/cognitive-wellness product designed by a professional product team.

⸻

1. PRODUCT VISION

SMIVAI is an elderly-focused AI-assisted healthcare, cognitive wellness, memory, reminder, and caregiver-support platform.

The product should help elderly users:

* Talk with SMIVAI
* Stay mentally active
* Play cognitive games
* Preserve memories
* Manage reminders
* Track personal progress
* Complete daily activities
* Connect with caregivers
* Access doctor-related services
* Manage health-related information
* Access emergency assistance
* Receive personalized support

The product should feel:

Human
Simple
Caring
Trustworthy
Warm
Premium
Accessible
Modern

The central emotional idea is:

“Healthcare technology that feels human, simple and caring.”

⸻

2. IMPORTANT DESIGN DIRECTION

The application MUST NOT look like:

* A generic Flutter application
* A default Material Design dashboard
* A generic hospital management system
* A generic healthcare SaaS template
* A white-and-green medical dashboard
* A complicated clinical system
* A childish elderly application
* A generic AI chatbot

Create a recognizable SMIVAI visual identity.

The interface should combine:

* Premium modern SaaS quality
* Soft 3D UI
* Elderly-friendly accessibility
* Warm human imagery
* Calm healthcare aesthetics
* Sophisticated pastel colors
* Large readable typography
* Generous spacing
* Clear interaction patterns
* Subtle depth and floating elements

⸻

3. VISUAL DESIGN SYSTEM

Background

Primary application background:

Warm Off-White — #F8F7F2

Use this as the primary canvas instead of pure white.

⸻

Primary Accent

Use a calm, trustworthy blue as the primary interactive accent.

Suggested primary blue:

#5B82C4

Use it for:

* Primary actions
* Navigation highlights
* Important information
* Progress indicators
* Interactive states

Do not allow blue to overwhelm the entire interface.

⸻

4. SECONDARY COLOR PALETTE

Use a controlled pastel ecosystem.

Pastel Blue

For:

* AI
* Communication
* Doctor services
* Information

Soft Green

For:

* Wellness
* Healthy activities
* Progress
* Positive states

Soft Peach

For:

* Reminders
* Memories
* Friendly actions
* Personal content

Soft Lavender

For:

* Brain games
* Cognitive activities
* Premium features
* AI experiences

Warm Cream

For:

* Memory content
* Personal sections
* Emotional areas

Dark Navy

Use as the primary text color.

Suggested:

#202A44

⸻

Status Colors

Success:

#4F9D91

Warning:

#E4A84A

Emergency:

#E63946

Emergency red must ONLY be used for emergency/SOS-related actions and critical alerts.

Do not use red as a normal brand color.

⸻

5. COLOR PHILOSOPHY

Do not make the entire application blue.

Different colors should communicate different experiences.

For example:

Talk with SMIVAI
→ Blue + Lavender

Brain Games
→ Lavender + Peach

My Memories
→ Cream + Peach

Daily Fact
→ Soft Blue + Warm Ivory

Learn a Skill
→ Lavender + Blue

Progress
→ Blue + Green

Reminders
→ Peach + Amber

Premium
→ Blue + Lavender with subtle depth

Emergency
→ Red

The result should feel colorful but sophisticated.

⸻

6. 3D VISUAL LANGUAGE

Use a modern soft 3D / 3D neumorphic-inspired visual system.

The 3D treatment should be subtle and premium.

Use:

* Soft shadows
* Ambient depth
* Floating objects
* Layered surfaces
* Soft highlights
* Gentle elevation
* Glass-like surfaces where appropriate
* Realistic soft lighting
* Rounded geometry
* Soft 3D illustrations

Avoid:

* Excessive glossy effects
* Plastic-looking interfaces
* Heavy bevels
* Excessive gradients
* Overly dramatic shadows
* Gaming-style 3D
* Excessive visual effects

The interface should feel like a premium healthcare product, not a game.

⸻

7. CARDS AND SURFACES

Use a combination of:

* White glass-like cards
* Warm cream surfaces
* Soft pastel panels
* Full-width sections
* Image-based sections
* Open layouts
* Floating 3D elements

Card surfaces may use:

#FFFFFF

or

#FFFDF9

with subtle shadows.

Cards should have refined rounded corners.

Do not put everything inside cards.

Create visual rhythm between:

* Open sections
* Hero areas
* Cards
* Lists
* Panels
* Images
* Floating elements

⸻

8. TYPOGRAPHY

Use:

MANROPE

as the primary application font.

Do not use Roboto as the primary font.

Typography hierarchy:

Display:
Manrope ExtraBold 800

H1:
Manrope Bold 700

H2:
Manrope Bold 700

H3:
Manrope SemiBold 600

Buttons:
Manrope SemiBold 600

Body:
Manrope Regular 400

Secondary:
Manrope Medium 500

Typography must be highly readable for elderly users.

Use:

* Large font sizes
* Strong contrast
* Comfortable line height
* Clear hierarchy
* Adequate spacing

Avoid:

* Thin fonts
* Tiny labels
* Dense text
* Excessively decorative typography

⸻

9. BRANDING

Keep the existing SMIVAI logo wherever appropriate.

Brand:

SMIVAI

Tagline:

Care Closer to You

The brand should communicate:

* Care
* Connection
* Trust
* Simplicity
* Independence
* Human support

Do not unnecessarily redesign the existing logo.

⸻

10. ELDERLY-FIRST UX

The primary user is an elderly person.

The interface must be immediately understandable without technical knowledge.

Use:

* Large touch targets
* Large buttons
* Large icons
* Large text
* Clear labels
* Simple language
* High contrast
* Minimal navigation depth
* Obvious actions
* Clear back navigation
* Clear home navigation

Avoid:

* Tiny controls
* Hidden interactions
* Complex menus
* Dense dashboards
* Ambiguous icons
* Long navigation paths

⸻

11. PATIENT DASHBOARD

The Patient Home should be the most emotionally engaging screen.

It should NOT look like a business analytics dashboard.

Desktop/Tablet Structure

Create a spacious dashboard with:

LEFT NAVIGATION

SMIVAI logo

Navigation:

* Home
* Talk with SMIVAI
* Brain Games
* My Memories
* Reminders
* My Progress
* Book a Doctor
* Health Records
* Caregiver Support
* Settings

Use large icons and readable labels.

The navigation should be visually distinct from the reference design while following the same principles of clarity and accessibility.

⸻

12. TOP BAR

Include:

Greeting

Good Morning, Sharma Ji! 👋

Search

Large search field:

“Search doctors, medicines, or health services…”

Notifications

Clear notification button.

Profile

Elderly user’s profile image and name.

Keep the top bar clean and uncluttered.

⸻

13. HERO SECTION

Create a large, warm hero area.

Possible content:

Good Morning, Sharma Ji!

Healthier Today, Happier Tomorrow.

Supporting message:

“SMIVAI is here to talk, help, and keep you connected.”

Use a high-quality 3D illustration of an elderly Indian person.

The illustration should feel:

* Warm
* Friendly
* Realistic
* Human
* Approachable

Use a warm home environment where appropriate.

Add subtle 3D depth.

Primary action:

Talk with SMIVAI →

⸻

14. QUICK ACTIONS

Create four major actions:

Book a Doctor

Consult from home

Order Medicines

Get medicines at your doorstep

Request a Caregiver

Get help at home

My Health Records

View anytime, anywhere

Each action should have:

* Clear title
* Short description
* Large recognizable icon/3D illustration
* One obvious action
* Large interaction area

Use different pastel accent colors.

Do not make all four cards visually identical.

⸻

15. TODAY’S ACTIVITIES

Create visually engaging activity sections.

Activities may include:

Learn a New Skill

Daily Fact

Brain Games

My Memories

My Progress

Reminders

Use:

* Soft 3D illustrations
* Pastel accents
* Large labels
* Clear actions

⸻

16. RIGHT-SIDE INFORMATION AREA

For desktop/tablet layouts, include useful contextual information.

Possible sections:

Date & Weather

Show current date and weather where available.

Today’s Health Tip

Example:

“Remember to drink enough water today.”

Hydration Reminder

Use a soft 3D water-glass illustration.

Emergency

Large emergency panel:

Need Immediate Help?

In an emergency, get assistance now.

Primary action:

Call Now

Use emergency red ONLY in this section.

⸻

17. UPCOMING APPOINTMENTS

Create an appointment section.

Show:

* Doctor name
* Specialty
* Appointment date
* Appointment time
* Appointment type
* Status
* View details

Use large readable information.

⸻

18. HEALTH SUMMARY

Create a simple health-summary section.

Possible metrics:

* Blood Pressure
* SpO₂
* Weight
* Steps Today

Use simple indicators such as:

Normal

Good

Keep Going!

Do not turn this into a complicated medical analytics dashboard.

⸻

19. WELLNESS SECTION

Create a warm wellness area.

Use:

* Soft green
* Nature-inspired 3D illustration
* Calm composition

Content:

Small Steps, Big Difference

“Take care of your health today for a brighter tomorrow.”

⸻

20. TALK WITH SMIVAI

This should be one of the most distinctive experiences.

Use:

* Blue
* Lavender
* Soft ambient depth
* Large AI visual
* Large microphone
* Clear listening state
* Large conversation text

Example:

“Hello Sharma Ji 👋”

“I’m here to talk with you.”

“What would you like to talk about today?”

Provide:

Large microphone button

During active voice interaction provide:

DONE

The DONE button must immediately:

* Stop microphone
* Stop recording
* Stop listening
* Stop audio interaction
* End the active voice state

After pressing:

Conversation Ended

The microphone must not remain active.

If the available backend does not support real-time voice interaction, implement a functional mock/fallback.

Do not claim unsupported AI functionality is real.

⸻

21. BRAIN GAMES

Create a dedicated cognitive activity experience.

Free games:

* Picture Matching
* Memory Pairs
* Picture Bingo
* Category Sorting

Premium:

* Jigsaw
* Complete the Pattern
* Word Hustle
* Additional cognitive activities
* Future games

Use:

* Lavender
* Blue
* Peach
* Soft illustrations
* 3D game objects

Games should feel mature and engaging, not childish.

⸻

22. GAME EXPERIENCE

Each game should support:

* Instructions
* Start
* Gameplay
* Score
* Progress
* Question number where applicable
* Timer where appropriate
* Completion
* Accuracy
* Play Again
* Back to Games

Completion state:

Great job! 🎉

Show:

* Score
* Accuracy
* Performance
* Play Again
* Back to Games

Persist game results.

⸻

23. MY MEMORIES

Make Memories one of the warmest parts of the application.

Use large photographs and emotionally engaging layouts.

Categories:

* Family
* People
* Places
* Special Moments

Memory example:

Family Trip to Shillong

10 June 2024

Provide:

+ Add a Memory

⸻

24. ADD MEMORY FLOW

Implement:

Photo

↓

Title

↓

Description

↓

Date

↓

Person / Place / Event

↓

Save

Persist the memory.

Allow viewing, editing, and deleting where supported.

⸻

25. PHOTO + AI

When viewing a memory:

Talk about this memory

Possible actions:

* Who is in this photo?
* Tell me about this memory.
* Would you like to talk about this?

Connect this to the available AI functionality.

⸻

26. REMINDERS

Categories:

* Medication
* Food
* Appointments
* Exercise
* Activities
* Other

Example:

Take Medicine
8:00 AM
High Priority

Breakfast
9:00 AM

Brain Game
11:00 AM

Actions:

* Add
* Edit
* Delete
* Mark Complete

Use peach, amber and soft pastel accents.

⸻

27. FEELING CHECK-IN

Create a friendly check-in.

Question:

How are you feeling today?

Options:

😀 Happy
🙂 Good
😐 Okay
😟 Worried
😢 Sad
😴 Tired

Use gentle pastel colors.

Do not use clinical terminology.

Do not present the feature as a medical diagnosis.

Persist the check-in.

⸻

28. MY PROGRESS

Create simple, elderly-friendly progress analytics.

Show:

* Games completed
* Average score
* Accuracy
* Activity streak
* Weekly activity
* Recent games

Use:

* Large numbers
* Simple charts
* Progress indicators
* Friendly explanations

Example:

“You’re doing great this week!”

Avoid complicated business dashboards.

⸻

29. CAREGIVER EXPERIENCE

Caregiver functionality should focus on:

* Patients
* Reminders
* Memories
* Progress
* Doctor Guidance
* SOS
* Alerts

Immediately show:

* Patient name
* Today’s reminders
* Recent activity
* Progress
* Important alerts

⸻

30. DOCTOR EXPERIENCE

The Doctor interface should remain professional while using the SMIVAI design language.

Provide:

* Patient list
* Patient details
* Patient activity
* Scores
* Accuracy
* Progress over time
* Recent history
* Reminders
* Relevant insights

Do not turn the experience into a conventional hospital administration system.

⸻

31. FREE / PREMIUM EXPERIENCE

Implement actual plan-based access.

Free Patient

* 4 games
* Basic AI chat
* Daily Fact
* Daily Skill
* Basic reminders
* Photo memories
* Up to 2 caregiver accounts where applicable

Premium Patient

* 8 games
* Additional activities
* Advanced AI
* Personalized activities
* Advanced progress
* Premium insights
* Early access to new games
* Up to 6 caregiver accounts where applicable

Free Caregiver

Maximum:

2 linked patients

Premium Caregiver

Maximum:

6 linked patients

Free Doctor

Maximum:

100 patients

Premium Doctor

Maximum:

500 patients

⸻

32. PREMIUM UI

Premium should feel:

* Refined
* Calm
* Special
* Valuable

Use:

Blue + Lavender + subtle Peach

Do not use excessive gold.

Premium content should be visibly locked for Free users.

When clicked:

Available with SMIVAI Premium

Upgrade to Premium

The restriction must also be enforced through application logic.

⸻

33. LOGIN EXPERIENCE

Create a distinctive SMIVAI login flow.

Show:

SMIVAI

Care Closer to You

Role selection:

* Patient
* Caregiver
* Doctor

Patient:

Aadhaar/ABHA prototype verification → OTP

Caregiver:

Aadhaar prototype verification → OTP

Doctor:

Medical license verification → OTP

These must be treated as mock verification unless actual integrations exist.

Never claim real government or professional verification when using mock data.

⸻

34. ACCESSIBILITY SETTINGS

Include:

* Font Size
* Language
* Notifications
* Accessibility
* Plan
* Account
* Logout

Font-size changes must affect the application globally.

⸻

35. IMAGERY AND 3D ILLUSTRATIONS

Use high-quality imagery and 3D illustrations representing:

* Elderly Indian users
* Elderly couples
* Families
* Caregivers
* Doctors
* Cognitive activities
* Memories
* Technology interaction

Include Northeast Indian representation where appropriate.

Avoid stereotypes.

Avoid overly cartoonish healthcare imagery.

The visual language should communicate:

Connection
Care
Memory
Learning
Support
Independence

⸻

36. ICONOGRAPHY

Use a consistent modern rounded icon system.

Icons should feel:

* Friendly
* Soft
* Simple
* Recognizable

Important actions should use:

Icon + Text

Do not rely exclusively on icons without labels.

⸻

37. BUTTONS

Primary actions:

Calm Blue

Secondary:

Soft Lavender

Friendly actions:

Soft Peach

Success:

Muted Green

Emergency:

Red

Buttons must be large enough for elderly users.

Use icon + text when useful.

⸻

38. ANIMATION

Use subtle, purposeful motion.

Examples:

* Button feedback
* Page transitions
* AI listening animation
* Game success
* Progress updates
* Memory interactions
* Floating 3D elements

Avoid excessive animation.

Respect accessibility preferences such as reduced motion where supported.

⸻

39. RESPONSIVE EXPERIENCE

Support:

* Mobile
* Tablet
* Desktop

Mobile

Use simplified bottom navigation.

Possible:

Home | Talk | Games | Memories | Profile

Tablet

Use adaptive navigation and spacious content.

Desktop

Use a spacious sidebar/navigation structure.

Do not simply stretch the mobile interface onto desktop.

⸻

40. DASHBOARD RESPONSIVENESS

Desktop/tablet may use:

* Sidebar
* Top bar
* Multi-column content
* Right-side information panels

Mobile should reorganize the same information into a clear vertical flow.

Maintain the same design language across devices.

⸻

41. DESIGN SYSTEM

Create a centralized SMIVAI design system.

Define:

Colors

* Warm Ivory
* White
* Calm Blue
* Pastel Blue
* Soft Green
* Peach
* Lavender
* Navy
* Teal
* Amber
* Emergency Red

Typography

Manrope

Components

* Buttons
* Cards
* Inputs
* Navigation
* Dialogs
* Game components
* Memory components
* Progress components
* Reminder components
* Plan badges
* Accessibility components

Design tokens

Centralize:

* Colors
* Font sizes
* Font weights
* Spacing
* Radius
* Shadows
* Elevation
* Animation durations

Do not scatter styling values throughout the application.

⸻

42. IMPORTANT — AVOID GENERIC AI-GENERATED UI

The final product should NOT look automatically generated.

Avoid:

* Repetitive cards
* Excessive rounded rectangles
* Random colors
* Generic gradients
* Default Flutter widgets
* Default Roboto
* Generic hospital layouts
* Generic dashboards
* Excessive icons
* Excessive shadows
* Excessive 3D
* Unnecessary empty space
* Inconsistent spacing

Every component should have a purpose.

⸻

43. PRODUCT FUNCTIONALITY

All major buttons must work.

All major routes must work.

The following must be functional:

* Authentication
* Role selection
* Verification
* OTP flow
* Patient flow
* Caregiver flow
* Doctor flow
* Games
* Game results
* Memories
* Memory creation
* Reminders
* Feeling check-ins
* Progress
* Talk with SMIVAI
* DONE voice interaction
* Premium restrictions
* Caregiver patient linking
* Doctor patient management
* Settings
* Logout
* SOS/mock emergency flow

⸻

44. DATA AND BACKEND

Use the existing backend and database architecture wherever possible.

Persist:

* Users
* Roles
* Plans
* Relationships
* Games
* Game results
* Memories
* Reminders
* Feeling check-ins
* Activities
* Progress
* Notifications
* Settings

Avoid hardcoded data for functionality that should be dynamic.

⸻

45. ROLE-BASED AUTHORIZATION

Enforce:

Patient → Patient functionality

Caregiver → Caregiver functionality

Doctor → Doctor functionality

Prevent unauthorized access to:

* Routes
* APIs
* Patient records
* Memories
* Progress
* Relationships
* Premium functionality

Do not rely only on hiding frontend buttons.

⸻

46. MOCK EXTERNAL SERVICES

Where actual integrations are unavailable, use clearly separated mocks for:

* Aadhaar/ABHA verification
* Doctor license verification
* OTP
* Payment
* AI
* Emergency services
* Notifications

Make the architecture easy to replace with real integrations later.

Never represent a mock as a real-world verified service.

⸻

47. ERROR AND EMPTY STATES

Handle:

* Invalid login
* Invalid OTP
* Verification failure
* Unauthorized access
* Expired session
* Network failure
* Backend failure
* AI failure
* Upload failure
* Payment failure
* Empty memories
* Empty reminders
* Empty patient lists
* Empty activity history

Provide clear user-friendly messages.

Never leave the user on a blank screen.

⸻

48. PERFORMANCE

Keep the interface responsive.

Avoid unnecessary:

* Heavy animations
* Large assets
* Repeated API calls
* Expensive rendering
* Unnecessary state updates

Optimize 3D assets and images appropriately.

The elderly user should never feel that the application is difficult to operate because of performance issues.

⸻

49. SECURITY

Implement:

* Authentication
* Authorization
* Protected routes
* Secure token handling
* Input validation
* Data isolation
* Server-side permission checks where applicable
* Secure handling of credentials
* Protection against unauthorized patient access

Never expose secret keys in frontend code.

⸻

50. FINAL PRODUCT EXPERIENCE

When a user opens SMIVAI, they should immediately understand:

SMIVAI helps me.

SMIVAI talks with me.

SMIVAI remembers what matters.

SMIVAI keeps me engaged.

SMIVAI helps me stay organized.

SMIVAI keeps my caregiver connected.

SMIVAI helps my doctor understand my progress.

The product should feel like:

Healthcare technology that feels human, simple and caring.

⸻

51. FINAL QUALITY CHECK

Before completing implementation, verify:

Visual Quality

* Is the UI polished?
* Does it feel premium?
* Is the 3D treatment subtle and professional?
* Are the pastel colors harmonious?
* Is the warm ivory background consistent?
* Is the calm blue used appropriately?
* Is the typography highly readable?
* Does the interface feel human?

Elderly Accessibility

* Are buttons large?
* Is text readable?
* Are important actions obvious?
* Are icons recognizable?
* Is navigation simple?
* Is contrast sufficient?
* Is the interface non-intimidating?

Product Functionality

* Do all major buttons work?
* Do all major routes work?
* Does authentication work?
* Does role-based access work?
* Do games work?
* Do memories work?
* Do reminders work?
* Does progress work?
* Does Talk with SMIVAI work with available infrastructure?
* Does DONE immediately terminate voice interaction?
* Do Free/Premium restrictions work?
* Do caregiver limits work?
* Do doctor limits work?
* Does patient authorization work?

Product Identity

The final result must clearly look like:

SMIVAI

It must NOT look like:

* A generic Flutter app
* A generic healthcare dashboard
* A generic SaaS template
* A copy of the reference design

Use the reference only as inspiration for its quality, warmth, spacing, 3D depth, accessibility, visual polish, and emotional tone.

Create a unique SMIVAI product identity from those principles.

⸻

FINAL REQUIREMENT

Do not merely describe what should be built.

BUILD AND IMPLEMENT THE EXPERIENCE DIRECTLY INTO THE EXISTING SMIVAI APPLICATION.

Preserve existing functionality.

Extend missing functionality.

Connect the frontend to the available backend.

Use mock services only where real integrations are unavailable.

Ensure all major workflows are functional.

The final result should be:

Polished
3D
Elderly-friendly
Accessible
Human
Premium
Responsive
Interactive
Functional
Recognizably SMIVAI
~~~~


---

## 4. Phase 4 — UI/UX refinement iterations

### 4.1 Layout, background and header controls

- **Purpose:** Iterative fixes: clipped left panel, dull landing page, themed background illustrations on all pages, and font size / language controls in the header.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-20
- **Note:** A screenshot was attached to one or more messages in this entry; images are not reproducible in this document.

**Prompt 4.1.1** (2026-09-20 · screenshot attached)

~~~~text
fix this when we open first it look like this  in left part not visible complete;y
~~~~

**Prompt 4.1.2** (2026-09-20 · screenshot attached)

~~~~text
when we open it it look so dull the lending page look best the stickers in the background related
~~~~

**Prompt 4.1.3** (2026-09-20)

~~~~text
now add some sticker in all  page background

and

i want that font size and language option should be on top in patient page
~~~~

### 4.2 Language service configuration issue

- **Purpose:** Reports that the language section did not work without a Bhashini / AI4Bharat configuration.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-20

~~~~text
and i see the language section is not proper working 
 No Bhashini or AI4Bharat connection is configured, and this device has no  regional language voice and text completely  installed. Connect a pipeline in Settings to enable spoken Assamese.
~~~~

### 4.3 Colour and illustration enhancement

- **Purpose:** Asks for the UI to be enhanced to match the reference image's colours and surroundings, then confirms the result.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-20
- **Note:** A screenshot was attached to one or more messages in this entry; images are not reproducible in this document.

**Prompt 4.3.1** (2026-09-20 · screenshot attached)

~~~~text
enhance the ui according to the image colour and surrounding and add sticker that looks best enhanced it
~~~~

**Prompt 4.3.2** (2026-09-20)

~~~~text
i like  the present one thats good i dont want any changes
~~~~

### 4.4 Imagery: Northeastern people and role photographs

- **Purpose:** Replaces opening imagery with photographs representing Northeastern users, then extends role-appropriate (male/female) images to patient, caregiver and doctor screens without emoji.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-20
- **Note:** A screenshot was attached to one or more messages in this entry; images are not reproducible in this document.

**Prompt 4.4.1** (2026-09-20 · screenshot attached)

~~~~text
i want to change this photo only at starting  add some north eastern people photo  they using it
~~~~

**Prompt 4.4.2** (2026-09-20)

~~~~text
i want real photo people
~~~~

**Prompt 4.4.3** (2026-09-20 · screenshot attached)

~~~~text
i want like this
~~~~

**Prompt 4.4.4** (2026-09-20)

~~~~text
i am also thinking that adding image in the patient
~~~~

**Prompt 4.4.5** (2026-09-20 · screenshot attached)

~~~~text
i want to add the image here
~~~~

**Prompt 4.4.6** (2026-09-20)

~~~~text
i want to add the photo of patient   photo ai genrated as we add in the previously in the dahboard like that
~~~~

**Prompt 4.4.7** (2026-09-20 · screenshot attached)

~~~~text
i want that image should here also     and    if men is there than men image and if women is there  then woman image and 

image should be as like passport size
~~~~

**Prompt 4.4.8** (2026-09-20 · screenshot attached)

~~~~text
add image here also 
and give me prompt these images i dont like it
~~~~

**Prompt 4.4.9** (2026-09-20 · screenshot attached)

~~~~text
edit these only
~~~~

**Prompt 4.4.10** (2026-09-20)

~~~~text
NOW CHANGE THE CAREGIVIER AND DOCTOR ALSO NEW IMAGE
~~~~

**Prompt 4.4.11** (2026-09-20 · screenshot attached)

~~~~text
ADD EVERYWHERE WE NEED  I DONT WANT EMOJI IN THE IMAGE  PART
~~~~

**Prompt 4.4.12** (2026-09-20 · screenshot attached)

~~~~text
ADD IMAGES HERE ALSO  THERE IS MANY PLACES IN PATIENT CAREGIVER DOCTOR IMAGES ARE NOT THERE
~~~~

**Prompt 4.4.13** (2026-09-20 · screenshot attached)

~~~~text
HERE I WANT  TO BE A PREVIOUS  SAME
~~~~

**Prompt 4.4.14** (2026-09-20 · screenshot attached)

~~~~text
make like this
~~~~

**Prompt 4.4.15** (2026-09-20 · screenshot attached)

~~~~text
at caregiver add like this
~~~~

**Prompt 4.4.16** (2026-09-20 · screenshot attached)

~~~~text
now add same for patient and doctor also
~~~~

### 4.5 Header controls and demo-account placement

- **Purpose:** Renames header controls to written 'Language' / font-size buttons and moves 'Use a demo account' above the ABHA/Aadhaar field.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-21

**Prompt 4.5.1** (2026-09-21)

~~~~text
Change that existing language change button to written ‘language’ button and change that existing font size button to + ‘Aa’ -  two buttons so that it can change accordingly and 

Both changes should show in login homepage also


And remove that bug in patient page-  search option is hidding font size when we are doing to large and extralarge and onwards button fix that


And in left side options like home talk with smivai braingames showing - there is a option showing of unlock smivai premium add option of small cut butto in that box on right corner so that when someone cut it’s not visible anymore
~~~~

**Prompt 4.5.2** (2026-09-21)

~~~~text
Replace existing use a demo account above the abha or adhar id detail blank space 
so it is clearly visible in all three of the patien caregiver and doctor in that login page 

And in Patient page put today’s activities above the quick actions section 


And add one more option to quick action - Add notes and view notes in same box
~~~~


---

## 5. Phase 5 — Adaptive engine (Rasch model) and game progression

### 5.1 Rasch-model adaptive difficulty and same-language replies

- **Purpose:** Requests automatic difficulty adjustment from scores using the Rasch model, and companion replies in the language the user speaks.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-21
- **Note:** A screenshot was attached to one or more messages in this entry; images are not reproducible in this document.

**Prompt 5.1.1** (2026-09-21)

~~~~text
1. USING RASCH MODEL USE ADAPTIVE ENGINE SO THAT ALL OF THE GAMES LEVEL CHANGES ITSELF BY SEEING SCORE 
FOR EXAMPLE IF SOMEONE SCORE 2/10 then it’s difficulty level will be low for next game 

If someone score 8/10 then it’s difficulty level will be high


Accordingly using Ai





2. And when someone is talking in any language to smivai for example : like mera next task kya h in hindi smivai should reply in same language ki apko 8 baje medicine khana hai
~~~~

**Prompt 5.1.2** (2026-09-21 · screenshot attached)

~~~~text
add
~~~~

### 5.2 Play Again and level unlocking

- **Purpose:** Adds a Play Again option and Easy → Medium → Hard unlocking based on performance.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-22

~~~~text
After a patient completes a game, show a **“Play Again”** option for the same game. If the user performs well, automatically unlock the **next difficulty level**—for example, **Easy → Medium → Hard**. If the user does not perform well, keep the current difficulty available so they can replay and improve their score.
~~~~

### 5.3 Prompt compilation for faculty review

- **Purpose:** Asks for all prompts used so far to be compiled for the supervising professor.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-09-23

~~~~text
can you compile everything in the prompt that you have made  till now  i have to send to the professor
~~~~


---

## 6. Phase 6 — SIH 2026 full product development brief

### 6.1 Complete product development, UI/UX redesign, AI integration and deployment

- **Purpose:** Lead-engineer brief to turn the prototype into a polished, accessible, secure, API-connected product: AI integration, security, data and deployment readiness.
- **Status:** Original (verbatim)
- **Source:** Session B (19 Sep - 9 Oct 2026) · 2026-10-09

~~~~text
# SMIVAI — CARE CLOSER TO YOU
## SIH 2026 | Complete Product Development, UI/UX Redesign, AI Integration and Deployment

You are the lead full-stack engineer, AI engineer, UI/UX designer and security-focused architect working on our  **Smivai — Care Closer to You**.

Our objective is to transform the existing prototype into a polished, functional, accessible, secure and API-connected application that can be demonstrated at SIH 2026 and further developed into a real-world platform.

This is an existing project. Do not rebuild it from scratch.

The application already includes:
- AI conversation.
- Cognitive brain games.
- Memories and memory assistance.
- Reminders.
- Caregiver support.

The backend is primarily Python. Verify the actual architecture, technologies and implementations from the codebase rather than assuming that the existing features are fully functional.

# SECTION 1 — NON-NEGOTIABLE WORKFLOW

## 1.1 Inspect first. Do not code yet.

Before writing or modifying any code, inspect the existing codebase thoroughly.

You must first provide an audit covering:

**Technology and architecture**
- Frontend framework, programming languages, build tooling and dependencies.
- Python backend framework, application entry points and API routes.
- Actual folder structure and the purpose of important files.
- Database technology, schema, migrations and persistence strategy.
- Authentication, session/token handling and authorization.
- Frontend-to-backend communication.
- File uploads and storage.
- Existing third-party integrations and environment variables.
- Test suite, development commands and deployment configuration.

**Vercel deployment**
- Determine exactly what is deployed to Vercel.
- Determine where the Python backend runs.
- Explain frontend routing, backend endpoints, API URLs and environment configuration.
- Identify database persistence and file-storage limitations.
- Identify serverless execution limitations and any changes needed for reliable operation.

**Existing features**
For Home, conversation, brain games, memories, reminders, caregiver support, login, user profiles and every existing screen, explain:
- What already exists.
- What works and how it was verified.
- What is incomplete or mocked.
- Which files, routes, components and database models should be extended.
- What must be preserved to avoid regressions.

**Taste Skill UI/UX audit**
Inspect the actual interface and identify accessibility issues, visual inconsistencies, navigation problems, responsive-design defects and opportunities for improvement.

Finish the audit with a phase-wise implementation plan, required API credentials, risks, dependencies, database recommendations and testing strategy.

**STOP after the audit. Do not edit files until I explicitly say "go".**

## 1.2 One phase at a time

After I say "go", implement Phase 1 only.

After each phase, report:
1. What was implemented.
2. Every file created, modified or deleted.
3. UI/UX improvements made.
4. Tests executed and actual results.
5. Exact local testing commands and manual test steps.
6. Environment variables required in Vercel and the backend hosting environment.
7. Database migrations and external account configuration.
8. APIs still running in Demo mode and why.
9. Known bugs, limitations and remaining risks.

Then stop and wait for me to say "continue".

Never start the next phase automatically.

## 1.3 Preserve existing functionality

- Extend existing features instead of duplicating them.
- Reuse existing components, models, routes and services when appropriate.
- Preserve the current Smivai identity and recognizable design elements.
- Do not perform unnecessary rewrites or introduce competing implementations.
- Avoid breaking working features during UI improvements.
- Make changes incrementally and test affected functionality.

# SECTION 2 — TASTE SKILL AND COMPLETE UI/UX REDESIGN

## 2.1 Mandatory Taste Skill integration

I will install Taste Skill from:

https://github.com/Leonxlnx/taste-skill

Before making frontend changes:
1. Inspect the installed skill files and project setup.
2. Read the applicable `SKILL.md` instructions.
3. Use the frontend design skill to establish a coherent design direction.
4. Use the existing-project redesign workflow if it is available and applicable.
5. Apply the relevant skill throughout every phase.

Prefer `design-taste-frontend` for the design system and use the repository's appropriate redesign skill for auditing and improving the existing application.

If the skill is unavailable, explain that limitation. Never claim to have used it if you did not.

## 2.2 Design objective

Make Smivai look like a thoughtfully designed healthcare and cognitive-wellness product, not a generic AI dashboard or college-project template.

The interface should be:
- Calm, warm, reassuring and professional.
- Visually distinctive and memorable.
- Easy for elderly people and users with cognitive difficulties.
- Respectful of patients' dignity.
- Suitable for caregivers and healthcare professionals.
- Responsive across mobile, tablet and desktop.
- Consistent throughout the application.

Preserve the existing brand where appropriate, but improve the overall visual quality significantly.

## 2.3 Design system

Establish consistent:
- Colour palette and accessible contrast.
- Typography and heading hierarchy.
- Spacing and layout.
- Navigation and page structure.
- Buttons, forms, cards and dialogs.
- Icons, illustrations and status indicators.
- Charts, maps and data displays.
- Loading, empty, error, success and offline states.
- Responsive layouts and keyboard focus states.

Avoid excessive gradients, generic dashboard cards, tiny text, crowded layouts, unnecessary animation, excessive decoration and ambiguous icon-only actions.

Use real icons and illustrations where helpful rather than relying on emojis for important controls.

## 2.4 Dementia-friendly accessibility

Treat accessibility as a core product requirement.

- Aim for 18–20 px body text where practical.
- Use large, clearly labelled buttons, preferably with touch targets of at least 44 × 44 CSS pixels.
- Use short sentences and familiar words.
- Keep primary actions visible.
- Minimize unnecessary steps and cognitive load.
- Keep navigation predictable and consistent.
- Provide clear back, cancel, confirmation and recovery actions.
- Avoid time pressure and distracting animation.
- Respect reduced-motion settings.
- Support keyboard navigation, visible focus and screen readers.
- Communicate status using text as well as colour.
- Explain errors simply.
- Prevent accidental deletion, booking cancellation and sensitive submissions.
- Never infantilize users or portray dementia as a loss of dignity.

Patient screens should prioritize simplicity. Caregiver and professional screens may show more information while remaining accessible.

Improve the relevant screens in every phase, not just Home.

# SECTION 3 — PRODUCT IDENTITY AND AI ASSISTANT

## 3.1 Assistant name

Use **Lumi** as the proposed AI assistant name throughout the application.

Keep the main product name as:

**Smivai — Care Closer to You**

The conversational assistant is called **Lumi**.

Examples:
- Button: "Talk with Lumi".
- Greeting: "Hello! I'm Lumi. How can I help you today?"
- Memory interaction: "Lumi, help me remember something."
- Reminder interaction: "Lumi, remind me about my appointment."

Before implementing the rename, search the existing codebase for references to the current assistant name and update relevant user-facing labels, conversation prompts, speech-recognition configuration and documentation.

Do not blindly replace unrelated product branding, database identifiers or internal variables.

Make the name configurable where practical, so it can be changed without rewriting the application.

Test whether the speech system recognizes "Lumi" reliably in supported languages. A short name does not automatically guarantee recognition accuracy.

# SECTION 4 — GLOBAL BACKEND, SECURITY AND API RULES

## 4.1 Real APIs, not fake functionality

Our goal is a working system connected to real APIs.

Use mocks only when a required API credential is missing or a documented fallback is necessary.

Whenever a mock is active:
- Display a visible **"Demo mode"** indicator in the relevant interface.
- Clearly distinguish sample data from real data.
- Log why Demo mode is active without logging sensitive information.
- Never claim that a real booking, payment, delivery, notification or medical assessment occurred.
- Keep the mock behind the same service interface as the real integration.

If a configured real API fails, show a clear error and offer an appropriate retry or recovery path. Do not silently return fake success.

Do not invent API endpoints, credentials, provider capabilities or successful test results.

## 4.2 External API handling

All external API calls must go through the Python backend, except APIs explicitly designed for client-side use, such as browser geolocation and Firebase phone authentication.

Every external call must include:
- An explicit timeout.
- Bounded retries for suitable transient failures.
- Clear user-facing errors.
- Structured failure logging.
- Input and response validation.
- Rate limiting where appropriate.
- Secure credential handling.
- Tests for success, failure and missing configuration.

Do not blindly retry non-idempotent actions such as payments, bookings or order creation. Use idempotency keys or equivalent safeguards where supported.

Never expose secret keys in frontend code, public environment variables, source maps, logs or the repository.

## 4.3 Database and hosting

Determine whether the existing database and hosting architecture can support persistent, multi-user healthcare data.

If the application uses SQLite or another file-based database that is unsuitable for the deployed execution model, plan a migration to hosted PostgreSQL using Neon or Supabase.

Implement appropriate:
- Database migrations.
- Foreign keys, constraints and indexes.
- Transactions and concurrency controls.
- Connection pooling or suitable connection management.
- Backups and recovery procedures.
- Data migration and rollback procedures.

Do not migrate unnecessarily if the existing database is already suitable.

Vercel must not be treated as persistent file storage. Use appropriate object storage for uploaded prescriptions and other files.

## 4.4 Roles and authorization

Support these roles:
- Patient.
- Caregiver.
- Doctor.
- Pharmacy.
- Admin.

Protect every private API route and resource with server-side authentication, role checks and ownership checks.

Hiding a frontend button is not authorization.

Patients must not access another patient's records without proper authorization. Caregivers must only access records for which they have appropriate permissions.

## 4.5 Health data and Indian privacy requirements

Follow applicable Indian data-protection laws and rules, including the Digital Personal Data Protection Act, 2023, as applicable.

Before collecting or storing health information:
- Obtain explicit, informed consent where required.
- Explain the purpose in simple language.
- Record consent, its version, purpose and timestamp.
- Provide appropriate consent withdrawal and data-deletion workflows.
- Collect only necessary information.
- Define retention and deletion policies.
- Protect data in transit and at rest.

Consider applicable requirements for patient capacity, caregiver authority and legally valid consent. Do not assume a caregiver automatically has authority to consent for every patient.

Never store full Aadhaar numbers. Never log OTPs, passwords, tokens, payment credentials or full medical records.

# SECTION 5 — PHASE 1: CLEANUP AND FOUNDATION

## 5.1 Remove "Prototype" everywhere

Search the entire codebase for user-facing occurrences of "Prototype", including:
- Home and banners.
- Navigation and footer.
- Login and onboarding.
- Page headings.
- Browser titles and visible metadata.
- Dashboard labels.
- Placeholder descriptions and demo-only messaging.

Remove all unintended user-facing prototype labels.

Do not remove the required "Demo mode" indicator or unrelated internal documentation.

## 5.2 Database and role foundation

- Establish or improve the database schema.
- Set up migrations.
- Implement user and role models.
- Add server-side authorization foundations.
- Establish environment configuration and validation.
- Plan secure file storage.
- Create initial automated tests.

## 5.3 Shared Python API client

Create or improve a shared backend service layer for external API calls.

It should provide reusable timeout handling, bounded retries, logging, error normalization, configuration validation and appropriate request validation.

Use it throughout later phases rather than implementing inconsistent API handling in individual features.

## 5.4 UI foundation

Using Taste Skill, establish the shared design system and improve Home, global navigation and existing shared components.

Preserve existing features and make the main patient actions easy to find.

**Credentials:** No external service key should be necessary for the basic foundation. Database credentials may be required for a PostgreSQL migration.

# SECTION 6 — PHASE 2: AUTHENTICATION AND ABHA

## 6.1 Firebase phone authentication

Implement mobile-number login using Firebase Authentication phone OTP.

Requirements:
- Verify Firebase ID tokens in the Python backend.
- Protect API routes.
- Handle expired tokens and authentication errors.
- Rate-limit and protect OTP requests.
- Prevent unauthorized account access.
- Provide accessible login, logout and recovery flows.

## 6.2 ABDM ABHA integration

Use the official ABDM sandbox APIs to support:
- Creating an ABHA through the authorized Aadhaar OTP flow.
- Linking an existing ABHA number or address using the supported OTP flow.
- Viewing an ABHA profile and card where supported.

Never call UIDAI directly.

Aadhaar OTP must occur only through the authorized ABDM ABHA flow.

Never store the full Aadhaar number. Store only the last four digits where necessary and permitted, together with the required ABHA number and address.

Follow current official documentation, onboarding requirements and sandbox limitations. Do not claim production readiness based on sandbox success.

## 6.3 UI

Make authentication and ABHA linking simple, accessible and privacy-conscious. Clearly identify sandbox operations.

**Credentials:** Firebase project configuration and server-side Firebase Admin credentials; ABDM sandbox credentials and required access tokens.

# SECTION 7 — PHASE 3: RASCH MODEL AND AUTOMATIC GAME ADAPTATION

This phase is a critical product requirement.

The current difficulty selector or suggestion mechanism is not sufficient. Smivai must actually assess gameplay and automatically adapt the next level.

## 7.1 Rasch model

Implement the Rasch 1PL IRT model in Python:

P(correct) = 1 / (1 + exp(-(θ - b)))

Where:
- θ is estimated patient ability.
- b is estimated item or level difficulty.

Use suitable numerical methods and libraries such as NumPy and SciPy.

## 7.2 Actual assessment

Capture relevant gameplay data, including:
- Answers and correctness.
- Item or level difficulty.
- Session identifiers.
- Attempts and completed tasks.
- Response time when appropriate and reliably available.
- Historical performance.

Estimate ability for each session using a suitable, documented method.

Estimate item difficulties from suitable response data. Do not arbitrarily invent calibrated item parameters or treat initial difficulty settings as validated measurements.

Implement cold-start handling, minimum-data rules, missing-data handling and sensible defaults.

## 7.3 Automatic difficulty selection

After a completed game or level:
1. Update the patient's performance history.
2. Estimate the patient's ability using available response data.
3. Evaluate the current difficulty against the estimated ability and actual performance.
4. Select the next level automatically.
5. Increase difficulty gradually when performance supports progression.
6. Reduce difficulty or provide a more accessible level when the patient is struggling.
7. Avoid overreacting to one incorrect answer or one unusually successful session.
8. Save the decision and the relevant ability estimate.

Use configurable adaptation thresholds that can be tested and adjusted. Document the selected algorithm and its limitations.

Manual difficulty adjustments may exist as an accessibility override, but they must not replace automatic adaptation.

## 7.4 History and caregiver view

Save θ history and session results. Display progress trends in the patient view and the existing caregiver section.

Use understandable language and avoid misleading clinical interpretations.

Show this exact note:

"This is a progress-tracking aid, not a medical diagnosis."

## 7.5 Tests

Write unit tests for:
- Probability calculations.
- Ability estimation.
- Difficulty estimation.
- Automatic next-level selection.
- Cold starts and insufficient data.
- Missing responses and edge cases.
- Persistence and authorization.

**Credentials:** No external API key is required for the mathematical model.

# SECTION 8 — PHASE 4: LUMI AI ASSISTANT, VOICE AND CONVERSATION

Improve the existing assistant rather than building a duplicate conversation system.

First inspect the current speech-recognition provider, language model, conversation prompts, backend routes, microphone handling, conversation history and speech synthesis.

## 8.1 Better conversational intelligence

- Integrate an appropriate language model through the Python backend.
- Improve the existing system prompt and conversation pipeline.
- Provide context-aware, natural, relevant answers.
- Avoid generic, repetitive and unnecessarily long responses.
- Use authorized memories, reminders, motivation facts and skill information when relevant.
- Preserve appropriate conversation context.
- Ask one simple clarification question when necessary.
- Never expose another user's information.
- Do not invent medical facts or diagnoses.
- Provide safe general information and recommend professional care when appropriate.

## 8.2 Better voice recognition

Improve:
- Microphone capture and transcription.
- Noise handling and recognition feedback.
- Recognition of the name "Lumi".
- Handling of Indian accents to the extent supported by the provider.
- Language selection and supported-language detection.
- Silence, unclear speech and transcription failures.

Provide visible microphone, listening, processing and speaking states.

Use name or phrase biasing where supported by the speech provider. If necessary, evaluate wake-word handling, but do not implement or promise always-listening behaviour without explicit user consent and a technically reliable implementation.

Provide text input as a fallback.

## 8.3 Spoken responses

Integrate speech synthesis for supported languages.

Provide large play, pause and replay controls. Keep spoken responses consistent with displayed text.

## 8.4 Reliability

Every language-model and speech request must go through the backend and use the shared API client where applicable.

Use server-side keys, timeouts, bounded retries, error logging and clear fallbacks.

Show Demo mode if a mock language or speech provider is active.

Test actual speech input and audio output rather than assuming text input proves voice functionality.

**Credentials:** Select and document the required language-model, speech-to-text and speech-synthesis providers and their credentials after auditing the existing implementation.

# SECTION 9 — PHASE 5: DOCTORS, LOCATION, BOOKING AND CHARITY

## 9.1 Location and maps

Use browser geolocation with explicit permission.

If permission is denied or unavailable, allow manual pincode or district entry.

Use:
- Nominatim for reverse geocoding.
- Leaflet for maps.
- OpenStreetMap tiles.
- Overpass API for discovering nearby hospitals and clinics.

Follow Nominatim's usage policy, including a maximum of one request per second, a proper User-Agent and cached results.

Cache Overpass results appropriately and handle failures.

Show hospitals and clinics with available phone numbers, distance and directions links.

Classify Government and Private providers only when supported by reliable information. Do not infer ownership from missing data.

## 9.2 Doctor registration and verification

Allow doctors to register with:
- Registration number.
- Specialisation.
- Government or Private status.
- Clinic location.
- Consultation fee.
- Phone number.
- Available slots.
- Free or charity consultation availability.
- Experience information where verifiable.

Require admin verification before a doctor becomes publicly visible.

## 9.3 Doctor discovery

Show verified doctors nearest to the patient's location by default.

Use the haversine formula or another appropriate geographic distance method.

Provide filters for:
- Government or Private.
- Specialisation.
- Maximum distance.
- Consultation fee.
- Free or charity consultations.

Provide sorting by:
- Distance, nearest first by default.
- Cost, lowest first.
- Rating, highest first.

Support combinations of filters and sorting.

## 9.4 Ratings

Use authentic, verifiable ratings or appropriately collected patient reviews.

- Never invent ratings.
- Do not assign arbitrary default ratings.
- Show the rating source and review count where available.
- Distinguish third-party ratings from verified in-app reviews.
- Allow rating-based sorting only when comparable rating data exists.
- Protect patient identity and prevent fraudulent review manipulation.

## 9.5 Offline doctor contact

Make phone numbers prominently visible on doctor profiles.

Provide a large tap-to-call action.

Where feasible, cache a limited set of essential doctor contact details locally and safely, with a timestamp and an indication that the information may be outdated.

Patients must be able to call an already available phone number without an active internet connection, provided cellular calling is available.

Explain that live discovery, online booking and tracking require connectivity, while a cached contact number can still be called.

## 9.6 Booking

Implement this flow:

1. Select a doctor.
2. Choose an available slot.
3. Confirm the appointment.

Prevent double-booking through database constraints, transactions and appropriate concurrency handling.

Doctors must be able to accept, reschedule or cancel bookings.

Add confirmed appointments to the existing Reminders feature.

## 9.7 Notifications

Implement:
- In-app notifications.
- Email notifications through Resend.

Skip SMS for now.

Use idempotent notification processing where appropriate.

## 9.8 Charitable medical assistance

Create a proper financial-assistance workflow for patients who cannot afford consultations or eligible medicine expenses.

Before collecting donations, investigate the appropriate legal and operational structure in India. Determine whether a registered charitable trust, eligible nonprofit partner or other legally appropriate recipient is required.

Do not claim that Smivai operates a registered charitable trust unless it actually does.

Evaluate applicable requirements for charitable registration, tax treatment, donation receipts, accounting, payment processing and donor disclosures.

### Patient assistance
- Patients or authorized caregivers can request assistance.
- Collect only necessary information.
- Require authorized review and approval.
- Record decisions and protect patient privacy.

### Donations and accounting
Build a transparent, auditable donation ledger covering:
- Verified contributions.
- Donation receipts where applicable.
- Available fund balances.
- Approved assistance requests.
- Allocations and disbursements.
- Refunds and reversals.
- Reconciliation and transparency reporting.

Never represent a pending payment as received money.

### Payments
Integrate Razorpay Checkout in test mode initially.

Verify webhook signatures against the raw request body. Verify payment status server-side and process duplicate webhook events idempotently.

Do not collect or allocate funds through an unapproved arrangement.

### Sponsorship
Allow eligible doctor consultations and medicine orders to receive approved assistance.

Mark a booking or order as sponsored only when the required approval and verified payment or disbursement conditions are satisfied.

Never expose private patient details to donors.

## 9.9 Doctor and charity UI

Clearly display doctor status, contact information, consultation costs, ratings, distance, booking availability and assistance options.

Explain how charitable assistance works and how funds are accounted for without making unsupported promises.

**Credentials:** Resend API key, Razorpay test key ID and secret, webhook secret, and any required map/service configuration. Nominatim and Overpass do not ordinarily require conventional secret API keys, but their usage policies must be followed.

# SECTION 10 — PHASE 6: PHARMACY AND MEDICINE DELIVERY

## 10.1 Provider research first

Evaluate Truemed as a possible provider, but do not assume that a publicly accessible delivery API exists.

Verify the exact provider identity, official documentation, API access, geographic coverage, partner onboarding requirements, prescription handling, pricing and regulatory requirements.

Compare suitable alternatives based on actual API availability and their ability to support the intended workflow in the NER.

Use a suitable verified provider if available. Shiprocket may support logistics, but do not assume it supplies the entire pharmacy-ordering workflow.

If no suitable API is available, implement an authorized manual partner workflow or a clearly labelled Demo mode rather than fabricating an integration.

## 10.2 Nearby pharmacies

Discover pharmacies using Overpass with amenity=pharmacy.

Show nearest-first results, available phone numbers and directions links.

Cache results and handle service failures.

## 10.3 Partner pharmacy portal

Allow pharmacy registration with address and pincode.

Require admin verification before a pharmacy can accept patient orders.

## 10.4 Ordering

Implement:
1. Patient selects an eligible partner pharmacy.
2. Patient uploads a prescription where legally required.
3. Backend validates the order and required information.
4. Pharmacy accepts or rejects the order.
5. The application displays verified order status.

Secure uploaded files using appropriate storage, access controls, file validation and audit logging.

Do not bypass prescription requirements or support prohibited medicine transactions.

## 10.5 Delivery and tracking

Integrate the selected provider's official API to create shipments and retrieve tracking updates.

Handle provider failures, webhook verification and duplicate events.

Provide a WhatsApp click-to-chat link to the pharmacy as a backup where available.

Do not claim that an order was accepted, shipped or delivered without verified evidence.

## 10.6 UI

Make pharmacy selection, prescription upload, order status and tracking accessible and easy to understand.

**Credentials:** Credentials for the verified medicine-delivery or logistics provider. The actual requirements depend on the provider selected after research.

# SECTION 11 — PHASE 7: MOTIVATION AND LEARN A SKILL

## 11.1 Motivation

Build a collection of short, compassionate, evidence-based facts and encouragement for patients and caregivers.

Use reliable sources such as WHO and recognized Alzheimer's associations.

Each content item should store:
- Text.
- Source name.
- Source URL or verifiable reference.
- Category.
- Relevant publication or review details where available.
- Suggested practical action, if appropriate.

Cover meaningful themes such as social connection, enjoyable activities, daily routines, dignity, supportive communication and caregiver wellbeing.

Do not invent statistics, success stories or medical claims.

Do not suggest that dementia can be cured by positive thinking or brain games.

Display one suitable fact each day on Home. Allow Lumi to use the same verified content when relevant.

Translate content only when appropriate, and retain source information.

## 11.2 Learn a Skill

This feature must offer useful, progressive activities rather than a collection of basic, repetitive or meaningless tasks.

Provide activities based on the patient's interests, abilities and cultural context.

Potential categories include:
- Music, rhythm and familiar songs.
- Gardening and plant care.
- Drawing, painting and creative projects.
- Practical everyday routines and organizing familiar objects.
- Safe, simple cooking activities.
- Locally familiar crafts, music and everyday traditions.

These are starting categories. Select activities that provide meaningful engagement rather than assuming every activity suits every patient.

Each activity must include:
- A clear goal.
- Suitable difficulty.
- Short numbered instructions.
- Materials required where applicable.
- Illustrations or audio guidance where helpful.
- Start, pause, resume and completion flows.
- Progress tracking across sessions.
- Easier or more challenging variations.
- Safety precautions and caregiver involvement where appropriate.

Use consented preferences and progress to recommend relevant activities.

Avoid childish presentation, unnecessary competition and discouraging failure messages.

Never claim an activity prevents, reverses or treats dementia without appropriate evidence.

**Credentials:** No external API key is required for a curated, source-verified content library.

# SECTION 12 — PHASE 8: LANGUAGES, TRANSLATION AND SPEECH

## 12.1 Static UI translation

Use a proper i18n system and translation files for:
- English.
- Hindi.
- Assamese.

Do not hardcode translated UI text throughout individual components.

Ensure that language switching is visible and persistent.

## 12.2 Dynamic translation through Bhashini

Investigate the official Bhashini APIs and supported models.

Use Bhashini for translating dynamic content such as:
- Motivation facts.
- Skill instructions.
- Conversation replies.

Target supported NER languages, including Assamese, Bodo and Manipuri, according to actual service availability.

Cache translations in the database with appropriate language metadata.

Do not silently display an incorrect translation if translation fails.

Preserve the original text and identify translated content where appropriate.

## 12.3 Speech recognition and text-to-speech

Integrate supported Bhashini speech-to-text and text-to-speech services where suitable models exist.

Support voice interaction in available languages, including Hindi and Assamese, and extend to other NER languages as supported.

Provide large play, pause and replay controls.

Keep readable text available alongside audio.

Make speech failures understandable and recoverable.

Do not claim a language or voice is supported until it has been verified and tested.

**Credentials:** Bhashini API credentials and service-specific configuration, as required.

# SECTION 13 — PHASE 9: FINAL VALIDATION AND DOCUMENTATION

## 13.1 End-to-end tests

Test all major workflows as:
- Patient.
- Caregiver.
- Doctor.
- Pharmacy.
- Admin.

Verify:
- Login, token verification and role permissions.
- Consent, privacy and ownership checks.
- Database persistence and migrations.
- Automatic Rasch scoring and level adaptation.
- Actual speech recognition and spoken responses.
- Memories and reminders.
- Doctor verification and location-based discovery.
- Phone contact and offline cached contacts.
- Rating, fee and distance filters.
- Booking and double-booking prevention.
- Notifications.
- Donation processing and webhook verification.
- Assistance approvals and fund accounting.
- Prescription uploads and pharmacy ordering.
- Shipment tracking.
- Language switching, translation and speech synthesis.
- Responsive layouts and accessibility.
- API failure handling and Demo mode.

## 13.2 Visual verification

Use Taste Skill's relevant review workflow.

Inspect actual pages at mobile and desktop sizes.

Fix:
- Broken layouts.
- Inconsistent styling.
- Unclear navigation.
- Inaccessible controls.
- Missing loading and error states.
- Broken interactions.
- Misleading demo content.

Do not claim that a visual, integration or end-to-end test passed unless it was actually performed.

## 13.3 README

Document:
- Architecture and folder structure.
- Local development setup.
- Database configuration and migrations.
- All environment variables.
- External API account setup.
- Sandbox versus production configurations.
- Deployment instructions.
- Test commands.
- Storage and backup requirements.
- Known limitations.
- Every integration still running in Demo mode and why.

# SECTION 14 — ENVIRONMENT VARIABLES AND API CONFIGURATION

During the initial audit, identify which integrations already have configuration and which require new variables.

Create an accurate environment-variable inventory covering the applicable categories:

**Application and database**
- Frontend/backend API URLs.
- PostgreSQL connection settings.
- File/object-storage credentials.
- Session or token configuration.

**Authentication**
- Firebase public client configuration where required.
- Firebase Admin credentials on the server.
- ABDM sandbox credentials.

**AI and voice**
- Language-model provider credentials.
- Speech-to-text configuration.
- Speech-synthesis configuration.
- Bhashini credentials.

**Doctors and notifications**
- Resend API key.
- Map/service configuration where applicable.

**Payments and pharmacy**
- Razorpay test credentials and webhook secret.
- Verified pharmacy or delivery provider credentials.

Use the real variable names required by the selected libraries and providers. Do not create unnecessary placeholder variables.

Clearly distinguish public configuration from secrets.

Keep server secrets only in server-side environment variables. Never use a frontend-exposed environment-variable prefix for a secret.

Explain which variables belong in Vercel, which belong in the Python backend's hosting environment and which are optional.

# SECTION 15 — FINAL ACCEPTANCE CRITERIA

Smivai must not be considered complete merely because its screens or buttons exist.

The following must be demonstrated:

1. No unintended user-facing "Prototype" label remains.
2. The existing application continues to work after changes.
3. The interface is consistently improved using Taste Skill and dementia-friendly accessibility principles.
4. Real integrations are used whenever properly configured.
5. Mock integrations visibly display "Demo mode".
6. Rasch scoring automatically selects appropriate subsequent game difficulty based on recorded performance.
7. Lumi can recognize supported spoken requests, produce meaningful answers and speak responses aloud.
8. Motivation content is traceable to reliable sources.
9. Skill activities provide meaningful instructions and trackable progress.
10. Doctor discovery uses location-based distance calculations and supports Government and Private providers.
11. Phone numbers are prominently displayed, with offline access to safely cached contact details where implemented.
12. Doctor sorting and filtering work using real, available fee, rating and location data.
13. Booking logic prevents conflicting reservations.
14. Charitable assistance follows an auditable and legally appropriate process.
15. Payment status is verified server-side.
16. Pharmacy orders and delivery use a verified provider integration or are explicitly labelled as a fallback.
17. Translation and speech features work only for verified supported languages.
18. Every protected route enforces authorization.
19. Health-data consent and privacy controls are implemented appropriately.
20. Tests, environment configuration and deployment instructions are documented accurately.

# FINAL INSTRUCTIONS

- Start with the audit only.
- Read the codebase and Taste Skill instructions.
- Do not write or modify code before I say "go".
- Present the architecture audit, existing feature-to-file mapping, UI/UX audit, API requirements and phase-wise plan.
- Wait for my approval.
- Implement only one phase at a time.
- After each phase, report changes, tests, local instructions, environment variables, Demo mode status and known limitations.
- Stop after each phase and wait for "continue".
- Never invent API capabilities, successful tests, verified ratings, medical claims or payment results.
- Preserve existing working features and avoid unnecessary rewrites.
- Prioritize patient dignity, accessibility, privacy and reliability over decorative design.

**Begin by inspecting the existing Smivai codebase and producing the complete audit. Do not modify any files until I explicitly approve the plan by saying "go".**
~~~~


---

## 7. Phase 7 — Code analysis and product improvement (local, no deployment)

### 7.1 Code analysis and product improvement master prompt

- **Purpose:** Audit first, then phased improvements (phases 1–10) with honest demo labelling, no fabricated data, security and privacy, local development only.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
SMIVAI — COMPLETE CODE ANALYSIS & PRODUCT IMPROVEMENT MASTER PROMPT
SIH 2026 | Existing Project | Local Development Only
You are my lead full-stack engineer, Python backend engineer, AI/ML engineer, database architect, API integration specialist, security engineer, and QA engineer.
Your responsibility is to analyze my existing SMIVAI project, understand every requested improvement, map those improvements to the actual codebase, and implement them in controlled, approval-based phases.
Your objective is to improve the existing application without unnecessarily rebuilding it, duplicating features, breaking working functionality, or changing the established product identity.
1. EXISTING PROJECT — MANDATORY
I am already developing SMIVAI using Claude Code.
Project: SMIVAI — Care Closer to You
Purpose: An AI-powered cognitive-wellness, memory-assistance, and caregiver-support application, with additional healthcare features where supported by the existing project.
AI assistant name: HUN.
Use HUN consistently throughout the application, including the AI chat interface, voice assistant, greetings, onboarding, labels, assistant-related messages, and relevant documentation.
Do not use the previous assistant name Lumi in user-facing content or newly written assistant-related code. During the audit, identify existing occurrences and report them. Replace them only during an approved implementation phase.
The existing application may contain:

* AI conversation and assistant functionality.
* Cognitive brain games.
* Memories and memory assistance.
* Reminders and medication schedules.
* Caregiver support.
* User profiles and authentication.
* Doctor discovery and appointments.
* Location and maps.
* Medicine discovery or delivery.
* Progress tracking and cognitive scores.
* Voice input and text-to-speech.
* Charity information and other healthcare features.
* Other functionality discovered during the audit.

Treat these as features to inspect, not proof that every feature is implemented or working.
Mandatory project-preservation rules

1. Continue working inside the existing local project directory.
2. Do not create a new project or duplicate the application.
3. Do not replace the existing architecture unnecessarily.
4. Do not remove working features without justification and approval.
5. Inspect actual source files before proposing modifications.
6. Reuse existing components, services, database models, and integrations wherever appropriate.
7. Do not invent files, APIs, database schemas, credentials, or existing functionality.
8. Preserve the existing SMIVAI product identity, branding, and established user experience.
9. Make changes only when supported by the audit and approved scope.
10. Keep the code maintainable, modular, testable, and suitable for continued development.

2. LOCAL DEVELOPMENT ONLY — NO DEPLOYMENT
All implementation and verification must remain focused on local development.
Strict requirements:

* Do not deploy the application.
* Do not push code to production.
* Do not configure or modify Vercel for deployment purposes.
* Do not perform cloud-hosting or production deployment tasks.
* Do not introduce new deployment infrastructure.
* Do not automatically delete existing hosting configuration files.
* Do not modify deployment workflows as part of this task.
* Do not publish the application or upload project code to external hosting.
* Do not make external network requests unless required for an explicitly authorized, safe integration test.

You may inspect existing configuration files to understand the project. Do not delete existing configuration merely because it relates to hosting.
Implementation, startup, and testing must focus on the local environment.
External APIs may be integrated into the locally running application when authorized and properly configured. Local development does not prohibit legitimate API integrations.
Do not expose API keys or credentials while testing integrations.
3. PHASE ZERO — COMPLETE CODEBASE AUDIT
This phase is mandatory and read-only.
Before modifying anything, inspect the existing repository thoroughly.
During the initial audit, do not:

* Create files.
* Modify files.
* Rename files.
* Delete files.
* Format or rewrite existing files.
* Install packages or dependencies.
* Change environment configuration.
* Execute database migrations.
* Run destructive commands.
* Change the UI or application behaviour.
* Implement any feature.
* Perform deployment work.

Read-only inspection commands are permitted when safe.
3.1 Inspect the project architecture
Identify the actual implementation of:
Frontend

* Framework and programming language.
* Application entry points.
* Routes and pages.
* Components and shared UI.
* State management.
* API clients and service layers.
* Form validation.
* Authentication and session handling.
* Accessibility and responsive behaviour.
* Dependencies and package configuration.
* Existing tests and test commands.

Backend

* Python framework and application entry points.
* API routes and controllers.
* Business logic and service modules.
* Database access layer.
* Authentication and authorization.
* Background tasks and scheduling.
* File uploads and storage.
* External API integrations.
* Input validation and error handling.
* Logging and security controls.
* Dependencies and local startup commands.

Database and persistence

* Database engine and connection configuration.
* Existing models and tables.
* Relationships and constraints.
* Migration system.
* User-data ownership.
* Data persistence and initialization.
* Existing seed or demo data.
* Backup and recovery considerations.
* Local file and media storage.

Integrations
Inspect existing integrations for:

* AI models and conversational services.
* Speech recognition and text-to-speech.
* Maps and geolocation.
* Doctor discovery and appointment booking.
* Medicine search and pharmacy services.
* Authentication providers.
* Notifications and reminders.
* ABHA or ABDM-related functionality.
* Other external services.

Determine which integrations are real, mocked, incomplete, unavailable, or unverified.
3.2 Audit every relevant feature
For each feature, document:

1. Exact file paths.
2. Existing implementation.
3. Whether it works and how that was verified.
4. Whether the frontend connects to the actual backend.
5. Whether data persists after restarting the application.
6. Whether any functionality is mocked or hardcoded.
7. Bugs, incomplete functionality, and security risks.
8. Missing dependencies, API credentials, or provider approvals.
9. Required changes.
10. Existing functionality that must be preserved.

Do not assume that a visible UI means its backend functionality is implemented.
Do not claim something works merely because the relevant code exists.
3.3 Required audit report
Produce a detailed report containing:

1. Verified technology stack.
2. Architecture overview.
3. Important files and folder structure.
4. Feature-status table.
5. Verified bugs and incomplete functionality.
6. Database and persistence assessment.
7. Authentication and security assessment.
8. External APIs, credentials, and dependencies.
9. Existing HUN/Lumi naming occurrences.
10. Prioritized improvement roadmap.
11. Risks and potentially destructive changes.
12. Exact local startup and testing commands.
13. Separate, codebase-specific Claude Code prompts for every proposed implementation phase.

Use the following status categories:

* Working and verified.
* Implemented but not fully verified.
* Partially implemented.
* Mock or demo only.
* Broken.
* Missing.
* Blocked by external dependency or credentials.

Base every recommendation on the actual repository. Clearly distinguish verified findings from assumptions and items that could not be tested.
STOP AFTER THE AUDIT. Do not modify any files. Wait for my explicit `go` approval.
4. GLOBAL ENGINEERING RULES
These rules apply to every approved implementation phase.
Code quality

* Extend existing implementations instead of duplicating them.
* Preserve working functionality.
* Avoid unnecessary framework or architecture changes.
* Follow the repository's existing coding conventions.
* Keep frontend, backend, database, and integration logic appropriately separated.
* Use reusable components and services where appropriate.
* Validate inputs and external API responses.
* Handle errors explicitly.
* Use timeouts and bounded retries for external requests where appropriate.
* Avoid unnecessary dependencies.
* Do not silently swallow errors.
* Do not silently replace failed real API requests with fake success.

Security and privacy

* Enforce authorization on the backend.
* Validate user ownership of private resources.
* Store credentials in local environment variables, not source code.
* Never expose passwords, OTPs, access tokens, API keys, or sensitive health information in logs.
* Protect uploaded files and sensitive documents.
* Avoid exposing one user's information to another user.
* Apply appropriate rate limits and request validation where necessary.
* Do not disable security checks to make a feature appear functional.

Real versus demo functionality

* Clearly identify Demo mode wherever mock integrations are active.
* Never present mock data as verified real-world information.
* Never claim an appointment, medicine order, payment, delivery, notification, or medical assessment succeeded without actual verification.
* Report missing API credentials or permissions as blockers.
* Do not invent external API endpoints.
* Verify official provider documentation before implementing integrations.

Approval requirements

* Do not install dependencies without appropriate approval.
* Do not change database schemas or run migrations without appropriate approval.
* Do not perform destructive operations without explicit approval.
* Do not begin another phase automatically.
* After each phase, report results and wait for my explicit `continue`.

5. PHASE 1 — CLEANUP AND LOCAL FOUNDATION
After receiving `go`, implement the approved Phase 1 changes based on the audit.
Potential improvements include:

* Remove unintended user-facing "Prototype" labels.
* Preserve the existing layout, colours, branding, navigation, and components.
* Correct verified foundational bugs.
* Improve configuration validation.
* Improve backend input validation and error handling.
* Improve local database initialization and persistence where necessary.
* Improve safe database migration practices where required.
* Establish a reusable Python external-API client if needed.
* Add consistent loading, success, failure, and Demo mode states.
* Add or improve foundational tests.
* Identify existing assistant-name occurrences and replace them with HUN where approved.
* Ensure HUN is displayed consistently without unnecessarily redesigning the UI.

Do not rewrite the architecture or migrate databases unnecessarily.
Before any risky change, explain the impact and obtain approval.
At the end of Phase 1, provide the required phase report and wait for `continue`.
6. PHASE 2 — AUTHENTICATION, ROLES, AND ABHA
First inspect the existing authentication implementation. Do not create a second authentication system if the current one is suitable.
Where needed, support the following roles:

* Patient.
* Caregiver.
* Doctor.
* Pharmacy.
* Administrator.

Requirements:

* Enforce role checks on backend endpoints.
* Enforce resource ownership and appropriate permissions.
* Prevent unauthorized access to patient data.
* Handle sessions, token expiry, and authentication errors securely.
* Ensure that frontend role restrictions are not treated as a replacement for backend authorization.

Firebase OTP
If Firebase phone OTP is required:

* Inspect the existing integration.
* Verify Firebase ID tokens on the Python backend using the official verification mechanism.
* Handle expired, invalid, and missing tokens.
* Never trust a client-supplied user ID without verifying authorization.

ABHA and ABDM
Investigate official ABDM sandbox documentation and identify supported workflows for:

* ABHA creation where authorized and supported.
* ABHA linking where supported.
* Profile-related workflows where supported.

Do not implement unauthorized direct UIDAI access.
Do not store full Aadhaar numbers.
Do not claim production ABHA functionality when only a sandbox integration exists.
If authorization, credentials, or provider access are missing, document the blocker.
Keep sandbox and production capabilities clearly distinguished.
Test authentication, role permissions, resource ownership, and failure cases.
7. PHASE 3 — RASCH MODEL AND AUTOMATIC BRAIN-GAME ADAPTATION
Inspect the existing cognitive games, game sessions, item data, and scoring system before implementing changes.
Where appropriate, implement the Rasch 1PL model:
[
P(X_{ni}=1)=\frac{1}{1+\exp[-(\theta_n-b_i)]}
]
Where:

* (\theta_n) represents estimated user ability.
* (b_i) represents item difficulty.
* (P(X_{ni}=1)) represents the modeled probability of a correct response.

Requirements
Data collection
Record relevant actual gameplay data, including:

* User and session identifiers.
* Game and item identifiers.
* Item difficulty.
* Correctness of each response.
* Number of attempts.
* Completion status.
* Relevant timing information where appropriate.
* Historical performance.

Use the existing database structure where suitable.
Ability estimation and calibration

* Estimate user ability using a documented, appropriate method.
* Calibrate item difficulties using suitable response data when available.
* Handle cold starts, insufficient observations, and missing data.
* Define reasonable fallback behaviour.
* Avoid presenting uncalibrated parameters as validated measurements.
* Avoid unstable estimates from insufficient gameplay.

Automatic difficulty adjustment

* Update performance history after completed sessions.
* Select an appropriate next difficulty automatically.
* Persist the selected level.
* Apply the selected level to the next game session.
* Increase difficulty gradually when performance supports progression.
* Reduce difficulty when appropriate.
* Avoid abrupt changes based on a single response.
* Keep manual accessibility overrides separate from automatic adaptation.
* Ensure that automatic selection does not break existing game logic.

Verification
Test:

* Probability calculations.
* Ability estimation.
* Difficulty selection.
* Cold-start behaviour.
* Persistence between sessions.
* Manual overrides.
* User isolation and authorization.

Display this disclaimer in the relevant progress interface:
"This is a progress-tracking aid, not a medical diagnosis."
Do not claim that a brain game diagnoses, prevents, or treats a medical condition.
8. PHASE 4 — HUN AI ASSISTANT AND VOICE
The application's AI assistant must be named HUN.
Inspect the existing conversation system, model integration, speech pipeline, and assistant-related UI before modifying them.
Do not create a duplicate assistant or replace a suitable existing model integration unnecessarily.
8.1 Conversational intelligence
Improve the existing assistant with:

* Context-aware conversations.
* Appropriate conversation history.
* Authorized retrieval of memories and reminders.
* Concise, understandable responses.
* Clear uncertainty when information is incomplete.
* Safe general health information.
* Appropriate handling of health-related questions.
* Protection against revealing another user's data.
* Reliable error handling and fallback behaviour.

HUN must not claim to diagnose medical conditions or replace a qualified healthcare professional.
Only retrieve private memories, patient records, and reminders after verifying authorization.
8.2 HUN naming consistency
Use HUN consistently in:

* Assistant display name.
* Chat interface.
* Welcome messages and greetings.
* Voice assistant labels.
* Assistant-specific onboarding.
* Relevant help text.
* Assistant-related documentation.
* Newly created assistant-related components and tests.

Inspect old naming references during the audit.
Do not indiscriminately rename unrelated internal variables, historical database fields, third-party identifiers, or configuration keys when doing so could break compatibility.
If renaming an internal identifier or stored value is necessary, explain the impact and obtain approval where appropriate.
Do not change the established product identity of SMIVAI.
8.3 Voice assistant
Improve supported voice features where technically feasible:

* Microphone capture.
* Speech transcription.
* Recognition of the wake word "HUN" where supported by the chosen implementation.
* Supported languages and accents.
* Listening, processing, and speaking indicators.
* Text input as a fallback.
* Text-to-speech responses.
* Large, accessible playback controls.
* Microphone permissions and error handling.
* Clear handling of transcription failures.
* Appropriate audio playback controls.

Do not claim that continuous background wake-word detection works unless the actual implementation supports and verifies it.
Use the existing speech provider if suitable. Select another provider only when justified by the audit.
Route external model and speech requests through the Python backend where appropriate.
Keep provider credentials private. Use explicit timeouts, bounded retries, and clear failure handling.
Test actual voice input and audio output separately from text-only conversation.
If an API key or provider subscription is required, document the requirement rather than inventing credentials.
9. PHASE 5 — DOCTORS, LOCATION, APPOINTMENTS, AND CHARITY
Inspect the current implementation before introducing new services.
Where required and technically supported:
Location and maps

* Use browser geolocation with explicit user permission.
* Provide manual location entry if permission is denied.
* Handle unavailable or inaccurate location data.
* Integrate a verified maps or geocoding provider if necessary.
* Keep provider credentials secure.

Doctors and clinics

* Display verified doctor and clinic information.
* Avoid inventing doctor records, ratings, addresses, or availability.
* Clearly distinguish actual provider data from demo records.
* Use appropriate location and search filters.

Appointments

* Display appointment availability only when verified.
* Implement real booking only through an authorized provider with documented APIs.
* Prevent duplicate bookings using appropriate safeguards.
* Confirm bookings only after actual provider confirmation.
* Handle booking failures, cancellation, and provider timeouts.
* Persist confirmed booking information securely.

Charity

* Use verified charity information and official links.
* Do not fabricate donations or payment confirmations.
* Do not claim that a donation succeeded without provider confirmation.

If an external provider requires approval, payment, or credentials, document the dependency and use clearly labelled Demo mode only where appropriate.
10. PHASE 6 — MEDICINE DISCOVERY AND HOME DELIVERY
First inspect whether medicine-related functionality already exists.
Determine whether an authorized pharmacy or e-pharmacy provider offers suitable APIs for the intended Indian market.
Do not assume that a free public API supports real ordering or home delivery.
Investigate the following capabilities:

1. Medicine search and verified product information.
2. Inventory and pricing.
3. Location-based serviceability.
4. Prescription requirements.
5. Cart and checkout.
6. Order creation and confirmation.
7. Delivery tracking.
8. Cancellation and refund handling.

Integration requirements

* Verify official provider documentation.
* Determine whether the provider supports the required API operations.
* Check authentication, credentials, access permissions, and commercial restrictions.
* Identify whether API access is free, paid, restricted, or unavailable.
* Never invent endpoints or API credentials.
* Never bypass prescription requirements.
* Do not automatically substitute medicines.
* Store uploaded prescriptions securely.
* Validate uploaded files and restrict unsafe file types.
* Prevent public access to private prescriptions.
* Use real provider confirmation for order and delivery status.
* Handle provider errors without falsely reporting success.
* Never fabricate inventory, prices, delivery estimates, or successful orders.

If no authorized ordering API or required credentials are available:

* Explain the exact blocker.
* Identify which functionality can be implemented locally.
* Clearly separate medicine-information functionality from real ordering.
* Use Demo mode only when clearly labelled.
* Do not present Demo mode as real medicine delivery.

Do not claim that a real order was placed unless the authorized provider actually confirms it.
11. PHASE 7 — MEMORIES, REMINDERS, AND CAREGIVER SUPPORT
Improve the existing features instead of duplicating them.
11.1 Memories

* Persist memories reliably.
* Enforce user ownership.
* Allow appropriate editing and deletion.
* Retrieve memories only for authorized users.
* Prevent one user from accessing another user's memories.
* Avoid sending unnecessary sensitive information to external AI providers.
* Handle missing or deleted memory records safely.

11.2 Reminders
Support relevant:

* Appointments.
* Activities.
* User-defined medication schedules.
* Other reminders supported by the existing application.

Requirements:

* Persist reminders.
* Prevent duplicate scheduling.
* Handle time zones correctly.
* Handle scheduling failures and retries.
* Respect reminder permissions and user preferences.
* Avoid relying solely on temporary in-memory tasks for reliable long-running scheduling.
* Verify actual notification delivery before claiming it succeeded.

Do not assume that a reminder stored in a database has automatically been delivered to the user.
11.3 Caregiver support

* Maintain explicit patient-caregiver relationships.
* Respect consent and access permissions.
* Show understandable activity and progress summaries.
* Protect private patient information.
* Allow appropriate permission review and revocation.
* Enforce access restrictions on the backend.
* Avoid assuming that every caregiver is automatically authorized to access all patient records.

Test memory persistence, reminder scheduling, and caregiver authorization.
12. PHASE 8 — DATABASE, PRIVACY, AND SECURITY
Assess the existing database and keep it if it is suitable.
Do not migrate to a different database merely for architectural preference.
Where improvements are needed:

* Add safe database migrations.
* Use foreign keys, constraints, and indexes appropriately.
* Maintain data integrity.
* Enforce user isolation.
* Use transactions for important operations.
* Protect against unauthorized resource access.
* Improve backup and recovery instructions.
* Use suitable persistent storage for uploaded files.
* Review sensitive-data access and retention.
* Provide appropriate deletion mechanisms.
* Protect credentials and secrets.
* Improve validation and error handling.

Indian data protection
Review applicable Indian data-protection requirements, including the Digital Personal Data Protection Act, 2023, and applicable rules and commencement provisions.
Assess appropriate:

* Consent mechanisms.
* Data minimization.
* Access control.
* Data retention.
* Data deletion.
* Protection of sensitive health-related information.
* Patient and caregiver permissions.

Do not claim legal compliance without a documented assessment and appropriate legal review.
Do not assume a caregiver automatically has authority to consent for every patient.
Any database schema change, migration, or potentially destructive operation must be explained and approved before execution.
13. PHASE 9 — TESTING AND LOCAL VERIFICATION
Test every implemented phase locally.
Use the testing framework already present in the repository where practical.
Where appropriate, include:

* Python unit tests.
* API integration tests.
* Frontend component tests.
* Database tests.
* Authentication and authorization tests.
* User-ownership and privacy tests.
* Automatic brain-game adaptation tests.
* Memory persistence tests.
* Reminder scheduling tests.
* HUN text-conversation tests.
* Voice input and audio-output tests.
* Mocked external-provider tests.
* Missing-credential tests.
* API failure and timeout tests.
* Accessibility checks.
* Responsive-behaviour checks.
* Regression tests for existing functionality.

Testing rules

* Run actual commands supported by the repository.
* Do not invent test results.
* Do not report a test as passed if it was not executed.
* Distinguish unit tests, mocked integration tests, and real external-service tests.
* Do not claim real external APIs were tested if only mocks were used.
* Report failures and unresolved issues honestly.
* Verify that existing functionality continues to work.
* Keep testing local unless a specific external integration test has been authorized.

If a test cannot be executed because of missing dependencies, credentials, or environment limitations, explain the reason.
14. PHASE 10 — DOCUMENTATION
Update local project documentation as needed after implementation.
Documentation must match the actual code.
Include:

* Verified architecture.
* Project folder structure.
* Local setup instructions.
* Environment variable reference.
* Database setup.
* Migration instructions.
* API documentation.
* Local startup commands.
* Test commands.
* External integration setup.
* Required credentials and provider permissions.
* Demo versus real functionality.
* Known limitations.
* Troubleshooting instructions.
* Relevant security and privacy considerations.
* HUN assistant configuration and supported capabilities.

Do not include actual secrets in documentation.
Do not add deployment instructions or perform deployment work as part of this task.
Do not document a feature as complete unless the implementation and its status support that claim.
15. REQUIRED REPORT AFTER EVERY IMPLEMENTATION PHASE
After implementing an approved phase, provide a clear report containing:

1. Summary of completed changes.
2. Every file created, modified, renamed, or deleted.
3. Reason for each significant change.
4. Tests executed and their actual results.
5. Exact local startup and verification commands.
6. Required environment variables and credentials.
7. Database changes and rollback considerations.
8. APIs operating in Demo mode and the reason.
9. Real integrations verified and the verification method.
10. Known bugs, limitations, and unresolved risks.
11. Any existing functionality that could be affected.
12. Remaining work for future phases.

Use clear status labels such as:

* Completed and verified.
* Implemented but not fully verified.
* Blocked by credentials or external approval.
* Demo only.
* Not implemented.
* Failed verification.

Do not start the next phase automatically.
After every phase, stop and wait for my explicit `continue` approval.
16. FINAL EXECUTION INSTRUCTIONS
Follow this workflow strictly.
First: Audit
Inspect the existing local SMIVAI repository.
Identify exactly what is implemented, what is broken, what is missing, and what should change.
Prepare a codebase-specific improvement plan with separate implementation prompts for each proposed phase.
During this initial audit:

* Do not edit files.
* Do not install packages.
* Do not modify the database.
* Do not execute migrations.
* Do not perform destructive operations.
* Do not deploy or push code.
* Do not implement features.

Second: Wait for approval
After delivering the complete audit report and implementation roadmap, stop and wait for my explicit message:
`go`
Third: Implement incrementally
After I approve, implement only the approved phase.
Inspect the relevant files, make justified changes, and test them locally.
Do not silently expand the scope.
Fourth: Report and wait
After each phase, provide the complete implementation report described in Section 15.
Then stop and wait for:
`continue`
Do not start another phase until I explicitly approve it.
FINAL NON-NEGOTIABLE RULE
First inspect the existing local SMIVAI codebase. Produce a verified audit and a codebase-specific improvement roadmap. Do not change anything during the initial audit. Wait for my `go` approval before implementing any changes.
The assistant name must be HUN, and all development must remain local. Preserve existing functionality, avoid unnecessary redesigns, use real integrations only when authorized and verifiable, and report limitations honestly.
~~~~

### 7.2 Companion renamed to HUN

- **Purpose:** Renames 'Talk with SMIVAI' to HUN and authorises the work to proceed.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
talk with smivai name should be changed to HUN 
and 
go
~~~~

### 7.3 Continuation instructions

- **Purpose:** Authorises continued execution of the phased plan.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

**Prompt 7.3.1** (2026-10-09)

~~~~text
continue
~~~~

**Prompt 7.3.2** (2026-10-09)

~~~~text
continue
~~~~

**Prompt 7.3.3** (2026-10-09)

~~~~text
continue
~~~~

**Prompt 7.3.4** (2026-10-09)

~~~~text
continue  till end
~~~~

### 7.4 Charity feature follow-up

- **Purpose:** Asks where the charity feature is in the application.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
where is charity  thing
~~~~


---

## 8. Phase 8 — HUN, Facts, doctor sorting, Rasch, charity, donor and payments

### 8.1 Batch implementation brief (sections 1–11 and final acceptance gate)

- **Purpose:** Defines HUN personal-data conversation, sourced daily Facts, doctor sorting by rating/fee/distance, a NumPy/SciPy Rasch backend, charity applications with dual approval and a ledger, the Donor role, and Razorpay test mode, followed by a requirements-to-tests acceptance gate.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

**Prompt 8.1.1** (2026-10-09)

~~~~text
You are working on the existing Smivai application, an AI-powered cognitive gaming, memory assistance, and caregiver-support platform for elderly people experiencing dementia or memory difficulties, particularly in India's North Eastern Region.

Your task is to inspect the existing implementation, identify the mistakes and incomplete features listed below, and fix them properly.

This is a targeted improvement task. Previous development work has already been performed, but important features remain broken or incomplete.

**Do not rebuild the application from scratch. Do not redesign its UI. Do not use Taste Skill.**

Preserve the current design, layout, colors, typography, navigation, components, and branding. Make only the minimum necessary interface changes to correct functionality or add the explicitly requested controls.

The product remains Smivai, and the AI assistant's name is **Hun**.

---

# 1. MANDATORY WORKFLOW: AUDIT BEFORE FIXING

Do not immediately start editing files.

First inspect the current repository and, where possible, compare it with the deployed application.

Identify:

- How Hun's conversation and AI response pipeline currently works.
- How user profiles, names, family members, memories, and conversation history are stored.
- How Daily Facts content is selected and displayed.
- How doctor data is retrieved, filtered, sorted, and rendered.
- How cognitive games record performance and select difficulty levels.
- Whether the Rasch model has actually been implemented, and how it affects gameplay.
- How the charity section, donor registration, payment workflow, and application approval currently work.
- Which database, backend services, API integrations, and environment variables are involved.
- Which features are functional, partially implemented, mocked, or broken.

Trace each problem to the actual relevant files and logic.

Do not assume that a feature works simply because its page or button exists.

Prepare a concise audit table with these columns:

| Requirement | Current implementation | Identified problem | Files involved | Proposed fix |
|---|---|---|---|---|

Then provide a short implementation plan, identify any missing credentials or provider access, and wait for my approval before changing code.

After I approve, implement the corrections in small, logical batches. After each batch, report the files changed, tests performed, remaining limitations, and manual verification steps. Wait for my instruction to continue before starting the next batch.

Do not claim that a fix works unless it has been tested.

---

# 2. FIX HUN — AI ASSISTANT MUST UNDERSTAND BASIC QUESTIONS

Hun is currently unable to answer some basic questions reliably. For example, when asked the patient's name, it becomes confused even though that information already exists in Smivai.

This is a high-priority defect.

## 2.1 Access existing patient information

Hun must be able to access the authenticated user's existing, authorized profile information, including:

- Patient's name.
- Relevant family members and their saved relationships.
- Saved personal memories.
- Existing preferences and language settings.
- Other relevant information explicitly saved in the platform and authorized for conversational use.

Do not create duplicate profile fields or an unnecessary second memory database if the information already exists.

Investigate the existing database schema and reuse the appropriate data sources.

For example:

If the patient's name is recorded as Aruna, and the patient asks:

- "What is my name?"
- "Do you remember me?"
- "Who is my daughter?"
- "What did I tell you about my family?"
- "What memories have I saved?"
- "What did I ask you to remind me about?"

Hun should retrieve the appropriate information from the authenticated user's existing records and respond naturally.

These are illustrative examples. Use the actual authenticated user's data, not hardcoded names or demonstration records.

## 2.2 Use a reliable context-retrieval pipeline

Do not attempt to solve this problem only by changing the system prompt.

Investigate the full request pipeline and implement the necessary combination of:

1. Authentication and identification of the current user.
2. Retrieval of relevant profile and memory records.
3. Safe inclusion of the retrieved information in the model's context.
4. Appropriate intent recognition for common personal questions.
5. Conversation-history management.
6. Model response generation.
7. Output validation and error handling.

Where a question clearly asks for a stored fact, retrieve that fact from the database rather than relying on the language model to guess it.

For example, a question about the user's name should use the authenticated profile record as the source of truth.

Where necessary, implement simple deterministic handlers for common personal questions alongside the existing AI model. These should integrate with the current conversation interface rather than replace it.

## 2.3 Conversational continuity

Hun should respond appropriately to questions such as:

- "What is my name?"
- "Who is in my family?"
- "What did I tell you earlier?"
- "Do you remember the memory I saved?"
- "What should I do today?"
- "Can you tell me something encouraging?"
- "I am feeling lonely. Can we talk?"

Hun should also handle ordinary general-knowledge questions, greetings, follow-up questions, repeated questions, and simple requests without becoming confused.

It should recognize the difference between:

- Information stored in the user's profile.
- Information saved in the memory section.
- Information mentioned earlier in the current conversation.
- General knowledge.
- Information it does not know.

Never fabricate a personal memory or claim that the user previously said something that cannot be found in the available records.

If information is missing or ambiguous, Hun should politely ask a short clarifying question or acknowledge that it does not know.

## 2.4 Patient-friendly behavior

Hun should:

- Use the patient's name naturally when appropriate.
- Be warm, patient, respectful, and familiar.
- Use simple, clear sentences.
- Avoid robotic or repetitive replies.
- Avoid overwhelming the user with too much information.
- Handle repeated questions without frustration.
- Avoid speaking to elderly people in a childish or patronizing manner.
- Never treat dementia as a reason to disregard the patient's autonomy.

## 2.5 Voice and language

Preserve the existing interface while improving the underlying voice and conversation functionality where necessary.

Investigate:

- Speech-to-text accuracy.
- Recognition of the name "Hun".
- Transcription errors.
- Language selection and detection.
- Context passing between voice turns.
- Text-to-speech output.
- Microphone permissions and error handling.

Do not claim always-on wake-word recognition unless it is genuinely implemented and supported by the chosen technology.

Keep API keys on the backend. Use the existing provider if it is suitable; propose a provider change only when there is a clear technical reason.

## 2.6 Required tests

Test at least the following:

- Hun retrieves the correct name for different authenticated test users.
- Hun retrieves only information belonging to the authenticated user.
- Hun answers questions about saved family members and memories.
- Hun distinguishes saved information from unknown information.
- Hun does not fabricate personal details when data is missing.
- Hun handles follow-up questions and relevant conversation context.
- Hun handles ordinary general-knowledge questions.
- Hun handles AI-provider failure gracefully.

A response that simply says "I am having trouble understanding" to a straightforward question whose answer is already stored should be treated as a failure.

---

# 3. REPLACE THE EXISTING DAILY FACTS CONTENT

The existing Facts section still displays basic trivia such as "Octopuses have three hearts."

This does not satisfy the intended purpose of Smivai's motivational content.

**Keep one Facts section. Do not create separate Motivation, Success Stories, or Inspirational Quotes pages or sections.**

Improve the existing Facts section so that it contains a thoughtful mixture of three content types.

## 3.1 Real-life success stories

Include verified stories of people who achieved meaningful success, overcame difficulties, or made important contributions later in life.

Potential examples include:

- Colonel Harland Sanders and the development of KFC later in his life.
- People who developed new skills, created meaningful work, or made notable contributions in later adulthood.
- Verified stories of perseverance, learning, community service, creativity, or resilience.

Verify historical details against reliable sources before publishing them.

For example, do not repeat an oversimplified claim that Colonel Sanders became successful overnight at a particular age. Present the actual historical context accurately.

The aim is to demonstrate that age does not automatically eliminate the possibility of learning, contribution, purpose, or meaningful achievement.

Do not imply that every person will achieve commercial success or that success is necessary for a valuable life.

## 3.2 Encouraging messages and quotations

Include short, dignified, encouraging messages for elderly people and caregivers.

Messages should support:

- Self-worth and dignity.
- Patience with oneself.
- The value of everyday achievements.
- Family relationships and social connection.
- Caregiver appreciation.
- Hope without unrealistic promises.
- Meaningful participation at any age.

Use quotations only when their attribution can be verified. If a message is original, label it as an original Smivai message rather than attributing it to a famous person.

Avoid generic filler, manipulative emotional language, and repetitive inspirational slogans.

## 3.3 Meaningful, evidence-based facts

Include useful information about subjects such as:

- Healthy ageing.
- Social connection.
- Hobbies and meaningful activity.
- Learning and curiosity throughout life.
- Caregiver wellbeing.
- Dementia awareness and respectful communication.
- Everyday routines and participation.

Use reliable sources such as government health organizations, established dementia-support organizations, recognized medical institutions, and peer-reviewed research where appropriate.

Do not make unsupported claims that cognitive games cure dementia, reverse cognitive decline, or guarantee improved memory.

## 3.4 Content quality and daily rotation

- Use the existing Facts section and existing visual style.
- Display an appropriate amount of content at a time.
- Rotate or select content so that users do not see the same basic facts repeatedly.
- Use a meaningful daily selection mechanism.
- Persist content identifiers or selection history if needed to avoid immediate repetition.
- Provide source attribution and links for factual claims and historical stories where available.
- Clearly distinguish verified facts, historical stories, and original encouraging messages.
- Do not fabricate citations, statistics, personal stories, or medical claims.
- If the network is unavailable, use previously cached, verified content where appropriate.

Create a content collection with enough quality material to demonstrate meaningful rotation. Avoid merely replacing a few trivia strings with a few equally shallow motivational strings.

If external content APIs are unavailable, use a curated, source-verified content dataset rather than pretending to retrieve live information.

## 3.5 Required tests

Verify that:

- The existing Facts section displays the new content types.
- Daily selection and rotation work.
- The same content is not repeatedly selected due to a broken selection mechanism.
- Content sources and attribution are stored and displayed correctly.
- The existing page and navigation remain intact.
- The section works with appropriate cached content if online retrieval is unavailable.

---

# 4. FIX DOCTOR SORTING — THREE FUNCTIONAL CRITERIA

The existing Book a Doctor sorting functionality is inadequate because it effectively sorts by address rather than the selected criterion.

Correct the underlying logic.

The interface must provide three independently selectable sorting options:

1. Rating.
2. Consultation fees.
3. Distance.

Preserve the current page and its visual design. Make only the necessary changes to the sorting controls and result handling.

## 4.1 Sort by patient rating

- Sort by actual, available ratings from legitimate sources.
- Support highest-rated-first ordering.
- If the existing interface supports ascending and descending order, ensure both work.
- Do not invent ratings for doctors.
- Do not treat missing ratings as zero-star ratings without an explicit product rule.
- Clearly distinguish doctors with no ratings from doctors with low ratings.
- If the application stores patient reviews, ensure they are associated with the correct doctor and follow the existing verification rules.

## 4.2 Sort by consultation fees

- Support lowest-fee-first ordering.
- Support highest-fee-first ordering if consistent with the current UI.
- Use the actual numeric consultation fee, not a formatted text string or address.
- Handle missing or unknown fees explicitly.
- Do not present an unknown fee as free.
- Clearly distinguish free consultations from unavailable fee information.

## 4.3 Sort by distance

- Calculate or use the actual distance from the user's permitted location to the doctor or facility.
- Support nearest-first ordering.
- If supported by the existing UI, provide farthest-first ordering.
- Use coordinates or a suitable geographic calculation rather than alphabetical address sorting.
- Request geolocation permission where necessary.
- If precise location is unavailable or denied, offer the existing supported fallback, such as pincode, district, or manual location selection.
- If a distance cannot be calculated, show an appropriate unknown state rather than inventing a distance.

## 4.4 Sorting must actually change the results

The selected criterion must determine the order of the returned results.

- Connect the control to the actual sorting implementation.
- Ensure the sorting logic uses the correct data field.
- Apply the selected sort after the relevant filtering operations.
- Handle pagination or server-side sorting correctly if present.
- Preserve the selected criterion when the page updates, where appropriate.
- Ensure that switching from rating to fees or distance genuinely changes the ordering when the underlying data warrants it.
- Do not simply change the selected label while keeping the original result order.

If doctor data comes from a backend, determine whether sorting should occur server-side or client-side and use a consistent approach.

## 4.5 Required tests

Create deterministic test records with deliberately different:

- Ratings.
- Consultation fees.
- Geographic distances.

Verify that each sorting option returns the expected order.

Also test:

- Missing ratings.
- Missing fees.
- Missing coordinates.
- Empty result sets.
- Equal values.
- Switching between all three criteria.
- Geolocation denial or unavailable location.

---

# 5. IMPLEMENT THE RASCH MODEL AND AUTOMATIC DIFFICULTY PROPERLY

The existing Rasch model is not behaving as required.

The goal is not simply to show a difficulty score or let the user select Easy, Medium, or Hard manually.

**The system must assess actual gameplay and automatically select the next appropriate difficulty.**

## 5.1 Expected user experience

Consider this example:

1. A patient opens Picture Matching for the first time.
2. The game starts at Easy.
3. The patient completes several picture-matching rounds successfully.
4. Smivai records the actual responses and relevant performance data.
5. The model estimates the patient's performance relative to item difficulty.
6. The application determines that a more challenging level is appropriate, based on sufficient evidence and configured progression rules.
7. The next game automatically opens at Medium or Hard, depending on the available evidence and the game's supported levels.
8. The selected difficulty is persisted and used on the next visit.

If the patient repeatedly struggles at a harder level, the system should respond appropriately by reducing difficulty or providing a more manageable challenge.

The system must not require the patient to manually select the new level.

## 5.2 Implement a genuine Rasch-based assessment

Inspect the existing game implementation and model before making changes.

Where suitable, use the one-parameter logistic Rasch model:

P(correct) = 1 / (1 + exp(-(θ - b)))

Where:

- θ represents the user's estimated ability.
- b represents the difficulty of the relevant item.
- P(correct) represents the modeled probability of a correct response.

Use an appropriate numerical implementation in the existing Python backend, using libraries such as NumPy and SciPy where suitable.

Do not label a simple arbitrary points counter as a Rasch model.

If the existing game items do not have defensible difficulty parameters or enough response data to estimate them reliably, document the limitation and implement a defensible initialization and calibration strategy.

Do not claim statistically validated measurement if the item parameters have not been appropriately calibrated.

## 5.3 Record actual gameplay

Record the relevant data for each completed attempt, such as:

- User identifier.
- Game identifier.
- Item or round identifier.
- Item difficulty parameter or configured difficulty.
- Correct or incorrect response.
- Completion status.
- Attempts or hints, where appropriate.
- Response time, where meaningful.
- Timestamp.
- Selected level and subsequent automatically selected level.

Store only the necessary data and apply the existing authorization and privacy controls.

Do not use response time alone as a measure of ability.

## 5.4 Maintain an ability estimate

- Initialize users appropriately when no history is available.
- Update the estimate from actual response data.
- Preserve relevant history between sessions.
- Account for missing responses and insufficient data.
- Avoid large difficulty jumps caused by one unusually good or poor attempt.
- Use appropriate uncertainty or confidence safeguards.
- Keep ability estimates specific to the appropriate game or item group where the games measure different skills.
- Do not treat every cognitive game as interchangeable.

## 5.5 Automatically choose the next level

After a completed round or session:

1. Save the actual game responses.
2. Update the Rasch-based ability estimate.
3. Apply the configured progression policy and minimum-evidence requirements.
4. Automatically select the next level.
5. Save the selected level.
6. Load that level on the next round or visit.
7. Explain the result to the user in encouraging, nonjudgmental language.

The progression policy must prevent unnecessarily difficult challenges and account for uncertainty.

If the evidence is insufficient, retain the appropriate introductory level or make a conservative adjustment rather than pretending the model has a reliable estimate.

The game must use the resulting level in actual gameplay. Updating a database field or displaying a different label alone does not satisfy the requirement.

## 5.6 Apply the system to relevant games

Inspect the existing brain games and determine which are suitable for Rasch-based adaptation.

At minimum, implement and verify the intended behavior for Picture Matching if that is an existing game.

Extend the mechanism to other compatible games without falsely assuming that all game types share the same difficulty parameters.

## 5.7 Caregiver progress and safety

Where the current application supports caregiver progress, show useful, understandable information about participation, activity history, and adaptive difficulty.

Include the existing disclaimer:

"This is a progress-tracking aid, not a medical diagnosis."

Do not present the model as a clinical dementia assessment or claim that increased game difficulty proves improved cognitive health.

## 5.8 Required tests

Write automated tests proving that:

- The first game starts at the configured introductory difficulty.
- Actual gameplay responses are recorded.
- Different response patterns produce different model inputs.
- The ability estimate is updated appropriately.
- Repeated successful performance can trigger a higher next level when supported by the progression rules.
- Repeated difficulty can trigger a more manageable level where appropriate.
- The selected next level is automatically persisted and loaded.
- The next level changes in actual gameplay.
- Insufficient data does not cause an unjustified difficulty jump.
- Results persist across sessions.
- One user's data cannot affect another user's ability estimate.

Use deterministic test data so the expected outcome is verifiable.

---

# 6. REDESIGN THE CHARITY WORKFLOW LOGIC WITHOUT REDESIGNING THE UI

The existing charity experience must clearly separate two different activities:

1. Patients or caregivers applying for charitable assistance.
2. Donors contributing money to the charitable fund.

These are separate user journeys and must not be mixed together.

## 6.1 Patient charity section

For a patient or authorized caregiver, the charity section should offer an option such as:

**"Apply for Charity Assistance"**

Do not show the patient a donation button as the primary charity action.

The patient should be able to submit an assistance application with the required information.

Use the existing interface style and introduce only the minimum required fields and controls.

## 6.2 Eligibility policy

Use the following intended eligibility threshold:

**Annual family income below ₹1,50,000.**

An income exactly equal to ₹1,50,000 does not meet a strict "below ₹1,50,000" rule unless the approved charity policy explicitly changes the threshold.

Do not automatically promise assistance merely because an applicant reports income below the threshold.

The threshold is one eligibility condition. Approval also depends on document review, the charity partner's decision, available funds, and the approved program rules.

Make the threshold configurable in the backend rather than scattering a hardcoded value throughout the application.

Clearly explain the policy to applicants.

## 6.3 India-appropriate supporting documents

The application must support relevant income details and supporting documents suitable for applicants in India.

Investigate appropriate examples such as:

- A valid income certificate issued by a competent authority, where available.
- Relevant government-issued documents that the authorized charity partner has approved for eligibility verification.
- Other appropriate evidence of household income accepted under the approved charity policy.

Do not assume that every applicant has the same document or that every document is available in every state.

The charity partner must define the acceptable alternatives.

Collect only information that is necessary for the eligibility decision.

Do not require full Aadhaar numbers or collect Aadhaar OTPs as a default verification mechanism.

Do not claim that a document is verified merely because it has been uploaded.

## 6.4 Application form

The form should collect appropriate information such as:

- Patient name and contact details, preferably reusing existing profile information.
- Authorized caregiver details, if applicable.
- Annual family income.
- Relevant household or financial circumstances.
- Requested assistance.
- Supporting documents.
- Required consent and declaration.
- Submission timestamp.

Avoid asking for information that is not needed to assess eligibility.

Provide clear explanations for each document requirement.

Securely store sensitive documents and restrict access to authorized reviewers.

## 6.5 Application review and approval

**Both a designated Smivai administrator and an authorized charity partner must approve the application.**

Implement a genuine workflow with statuses such as:

- Draft.
- Submitted.
- Under review.
- Additional information requested.
- Rejected.
- Approved.
- Assistance active.
- Completed.

Use suitable status names consistent with the existing application.

Requirements:

- Only authorized administrators can review administrative decisions.
- Only authorized charity partners can perform their designated approval actions.
- Both required approvals must be recorded before assistance is activated.
- Record who performed each decision and when.
- Support rejection reasons and requests for additional information.
- Prevent unauthorized status changes.
- Do not automatically approve an applicant solely based on the entered income.
- Do not display sensitive supporting documents to donors.
- Notify the applicant of status changes using the existing notification capabilities, where available.

If no real charity partner is connected, use a clearly labeled Demo mode and do not imply that actual assistance has been approved.

## 6.6 First five doctor visits

The intended benefit is:

**Full consultation-fee coverage for the first five approved doctor visits**, subject to available charitable funds and the program's approved rules.

Implement the accounting and authorization needed to support this benefit.

Requirements:

- Count only qualifying, approved, completed consultations according to the approved program rules.
- Do not count cancelled appointments or failed bookings as completed visits.
- Prevent duplicate counting of the same consultation.
- Track the number of eligible visits used and the number remaining.
- Record the actual approved consultation fee and the amount covered by the fund.
- Deduct or reserve assistance funds through an auditable transaction workflow.
- Prevent a user from claiming the same benefit twice for the same visit.
- Handle insufficient funds without falsely promising full coverage.
- Display the benefit's conditions clearly.
- Ensure that doctors or participating facilities understand how the charitable coverage is settled.

The application must not create money or assume that a doctor has agreed to provide free treatment.

Full coverage is only available when the consultation qualifies, the benefit is approved, the provider participates in the arrangement, and sufficient funds are available.

## 6.7 Financial ledger and transparency

Implement or repair a secure ledger that records:

- Donations received.
- Verified payment status.
- Available charitable funds.
- Funds reserved for approved assistance.
- Consultation-fee payments.
- Refunds and reversals.
- Administrative adjustments with appropriate authorization.
- Relevant transaction references and timestamps.

Do not calculate available funds by trusting frontend values.

Use database transactions and appropriate consistency controls to prevent duplicate allocation or overspending.

Keep donor information and patient information appropriately separated.

Do not expose an applicant's income, identity documents, or medical information to donors.

---

# 7. ADD A SEPARATE DONOR ROLE TO THE SIGN-IN EXPERIENCE

The sign-in experience must support the existing roles and add a separate Donor option.

Existing roles:

- Patient.
- Caregiver.
- Doctor.

New role:

- Donor.

Inspect the current authentication and role model before changing it.

## 7.1 Donor onboarding

A donor should be able to register or sign in using the appropriate existing authentication process and then access a dedicated donor experience.

Do not create a completely separate authentication system unless the current architecture genuinely requires it.

Enforce role permissions on the backend.

A donor must not gain access to patient-only, caregiver-only, doctor-only, or administrative features merely by changing a frontend role value.

## 7.2 Donation experience

The donor interface should provide:

- A clear explanation of the charitable purpose.
- A suitable donation amount selection.
- An option to enter a custom amount if supported.
- A clear donation confirmation flow.
- Accurate payment status.
- A donation history or receipt view where appropriate.
- Transparent information about the purpose and governance of the fund.

Use the existing UI style.

## 7.3 Encouraging donor messages

Include concise, dignified messages that communicate the purpose of the donation.

Examples:

- "Your kindness can help someone access the care they need."
- "You are contributing to a cause that supports families facing difficult circumstances."
- "Together, we can help make essential consultations more accessible."
- "Your contribution can help an eligible family take the next step toward care."

Use messages as encouragement, not as pressure or guilt.

Do not promise that a particular donation will cover a specific patient or consultation unless the allocation is actually established.

Do not fabricate patient testimonials or claim that a donation has helped someone when it has not.

## 7.4 Real payment integration

Inspect the existing payment implementation before modifying it.

If Razorpay is already used, verify the implementation. Otherwise, investigate whether it is suitable for the existing architecture.

Initially use the provider's authorized test mode.

Requirements:

- Create payment orders on the backend.
- Verify payment results using the official provider mechanism.
- Verify webhook signatures on the backend.
- Handle pending, successful, failed, cancelled, and refunded payments.
- Prevent duplicate webhook processing.
- Use idempotency or equivalent duplicate-processing safeguards where appropriate.
- Update the ledger only after verified transaction events.
- Never trust a frontend success message as proof of payment.
- Never expose payment secrets.
- Do not collect real donations until the required legal arrangement, merchant configuration, and operational approvals are in place.

If credentials are missing, provide a clearly identified Demo mode or explain what remains blocked.

Do not show a fake successful payment.

---

# 8. BACKEND, DATABASE, AND SECURITY REQUIREMENTS

Apply these safeguards to all the fixes.

## 8.1 Preserve the existing architecture

- Reuse existing services and components when appropriate.
- Do not rewrite unrelated features.
- Do not create duplicate data models for existing patient information.
- Use migrations for schema changes.
- Preserve existing data.
- Back up data before destructive changes.
- Document a rollback path.

## 8.2 Authentication and data isolation

- Verify the authenticated user's identity on the backend.
- Restrict patient profile and memory access to authorized users.
- Enforce caregiver permissions.
- Restrict doctor records and appointment management appropriately.
- Restrict donor access to donor functionality and the donor's own records.
- Restrict charity applications and supporting documents to authorized reviewers and the applicant as appropriate.
- Restrict approval actions to authorized administrators and charity partners.

Do not rely on frontend controls as the only security mechanism.

## 8.3 Sensitive documents

- Validate file types and sizes.
- Store documents securely.
- Prevent unauthorized public access.
- Avoid permanent public URLs for sensitive files.
- Restrict downloads.
- Apply appropriate retention and deletion policies.
- Avoid collecting unnecessary sensitive identifiers.

## 8.4 Error handling

Every relevant feature must handle failures clearly.

Examples:

- Hun's AI provider is unavailable.
- The user's profile cannot be retrieved.
- A fact cannot be loaded.
- Doctor ratings or fees are unavailable.
- Location permission is denied.
- The Rasch model has insufficient observations.
- A charity document fails to upload.
- An application is awaiting partner review.
- A donation payment is pending or fails.
- The charity fund has insufficient available money.

Never silently substitute fabricated data for failed operations.

Use clearly identified Demo mode only when appropriate.

---

# 9. TESTING REQUIREMENTS

Write and run tests for every repaired feature.

## 9.1 Hun

Verify correct personal-data retrieval, family information, saved memories, general questions, missing data, authorization and error handling.

## 9.2 Facts section

Verify content variety, source attribution, meaningful rotation, non-repetition, and preservation of the existing page.

## 9.3 Doctor sorting

Use deterministic sample records to prove that rating, fees, and distance produce the correct result order.

## 9.4 Rasch model

Verify the full chain:

Actual gameplay → recorded responses → updated ability estimate → automatically selected difficulty → persisted level → actual next-game behavior.

A difficulty label changing without changing gameplay is a failed test.

## 9.5 Charity application

Verify:

- Income below ₹1,50,000 can qualify for review.
- Income at or above the strict threshold does not automatically qualify.
- Supporting documents are handled securely.
- Administrator approval alone is insufficient.
- Charity partner approval alone is insufficient.
- Both required approvals are recorded before assistance is activated.
- Rejected and pending applications cannot use the benefit.
- Applicants cannot view other applicants' records.
- Approved assistance is tracked accurately.

## 9.6 First five visits

Verify:

- Qualifying completed consultations are counted correctly.
- Cancelled bookings are not counted.
- Duplicate records cannot consume multiple visits.
- The visit counter cannot be manipulated by the frontend.
- The actual consultation fee and covered amount are recorded.
- Insufficient funds do not result in a false coverage confirmation.

## 9.7 Donor and payment workflow

Verify:

- Donors can access donor functionality.
- Donors cannot access unauthorized patient data.
- Payment status comes from verified backend results.
- Invalid webhook signatures are rejected.
- Duplicate webhook events do not duplicate donations.
- Failed payments do not increase available funds.
- Refunds and reversals are handled appropriately.
- Demo mode is clearly distinguished from real payments.

Run existing tests as well as new tests. Report any tests that cannot be run and explain why.

---

# 10. PRESERVE THE EXISTING UI

This requirement applies to every change.

- Keep the current Smivai visual design.
- Do not use Taste Skill.
- Do not introduce a new design system.
- Do not redesign the home page, navigation, or existing features.
- Do not replace the current UI with a generic dashboard.
- Add only the controls and information needed for the requested fixes.
- Keep the existing product branding.
- Use Hun as the assistant's name.
- Preserve responsive behavior and existing working interactions.

The only UI changes authorized by this prompt are the minimum necessary to make the specified functionality work correctly, including the donor role, charity application workflow, relevant status displays, sorting controls, and improved Facts content.

---

# 11. REQUIRED IMPLEMENTATION ORDER

After the initial audit and my approval, work in the following order:

**Batch 1 — Hun**
- Repair personal profile and memory retrieval.
- Fix basic question handling.
- Improve conversation context and error handling.
- Test data isolation and personal questions.

**Batch 2 — Facts**
- Replace shallow trivia with the three requested content types.
- Add verified sources and useful daily selection.
- Test rotation and attribution.

**Batch 3 — Doctor sorting**
- Implement rating, fees, and distance sorting.
- Test all criteria against deterministic data.

**Batch 4 — Rasch model**
- Audit the current model.
- Repair actual response collection and ability estimation.
- Implement automatic next-level selection and persistence.
- Verify actual gameplay changes.

**Batch 5 — Charity applications**
- Implement the ₹1.5 lakh annual family income threshold.
- Add India-appropriate supporting documents.
- Implement the dual-approval workflow.
- Add auditable first-five-visit coverage tracking.

**Batch 6 — Donor role and donations**
- Add the Donor role to the existing sign-in experience.
- Implement the dedicated donor flow.
- Verify the payment integration and donation ledger.
- Test permissions and payment safeguards.

**Batch 7 — Integration and regression testing**
- Run the complete relevant test suite.
- Check existing features for regressions.
- Verify the application still uses its original UI.
- Document any remaining blockers.

Basic security, privacy and data integrity protections must be implemented as part of every batch rather than postponed until the end.

If the audit identifies dependencies that require a different order, explain the reason and request my approval before changing the sequence.

---

# 12. REPORT AFTER EACH BATCH

After each approved batch, report:

1. What was actually fixed.
2. Which files were modified or created.
3. Which existing components and services were reused.
4. Tests run and their actual results.
5. Manual steps for verifying the fix.
6. New environment variables or credentials required.
7. Which integrations are real, sandbox-only, mocked, or unavailable.
8. Database changes and backup or rollback information.
9. Remaining bugs, limitations, or unresolved dependencies.
10. Whether the feature was verified in the live deployment or only locally.

Do not claim a live fix unless the relevant deployment has actually been updated and verified.

Do not claim a third-party service works without testing the real integration or clearly identifying the test environment.

Do not proceed to the next batch without my instruction.

---

# FIRST ACTION

Start with the audit only.

Inspect the existing Smivai repository and identify why the previously requested features remain incomplete.

Do not modify files until I approve the audit and implementation plan.

Then wait for my approval before proceeding.


## FINAL ACCEPTANCE AND VERIFICATION GATE

Before declaring the requested improvements complete:

1. Convert every requirement in this prompt into an individually traceable acceptance criterion.
2. Maintain a requirements checklist showing each criterion as Passed, Failed, Blocked, or Not tested.
3. For every Passed criterion, provide evidence from an executed test, an actual end-to-end workflow, or a verified integration.
4. Test the complete user journey through the interface and backend wherever feasible, not just individual functions.
5. Test normal operation, missing data, invalid input, permission failures, provider outages, and relevant edge cases.
6. Verify that all existing working features remain functional and that the existing UI has not been unnecessarily redesigned.
7. Verify the actual deployed application after deployment, where deployment access is available. Clearly distinguish local results from live results.
8. Verify that Hun, Facts, all three doctor-sorting options, Rasch-based automatic difficulty adaptation, charity applications, and donor payments each work as specified.
9. Do not mark a requirement as Passed if it was only partially implemented, manually simulated, or tested exclusively with mocks when real integration was required.
10. Identify all remaining defects, missing credentials, provider restrictions, untested paths, and operational dependencies.
11. Provide a final requirements-to-tests matrix and an explicit list of unresolved issues.
12. Do not claim that nothing remains unless every required criterion has been checked and all outstanding limitations have been disclosed.

A successful build or passing test suite alone does not prove that the application meets every requirement.
~~~~

**Prompt 8.1.2** (2026-10-09)

~~~~text
go and complete till last
~~~~


---

## 9. Phase 9 — Bug reports, local server and repository preparation

### 9.1 Donor screen server-connection bug

- **Purpose:** Reports the 'needs the Smivai server' message on the donation screen (fixed with automatic local server detection).
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
BUT This account works with the Smivai server, which is not connected on this device. Nothing can be saved here without it.

 IN DONATION
~~~~

### 9.2 Local server startup errors (pasted logs)

- **Purpose:** Pasted terminal output: port 8000 already in use, then 404 at the API root (explained: the app runs on port 8123).
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

**Prompt 9.2.1** (2026-10-09)

~~~~text
C:\Users\parth\Desktop\rudraX>python backend/run_local.py
Database postgresql+psycopg unavailable (ModuleNotFoundError); using local SQLite at C:\Users\parth\Desktop\rudraX\backend\smivai_local.db
SMIVAI_AUTH_SECRET is not set: using a random secret, so every session ends when this server restarts.
INFO:     Started server process [21508]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
ERROR:    [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000): only one usage of each socket address (protocol/network address/port) is normally permitted
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.

C:\Users\parth\Desktop\rudraX>
C:\Users\parth\Desktop\rudraX>
~~~~

**Prompt 9.2.2** (2026-10-09)

~~~~text
INFO:     Started server process [27468]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     127.0.0.1:64253 - "GET / HTTP/1.1" 404 Not Found
INFO:     127.0.0.1:64253 - "GET /favicon.ico HTTP/1.1" 404 Not Found
~~~~

### 9.3 GitHub-ready repository cleanup

- **Purpose:** Removes unnecessary, duplicate and generated files, keeps one README.md, and hardens .gitignore without committing or pushing.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
Clean the entire project folder for a GitHub-ready repository. Delete only unnecessary, unused, duplicate, temporary, and generated files. Keep all essential working code, required configuration and dependency files, and exactly one README.md. Ensure .gitignore excludes node_modules, build outputs, caches, .env files, and secrets. Do not delete required files, modify working code, or redesign anything. Do not commit or push to GitHub. Minimize token usage and report which files were deleted and retained.
~~~~

### 9.4 Feature roadmap request

- **Purpose:** Asks for suggestions of features that could be added next.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
TELL WHAT I CAN ADD IN IT
~~~~

### 9.5 Prompt documentation request

- **Purpose:** The request that produced this document.
- **Status:** Original (verbatim)
- **Source:** Session C (9 - 10 Oct 2026) · 2026-10-09

~~~~text
Analyze the SMIVAI project and create exactly one Markdown file named `PROMPT_DOCUMENTATION.md` in the project root. Document all available original prompts used to build, modify, and improve the project, including UI/UX, AI features, backend, APIs, integrations, bug fixes, and other implementations. Retrieve prompts from existing project files and accessible history wherever possible. Organize them with numbered headings, purpose, and complete prompt text. Do not invent original prompts; clearly label reconstructed prompts and unavailable history. Keep the documentation professional and suitable for   judging. Do not modify application code, create any other documentation files, or deploy anything. Minimize token usage and report the file location when finished.
~~~~


---

## Appendix A — Session-control messages

Short messages that resumed or retried work, and automatic notifications, which added no new requirements. Listed verbatim. Session-continuation summaries generated automatically by the tool are not prompts and are excluded.

| # | Date | Session | Message |
|---|---|---|---|
| A1 | 2026-08-25 | Session A | Try again |
| A2 | 2026-08-26 | Session A | CONTINUE |
| A3 | 2026-08-26 | Session A | Try again |
| A4 | 2026-08-26 | Session A | Try again |
| A5 | 2026-08-26 | Session A | Try again |
| A6 | 2026-08-26 | Session A | My computer went to sleep while you were working. Please continue from where you left off. |
| A7 | 2026-08-30 | Session A | continue |
| A8 | 2026-08-30 | Session A | IS IT COMPLETED |
| A9 | 2026-08-30 | Session A | I hit my usage limit while you were working, but it has reset now. Please continue from where you left off. |
| A10 | 2026-08-31 | Session A | [automatic artifact notification — not written by the author] |
| A11 | 2026-09-07 | Session A | [automatic artifact notification — not written by the author] |
| A12 | 2026-09-19 | Session A | not found in the rudraX |
| A13 | 2026-09-19 | Session B | Try again |
| A14 | 2026-09-20 | Session B | I hit my usage limit while you were working, but it has reset now. Please continue from where you left off. |
| A15 | 2026-09-20 | Session B | I hit my usage limit while you were working, but it has reset now. Please continue from where you left off. |

---

*51 prompts documented across 9 phases, plus 15 session-control entries. No prompts were reconstructed.*
