/* ============================================================
   SMIVAI — i18n.js
   Language registry, string catalogue and resolution.

   Resolution order for any string, in this order:
     1. bundled translation for the patient's language
     2. cached machine translation (Bhashini / AI4Bharat NMT)
     3. English, visibly marked as a fallback

   Every string carries provenance, so a reviewer can tell a
   human-verified line from an AI-drafted one from a machine translation
   fetched at runtime. Nothing in this file is presented as validated:
   the bundled non-English strings are seed drafts awaiting native-speaker
   review, and the caregiver language panel says exactly that.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* ------------------------------------------------------------
     Language registry

     `bhashini` is the ISO code Bhashini/ULCA accepts. Bhashini covers the
     22 scheduled languages, which includes Assamese, Bodo, Manipuri,
     Bengali and Nepali — but NOT Khasi, Mizo, Garo or Nagamese, which are
     widely spoken across the North-East and are not scheduled languages.
     Those are marked `community: true`: they run on bundled human strings
     and recorded prompts, with no machine pipeline available. Saying so is
     the point — a platform for the NER that quietly pretends otherwise
     would fail the people it names.
     ------------------------------------------------------------ */
  var LANGUAGES = [
    { code: 'en',  name: 'English',   native: 'English',      script: 'Latin',      bhashini: 'en',  bcp47: 'en-IN', region: 'default' },
    { code: 'hi',  name: 'Hindi',     native: 'हिन्दी',        script: 'Devanagari', bhashini: 'hi',  bcp47: 'hi-IN', region: 'national' },
    { code: 'as',  name: 'Assamese',  native: 'অসমীয়া',       script: 'Bengali-Assamese', bhashini: 'as', bcp47: 'as-IN', region: 'ner' },
    { code: 'bn',  name: 'Bengali',   native: 'বাংলা',         script: 'Bengali',    bhashini: 'bn',  bcp47: 'bn-IN', region: 'ner' },
    { code: 'mni', name: 'Manipuri',  native: 'মৈতৈলোন্',      script: 'Bengali',    bhashini: 'mni', bcp47: 'mni-IN', region: 'ner' },
    { code: 'brx', name: 'Bodo',      native: 'बड़ो',          script: 'Devanagari', bhashini: 'brx', bcp47: 'brx-IN', region: 'ner' },
    { code: 'ne',  name: 'Nepali',    native: 'नेपाली',        script: 'Devanagari', bhashini: 'ne',  bcp47: 'ne-NP', region: 'ner' },
    /* Spoken across the NER, outside the scheduled-language set — no
       Bhashini or AI4Bharat pipeline exists for these today. */
    { code: 'kha', name: 'Khasi',     native: 'Ka Ktien Khasi', script: 'Latin',    bhashini: null,  bcp47: null,    region: 'ner', community: true },
    { code: 'lus', name: 'Mizo',      native: 'Mizo ṭawng',   script: 'Latin',      bhashini: null,  bcp47: null,    region: 'ner', community: true },
    { code: 'grt', name: 'Garo',      native: "A·chik",       script: 'Latin',      bhashini: null,  bcp47: null,    region: 'ner', community: true }
  ];

  /* ------------------------------------------------------------
     String catalogue.
     Keys are stable; English is the source of truth for translation.
     ------------------------------------------------------------ */
  var STRINGS = {

    /* ---- greetings & home ---- */
    good_morning:   { en: 'Good morning',   hi: 'सुप्रभात',  as: 'শুভ ৰাতিপুৱা', bn: 'সুপ্রভাত',  ne: 'शुभ प्रभात' },
    good_afternoon: { en: 'Good afternoon', hi: 'नमस्कार',   as: 'নমস্কাৰ',      bn: 'নমস্কার',   ne: 'नमस्कार' },
    good_evening:   { en: 'Good evening',   hi: 'शुभ संध्या', as: 'শুভ সন্ধিয়া', bn: 'শুভ সন্ধ্যা', ne: 'शुभ साँझ' },
    hello:          { en: 'Hello', hi: 'नमस्ते', as: 'নমস্কাৰ', bn: 'নমস্কার', ne: 'नमस्कार', mni: 'খুরুমজরি', brx: 'खुलुमबाय' },
    thank_you:      { en: 'Thank you', hi: 'धन्यवाद', as: 'ধন্যবাদ', bn: 'ধন্যবাদ', ne: 'धन्यवाद', mni: 'থাগৎচরি', brx: 'साबायखर' },

    lets_do_activity: {
      en: "Let's do a little activity today.",
      hi: 'आइए आज थोड़ी गतिविधि करें।',
      as: 'আহক আজি অলপ অনুশীলন কৰোঁ।',
      bn: 'চলুন আজ একটু অনুশীলন করি।',
      ne: 'आउनुहोस्, आज अलिकति अभ्यास गरौं।'
    },
    todays_progress:  { en: "Today's progress", hi: 'आज की प्रगति', as: 'আজিৰ অগ্ৰগতি', bn: 'আজকের অগ্রগতি', ne: 'आजको प्रगति' },
    activities_done:  {
      en: '{done} of {total} activities completed',
      hi: '{total} में से {done} गतिविधियाँ पूरी हुईं',
      as: '{total} টাৰ ভিতৰত {done} টা সম্পূৰ্ণ',
      bn: '{total} টির মধ্যে {done} টি সম্পন্ন',
      ne: '{total} मध्ये {done} पूरा भयो'
    },
    todays_session:   { en: "Today's session", hi: 'आज का सत्र', as: 'আজিৰ অনুশীলন', bn: 'আজকের সেশন', ne: 'आजको सत्र' },
    about_minutes:    {
      en: 'About {n} minutes in total.',
      hi: 'कुल मिलाकर लगभग {n} मिनट।',
      as: 'মুঠ প্ৰায় {n} মিনিট।',
      bn: 'মোট প্রায় {n} মিনিট।',
      ne: 'कुल लगभग {n} मिनेट।'
    },
    about_n_min:      { en: 'about {n} min', hi: 'लगभग {n} मिनट', as: 'প্ৰায় {n} মিনিট', bn: 'প্রায় {n} মিনিট', ne: 'लगभग {n} मिनेट' },
    continue_activity:{
      en: "Continue today's activity",
      hi: 'आज की गतिविधि जारी रखें',
      as: 'আজিৰ অনুশীলন আগবঢ়াওক',
      bn: 'আজকের অনুশীলন চালিয়ে যান',
      ne: 'आजको अभ्यास जारी राख्नुहोस्'
    },
    all_done_today:   { en: 'All done for today', hi: 'आज का काम पूरा', as: 'আজিৰ বাবে সম্পূৰ্ণ', bn: 'আজকের মতো শেষ', ne: 'आजको सकियो' },
    can_choose_another:{ en: 'You can still choose another activity.', hi: 'आप चाहें तो कोई और गतिविधि कर सकते हैं।', as: 'বিচাৰিলে আন এটা অনুশীলনো কৰিব পাৰে।', bn: 'চাইলে আরেকটি অনুশীলনও করতে পারেন।', ne: 'चाहनुहुन्छ भने अर्को अभ्यास पनि गर्न सक्नुहुन्छ।' },
    next_reminder:    { en: 'Next reminder', hi: 'अगला अनुस्मारक', as: 'পৰৱৰ্তী সোঁৱৰণী', bn: 'পরবর্তী রিমাইন্ডার', ne: 'अर्को सम्झना' },
    nothing_else_today:{ en: 'Nothing else for today.', hi: 'आज और कुछ नहीं है।', as: 'আজি আৰু একো নাই।', bn: 'আজ আর কিছু নেই।', ne: 'आज अरू केही छैन।' },
    people_you_love:  { en: 'People, places and things you love', hi: 'आपके प्रिय लोग, जगहें और चीज़ें', as: 'আপোনাৰ প্ৰিয় মানুহ, ঠাই আৰু বস্তু', bn: 'আপনার প্রিয় মানুষ, জায়গা আর জিনিস', ne: 'तपाईंलाई प्रिय मान्छे, ठाउँ र चीजहरू' },
    your_family_contacts:{ en: 'Your family contacts', hi: 'आपके परिवार के संपर्क', as: 'আপোনাৰ পৰিয়ালৰ সম্পৰ্ক', bn: 'আপনার পরিবারের যোগাযোগ', ne: 'तपाईंको परिवारका सम्पर्क' },

    /* ---- mood ---- */
    how_feeling: { en: 'How are you feeling today?', hi: 'आज आप कैसा महसूस कर रहे हैं?', as: 'আজি আপুনি কেনে অনুভৱ কৰিছে?', bn: 'আজ আপনি কেমন বোধ করছেন?', ne: 'आज तपाईंलाई कस्तो लागिरहेको छ?' },
    mood_good:   { en: 'Good',     hi: 'अच्छा',      as: 'ভাল',        bn: 'ভালো',       ne: 'राम्रो', mni: 'ফজৈ', brx: 'मोजां' },
    mood_okay:   { en: 'Okay',     hi: 'ठीक',        as: 'মোটামুটি',   bn: 'মোটামুটি',   ne: 'ठीकै' },
    mood_low:    { en: 'Not good', hi: 'अच्छा नहीं', as: 'ভাল নহয়',   bn: 'ভালো নয়',   ne: 'राम्रो छैन' },
    thanks_for_telling: { en: 'Thank you for telling us.', hi: 'बताने के लिए धन्यवाद।', as: 'কোৱাৰ বাবে ধন্যবাদ।', bn: 'জানানোর জন্য ধন্যবাদ।', ne: 'भन्नुभएकोमा धन्यवाद।' },

    /* ---- navigation ---- */
    nav_home:      { en: 'Home',            hi: 'घर',            as: 'ঘৰ',           bn: 'বাড়ি',         ne: 'गृह' },
    nav_play:      { en: 'Play & Practice', hi: 'खेल और अभ्यास', as: 'খেল আৰু অনুশীলন', bn: 'খেলা ও অনুশীলন', ne: 'खेल र अभ्यास' },
    nav_reminders: { en: 'Reminders',       hi: 'अनुस्मारक',     as: 'সোঁৱৰণী',      bn: 'রিমাইন্ডার',   ne: 'सम्झनाहरू' },
    nav_memories:  { en: 'Memories',        hi: 'यादें',          as: 'সোঁৱৰণ',       bn: 'স্মৃতি',        ne: 'सम्झनाहरू' },

    /* ---- play & practice ---- */
    choose_activity: { en: 'Choose an activity and take your time.', hi: 'कोई गतिविधि चुनें और आराम से करें।', as: 'এটা অনুশীলন বাছি লওক, খৰখেদা নাই।', bn: 'একটি অনুশীলন বেছে নিন, তাড়াহুড়ো নেই।', ne: 'एउटा अभ्यास छान्नुहोस्, हतार छैन।' },
    suggested_today: { en: 'Suggested for you today', hi: 'आज आपके लिए सुझाव', as: 'আজি আপোনাৰ বাবে পৰামৰ্শ', bn: 'আজ আপনার জন্য প্রস্তাবিত', ne: 'आज तपाईंका लागि सिफारिस' },
    start:           { en: 'Start', hi: 'शुरू करें', as: 'আৰম্ভ কৰক', bn: 'শুরু করুন', ne: 'सुरु गर्नुहोस्' },
    choose_level:    { en: 'Choose level', hi: 'स्तर चुनें', as: 'স্তৰ বাছক', bn: 'স্তর বাছুন', ne: 'तह छान्नुहोस्' },
    played_times:    { en: 'Played {n}×', hi: '{n} बार खेला', as: '{n} বাৰ খেলিছে', bn: '{n} বার খেলা হয়েছে', ne: '{n} पटक खेलियो' },
    label_new:       { en: 'New', hi: 'नया', as: 'নতুন', bn: 'নতুন', ne: 'नयाँ' },

    /* ---- difficulty ---- */
    easy:   { en: 'Easy',   hi: 'आसान',  as: 'সহজ',   bn: 'সহজ',    ne: 'सजिलो' },
    medium: { en: 'Medium', hi: 'मध्यम',  as: 'মধ্যম', bn: 'মাঝারি', ne: 'मध्यम' },
    hard:   { en: 'Hard',   hi: 'कठिन',  as: 'কঠিন',  bn: 'কঠিন',   ne: 'कठिन' },
    very_easy: { en: 'Very easy', hi: 'बहुत आसान', as: 'অতি সহজ', bn: 'খুব সহজ', ne: 'धेरै सजिलो' },
    very_hard: { en: 'Very hard', hi: 'बहुत कठिन', as: 'অতি কঠিন', bn: 'খুব কঠিন', ne: 'धेरै कठिन' },

    /* ---- activity names ---- */
    game_picture_matching: { en: 'Picture Matching', hi: 'चित्र मिलान',   as: 'ছবি মিলোৱা',  bn: 'ছবি মেলানো',   ne: 'तस्बिर मिलान' },
    game_memory_pairs:     { en: 'Memory Pairs',     hi: 'स्मृति जोड़े',   as: 'সোঁৱৰণ যোৰ',  bn: 'স্মৃতি জোড়া',  ne: 'सम्झना जोडी' },
    game_picture_bingo:    { en: 'Picture Bingo',    hi: 'चित्र खोज',     as: 'ছবি বিচৰা',   bn: 'ছবি খোঁজা',    ne: 'तस्बिर खोज' },
    game_category_sorting: { en: 'Category Sorting', hi: 'वर्ग छाँटना',   as: 'শ্ৰেণী বাছনি', bn: 'শ্রেণী বাছাই', ne: 'वर्ग छुट्याउने' },
    game_jigsaw:           { en: 'Jigsaw',           hi: 'सरल पहेली',     as: 'সহজ ধাঁধা',   bn: 'সহজ ধাঁধা',    ne: 'सरल पजल' },
    game_my_memories:      { en: 'Memory Lane',      hi: 'मेरी यादें',     as: 'মোৰ সোঁৱৰণ',  bn: 'আমার স্মৃতি',  ne: 'मेरा सम्झना' },
    game_pattern:          { en: 'Complete the Pattern' },
    game_word_hustle:      { en: 'Word Hustle' },

    /* ---- activity instructions ---- */
    match_pictures: { en: 'Match the two pictures that go together.', hi: 'दो मिलती-जुलती तस्वीरें जोड़िए।', as: 'একেলগে যোৱা দুখন ছবি মিলাওক।', bn: 'যে দুটি ছবি একসাথে যায় সেগুলো মেলান।', ne: 'सँगै जाने दुई तस्बिर मिलाउनुहोस्।' },
    match_same:     { en: 'Find the two pictures that are the same.', hi: 'एक जैसी दो तस्वीरें ढूँढ़िए।', as: 'একে ধৰণৰ দুখন ছবি বিচাৰক।', bn: 'একই রকম দুটি ছবি খুঁজুন।', ne: 'उस्तै दुई तस्बिर खोज्नुहोस्।' },
    remember_cards: { en: 'Look at the cards and remember where they are.', hi: 'कार्ड देखिए और याद रखिए कि वे कहाँ हैं।', as: 'কাৰ্ডবোৰ চাওক আৰু মনত ৰাখক কোনটো কʼত আছে।', bn: 'কার্ডগুলো দেখুন আর মনে রাখুন কোনটা কোথায়।', ne: 'कार्डहरू हेर्नुहोस् र कहाँ छन् सम्झनुहोस्।' },
    find_pairs:     { en: 'Find the matching pairs.', hi: 'मिलते-जुलते जोड़े ढूँढ़िए।', as: 'মিল খোৱা যোৰবোৰ বিচাৰক।', bn: 'মিলে যাওয়া জোড়া খুঁজুন।', ne: 'मिल्ने जोडीहरू खोज्नुहोस्।' },
    find_object:    { en: 'Tap the picture I ask for.', hi: 'जो तस्वीर बताई जाए उसे छुएँ।', as: 'যিখন ছবি কোৱা হʼব সেইখন স্পৰ্শ কৰক।', bn: 'যে ছবিটি বলা হবে সেটি স্পর্শ করুন।', ne: 'भनिएको तस्बिर छुनुहोस्।' },
    can_you_find:   { en: 'Can you find the {item}?', hi: 'क्या आप {item} ढूँढ़ सकते हैं?', as: '{item} বিচাৰি উলিয়াব পাৰিবনে?', bn: '{item} খুঁজে পাবেন কি?', ne: '{item} फेला पार्न सक्नुहुन्छ?' },
    sort_items:     { en: 'Put each picture into the group it belongs to.', hi: 'हर तस्वीर को उसके सही समूह में रखिए।', as: 'প্ৰতিখন ছবি তাৰ শুদ্ধ দলত ৰাখক।', bn: 'প্রতিটি ছবি তার সঠিক দলে রাখুন।', ne: 'प्रत्येक तस्बिर आफ्नो समूहमा राख्नुहोस्।' },
    tap_then_pair:  { en: 'Tap one picture, then tap the one it belongs with.', hi: 'एक तस्वीर छुएँ, फिर उसकी जोड़ीदार तस्वीर छुएँ।', as: 'এখন ছবি স্পৰ্শ কৰক, তাৰ পিছত তাৰ যোৰটো স্পৰ্শ কৰক।', bn: 'একটি ছবি স্পর্শ করুন, তারপর তার জোড়াটি স্পর্শ করুন।', ne: 'एउटा तस्बिर छुनुहोस्, अनि त्यसको जोडी छुनुहोस्।' },
    tap_then_group: { en: 'Tap a picture, then tap its group.', hi: 'पहले तस्वीर छुएँ, फिर उसका समूह।', as: 'প্ৰথমে ছবি স্পৰ্শ কৰক, তাৰ পিছত তাৰ দল।', bn: 'আগে ছবি স্পর্শ করুন, তারপর তার দল।', ne: 'पहिले तस्बिर छुनुहोस्, अनि त्यसको समूह।' },
    build_picture:  { en: 'Tap two pieces to swap them and complete the picture.', hi: 'दो टुकड़े छूकर उन्हें बदलिए और तस्वीर पूरी कीजिए।', as: 'দুটা টুকুৰা স্পৰ্শ কৰি সলনি কৰক আৰু ছবিখন সম্পূৰ্ণ কৰক।', bn: 'দুটি টুকরো স্পর্শ করে অদলবদল করুন এবং ছবিটি সম্পূর্ণ করুন।', ne: 'दुई टुक्रा छोएर साट्नुहोस् र तस्बिर पूरा गर्नुहोस्।' },
    your_memories_q:{ en: 'Answer a few questions about the things you love.', hi: 'अपनी पसंदीदा चीज़ों के बारे में कुछ सवालों के जवाब दीजिए।', as: 'আপোনাৰ প্ৰিয় বস্তুৰ বিষয়ে কেইটামান প্ৰশ্নৰ উত্তৰ দিয়ক।', bn: 'আপনার প্রিয় জিনিস নিয়ে কয়েকটি প্রশ্নের উত্তর দিন।', ne: 'तपाईंका मनपर्ने कुराबारे केही प्रश्नको उत्तर दिनुहोस्।' },
    choose_one_answer:{ en: 'Choose one answer.', hi: 'एक उत्तर चुनिए।', as: 'এটা উত্তৰ বাছক।', bn: 'একটি উত্তর বাছুন।', ne: 'एउटा उत्तर छान्नुहोस्।' },

    /* ---- feedback ---- */
    take_your_time: { en: 'Take your time.', hi: 'आराम से कीजिए।', as: 'লাহে লাহে কৰক।', bn: 'ধীরে সুস্থে করুন।', ne: 'बिस्तारै गर्नुहोस्।' },
    no_timer:       { en: 'Take your time. There is no timer.', hi: 'आराम से कीजिए। कोई समय सीमा नहीं है।', as: 'লাহে লাহে কৰক। কোনো সময়সীমা নাই।', bn: 'ধীরে সুস্থে করুন। কোনো সময়সীমা নেই।', ne: 'बिस्तारै गर्नुहोस्। समयसीमा छैन।' },
    good_job:       { en: 'Good job!', hi: 'शाबाश!', as: 'ভাল হৈছে!', bn: 'বেশ হয়েছে!', ne: 'राम्रो भयो!' },
    well_done:      { en: 'Well done!', hi: 'बहुत बढ़िया!', as: 'বৰ ভাল!', bn: 'খুব ভালো!', ne: 'धेरै राम्रो!' },
    doing_great:    { en: "You're doing great.", hi: 'आप बहुत अच्छा कर रहे हैं।', as: 'আপুনি বৰ ভাল কৰি আছে।', bn: 'আপনি খুব ভালো করছেন।', ne: 'तपाईं धेरै राम्रो गर्दै हुनुहुन्छ।' },
    thats_okay:     { en: "That's okay. Let's try again.", hi: 'कोई बात नहीं। फिर से कोशिश करें।', as: 'একো অসুবিধা নাই। আকৌ চেষ্টা কৰক।', bn: 'কোনো অসুবিধা নেই। আবার চেষ্টা করুন।', ne: 'केही छैन। फेरि प्रयास गर्नुहोस्।' },
    try_another:    { en: "Let's try another one.", hi: 'चलिए दूसरा करते हैं।', as: 'আহক আন এটা কৰোঁ।', bn: 'চলুন আরেকটি করি।', ne: 'अर्को गरौं।' },
    good_effort:    { en: 'Good effort. One more try.', hi: 'अच्छी कोशिश। एक बार और।', as: 'ভাল চেষ্টা। আৰু এবাৰ।', bn: 'ভালো চেষ্টা। আর একবার।', ne: 'राम्रो प्रयास। अझ एक पटक।' },

    /* ---- completion ---- */
    you_completed:  { en: 'You completed {name}.', hi: 'आपने {name} पूरा किया।', as: 'আপুনি {name} সম্পূৰ্ণ কৰিলে।', bn: 'আপনি {name} সম্পন্ন করেছেন।', ne: 'तपाईंले {name} पूरा गर्नुभयो।' },
    activity_score: { en: 'Activity score', hi: 'गतिविधि अंक', as: 'কাৰ্যকলাপ স্কʼৰ', bn: 'কার্যকলাপ স্কোর', ne: 'गतिविधि अंक' },
    correct:        { en: 'Correct', hi: 'सही', as: 'শুদ্ধ', bn: 'সঠিক', ne: 'सही' },
    level:          { en: 'Level', hi: 'स्तर', as: 'স্তৰ', bn: 'স্তর', ne: 'तह' },
    play_again:     { en: 'Play again', hi: 'फिर खेलें', as: 'আকৌ খেলক', bn: 'আবার খেলুন', ne: 'फेरि खेल्नुहोस्' },
    continue_btn:   { en: 'Continue', hi: 'जारी रखें', as: 'আগবাঢ়ক', bn: 'চালিয়ে যান', ne: 'जारी राख्नुहोस्' },
    difficulty_up:  { en: 'We adjusted your next activity to your level. Next time will be a little bigger.', hi: 'हमने आपकी अगली गतिविधि आपके स्तर के अनुसार कर दी है। अगली बार थोड़ी बड़ी होगी।', as: 'আমি আপোনাৰ পৰৱৰ্তী অনুশীলন আপোনাৰ স্তৰ অনুসৰি সজালোঁ। পিছৰ বাৰ অলপ ডাঙৰ হʼব।', bn: 'আমরা আপনার পরবর্তী অনুশীলন আপনার স্তরে সাজিয়ে দিয়েছি। পরেরবার একটু বড় হবে।', ne: 'हामीले तपाईंको अर्को अभ्यास तपाईंको तहअनुसार मिलायौं। अर्को पटक अलि ठूलो हुनेछ।' },
    difficulty_down:{ en: 'We adjusted your next activity to your level. Next time will be a little easier.', hi: 'हमने आपकी अगली गतिविधि आपके स्तर के अनुसार कर दी है। अगली बार थोड़ी आसान होगी।', as: 'আমি আপোনাৰ পৰৱৰ্তী অনুশীলন আপোনাৰ স্তৰ অনুসৰি সজালোঁ। পিছৰ বাৰ অলপ সহজ হʼব।', bn: 'আমরা আপনার পরবর্তী অনুশীলন আপনার স্তরে সাজিয়ে দিয়েছি। পরেরবার একটু সহজ হবে।', ne: 'हामीले तपाईंको अर्को अभ्यास तपाईंको तहअनुसार मिलायौं। अर्को पटक अलि सजिलो हुनेछ।' },
    i_am_ready:     { en: 'I am ready', hi: 'मैं तैयार हूँ', as: 'মই সাজু', bn: 'আমি প্রস্তুত', ne: 'म तयार छु' },
    press_ready:    { en: 'Press "I am ready" when you have looked at them.', hi: 'देख लेने के बाद "मैं तैयार हूँ" दबाइए।', as: 'চোৱা হʼলে "মই সাজু" টিপক।', bn: 'দেখা হয়ে গেলে "আমি প্রস্তুত" চাপুন।', ne: 'हेरिसकेपछि "म तयार छु" थिच्नुहोस्।' },
    done_of:        { en: '{done} of {total} done', hi: '{total} में से {done} हो गए', as: '{total} টাৰ ভিতৰত {done} টা হʼল', bn: '{total} টির মধ্যে {done} টি হয়েছে', ne: '{total} मध्ये {done} भयो' },
    question_of:    { en: 'Question {n} of {total}', hi: 'प्रश्न {n} / {total}', as: 'প্ৰশ্ন {n} / {total}', bn: 'প্রশ্ন {n} / {total}', ne: 'प्रश्न {n} / {total}' },

    /* ---- reminders ---- */
    reminders_title: { en: 'Reminders', hi: 'अनुस्मारक', as: 'সোঁৱৰণী', bn: 'রিমাইন্ডার', ne: 'सम्झनाहरू' },
    coming_up:       { en: 'Coming up', hi: 'आगे', as: 'আহি আছে', bn: 'আসছে', ne: 'आउँदै' },
    please_check:    { en: 'Please check', hi: 'कृपया देखें', as: 'অনুগ্ৰহ কৰি চাওক', bn: 'দয়া করে দেখুন', ne: 'कृपया हेर्नुहोस्' },
    finished_today:  { en: 'Finished today', hi: 'आज पूरा हुआ', as: 'আজি সম্পূৰ্ণ', bn: 'আজ সম্পন্ন', ne: 'आज सकियो' },
    your_usual_day:  { en: 'Your usual day', hi: 'आपका दैनिक क्रम', as: 'আপোনাৰ দৈনন্দিন', bn: 'আপনার দৈনন্দিন', ne: 'तपाईंको दैनिकी' },
    nothing_today:   { en: 'Nothing for today', hi: 'आज कुछ नहीं है', as: 'আজি একো নাই', bn: 'আজ কিছু নেই', ne: 'आज केही छैन' },
    done_btn:        { en: 'Done', hi: 'हो गया', as: 'হʼল', bn: 'হয়েছে', ne: 'भयो' },
    not_now:         { en: 'Not now', hi: 'अभी नहीं', as: 'এতিয়া নহয়', bn: 'এখন নয়', ne: 'अहिले होइन' },
    listen:          { en: 'Listen', hi: 'सुनें', as: 'শুনক', bn: 'শুনুন', ne: 'सुन्नुहोस्' },
    marked_done:     { en: 'Well done. Marked as done.', hi: 'बहुत बढ़िया। पूरा कर दिया गया।', as: 'বৰ ভাল। সম্পূৰ্ণ বুলি চিহ্নিত কৰা হʼল।', bn: 'খুব ভালো। সম্পন্ন হিসেবে চিহ্নিত।', ne: 'धेरै राम्रो। पूरा भएको चिन्ह लगाइयो।' },
    will_remind:     { en: "That's okay. We'll remind you again.", hi: 'कोई बात नहीं। हम फिर याद दिलाएँगे।', as: 'একো অসুবিধা নাই। আমি আকৌ মনত পেলাই দিম।', bn: 'কোনো অসুবিধা নেই। আমরা আবার মনে করিয়ে দেব।', ne: 'केही छैन। हामी फेरि सम्झाउनेछौं।' },
    status_completed:{ en: 'Completed', hi: 'पूरा हुआ', as: 'সম্পূৰ্ণ', bn: 'সম্পন্ন', ne: 'पूरा भयो' },
    status_missed:   { en: 'Missed', hi: 'छूट गया', as: 'বাদ পৰিছে', bn: 'বাদ পড়েছে', ne: 'छुट्यो' },
    status_skipped:  { en: 'Skipped', hi: 'छोड़ा गया', as: 'এৰি দিয়া হৈছে', bn: 'এড়ানো হয়েছে', ne: 'छोडियो' },
    status_upcoming: { en: 'Upcoming', hi: 'आगामी', as: 'আহিব লগীয়া', bn: 'আসন্ন', ne: 'आउँदै' },
    important:       { en: 'Important', hi: 'ज़रूरी', as: 'গুৰুত্বপূৰ্ণ', bn: 'গুরুত্বপূর্ণ', ne: 'महत्त्वपूर्ण' },

    /* ---- reminder speech ---- */
    speak_medicine:  { en: '{name}, it is time to take your medicine.', hi: '{name}, दवा लेने का समय हो गया है।', as: '{name}, ঔষধ খোৱাৰ সময় হʼল।', bn: '{name}, ওষুধ খাওয়ার সময় হয়েছে।', ne: '{name}, औषधि खाने समय भयो।' },
    speak_water:     { en: '{name}, please drink some water.', hi: '{name}, कृपया थोड़ा पानी पीजिए।', as: '{name}, অনুগ্ৰহ কৰি অলপ পানী খাওক।', bn: '{name}, দয়া করে একটু জল খান।', ne: '{name}, कृपया अलिकति पानी पिउनुहोस्।' },
    speak_meal:      { en: '{name}, it is time for your meal.', hi: '{name}, भोजन का समय हो गया है।', as: '{name}, খোৱাৰ সময় হʼল।', bn: '{name}, খাওয়ার সময় হয়েছে।', ne: '{name}, खाना खाने समय भयो।' },
    speak_activity:  { en: '{name}, it is time for your SMIVAI activity.', hi: '{name}, आपकी SMIVAI गतिविधि का समय है।', as: '{name}, আপোনাৰ SMIVAI অনুশীলনৰ সময় হʼল।', bn: '{name}, আপনার SMIVAI অনুশীলনের সময় হয়েছে।', ne: '{name}, तपाईंको SMIVAI अभ्यासको समय भयो।' },
    speak_rest:      { en: '{name}, it is time to rest.', hi: '{name}, आराम करने का समय है।', as: '{name}, জিৰণিৰ সময় হʼল।', bn: '{name}, বিশ্রামের সময় হয়েছে।', ne: '{name}, आराम गर्ने समय भयो।' },

    /* ---- memories & family ---- */
    memories_title:  { en: 'My Memories', hi: 'मेरी यादें', as: 'মোৰ সোঁৱৰণ', bn: 'আমার স্মৃতি', ne: 'मेरा सम्झना' },
    play_my_memories:{ en: 'Play My Memories', hi: 'मेरी यादें खेलें', as: 'মোৰ সোঁৱৰণ খেলক', bn: 'আমার স্মৃতি খেলুন', ne: 'मेरा सम्झना खेल्नुहोस्' },
    no_memories:     { en: 'No memories yet', hi: 'अभी कोई याद नहीं', as: 'এতিয়ালৈকে একো সোঁৱৰণ নাই', bn: 'এখনও কোনো স্মৃতি নেই', ne: 'अहिलेसम्म कुनै सम्झना छैन' },
    call_family:     { en: 'Call Family', hi: 'परिवार को कॉल करें', as: 'পৰিয়ালক ফোন কৰক', bn: 'পরিবারকে ফোন করুন', ne: 'परिवारलाई फोन गर्नुहोस्' },
    call:            { en: 'Call', hi: 'कॉल', as: 'ফোন', bn: 'ফোন', ne: 'फोन' },
    first_to_call:   { en: 'first to call', hi: 'पहले इन्हें कॉल करें', as: 'প্ৰথমে ইয়াকে ফোন কৰক', bn: 'প্রথমে এঁকে ফোন করুন', ne: 'पहिले यिनलाई फोन गर्नुहोस्' },

    /* ---- connectivity ---- */
    online:          { en: 'Online', hi: 'ऑनलाइन', as: 'অনলাইন', bn: 'অনলাইন', ne: 'अनलाइन' },
    offline:         { en: 'Offline', hi: 'ऑफ़लाइन', as: 'অফলাইন', bn: 'অফলাইন', ne: 'अफलाइन' },
    offline_saved:   { en: 'Offline — your progress is saved', hi: 'ऑफ़लाइन — आपकी प्रगति सुरक्षित है', as: 'অফলাইন — আপোনাৰ অগ্ৰগতি সংৰক্ষিত আছে', bn: 'অফলাইন — আপনার অগ্রগতি সংরক্ষিত আছে', ne: 'अफलाइन — तपाईंको प्रगति सुरक्षित छ' },
    online_saved:    { en: 'Online — everything is saved', hi: 'ऑनलाइन — सब कुछ सुरक्षित है', as: 'অনলাইন — সকলো সংৰক্ষিত আছে', bn: 'অনলাইন — সবকিছু সংরক্ষিত আছে', ne: 'अनलाइन — सबै सुरक्षित छ' },
    saving:          { en: 'Saving…', hi: 'सहेजा जा रहा है…', as: 'সংৰক্ষণ হৈ আছে…', bn: 'সংরক্ষণ হচ্ছে…', ne: 'सुरक्षित गर्दै…' },

    /* ---- assistant ---- */
    assistant:        { en: 'Ask HUN', hi: 'HUN से पूछें', as: 'HUN ক সুধক', bn: 'HUN-কে জিজ্ঞাসা করুন', ne: 'HUN लाई सोध्नुहोस्' },
    tap_and_speak:    { en: 'Tap the button and speak', hi: 'बटन छूकर बोलिए', as: 'বুটামটো স্পৰ্শ কৰি কওক', bn: 'বোতামটি স্পর্শ করে বলুন', ne: 'बटन छोएर बोल्नुहोस्' },
    listening:        { en: 'Listening…', hi: 'सुन रहे हैं…', as: 'শুনি আছোঁ…', bn: 'শুনছি…', ne: 'सुन्दै…' },
    speak_now:        { en: 'Speak now', hi: 'अब बोलिए', as: 'এতিয়া কওক', bn: 'এখন বলুন', ne: 'अब बोल्नुहोस्' },
    didnt_catch:      { en: "I didn't catch that. Please try again.", hi: 'मैं समझ नहीं पाया। कृपया फिर से बोलिए।', as: 'মই বুজি নাপালোঁ। অনুগ্ৰহ কৰি আকৌ কওক।', bn: 'আমি বুঝতে পারিনি। দয়া করে আবার বলুন।', ne: 'मैले बुझिनँ। कृपया फेरि भन्नुहोस्।' },
    you_said:         { en: 'You said', hi: 'आपने कहा', as: 'আপুনি কʼলে', bn: 'আপনি বললেন', ne: 'तपाईंले भन्नुभयो' },
    try_asking:       { en: 'Try asking', hi: 'यह पूछकर देखिए', as: 'এইটো সুধি চাওক', bn: 'এটি জিজ্ঞাসা করে দেখুন', ne: 'यो सोधेर हेर्नुहोस्' },

    /* ---- generic ---- */
    back:    { en: 'Back', hi: 'वापस', as: 'উভতি যাওক', bn: 'ফিরে যান', ne: 'फर्कनुहोस्' },
    close:   { en: 'Close', hi: 'बंद करें', as: 'বন্ধ কৰক', bn: 'বন্ধ করুন', ne: 'बन्द गर्नुहोस्' },
    cancel:  { en: 'Cancel', hi: 'रद्द करें', as: 'বাতিল কৰক', bn: 'বাতিল করুন', ne: 'रद्द गर्नुहोस्' },
    exit:    { en: 'Exit', hi: 'बाहर', as: 'বাহিৰ', bn: 'প্রস্থান', ne: 'बाहिर' },
    language:{ en: 'Language', hi: 'भाषा', as: 'ভাষা', bn: 'ভাষা', ne: 'भाषा' },
    change_language: { en: 'Change language', hi: 'भाषा बदलें', as: 'ভাষা সলনি কৰক', bn: 'ভাষা পরিবর্তন করুন', ne: 'भाषा परिवर्तन गर्नुहोस्' },
    who_is_using:    { en: 'Who is using SMIVAI?', hi: 'SMIVAI कौन उपयोग कर रहा है?', as: 'SMIVAI কোনে ব্যৱহাৰ কৰিছে?', bn: 'SMIVAI কে ব্যবহার করছেন?', ne: 'SMIVAI कसले प्रयोग गर्दै हुनुहुन्छ?' },
    tap_your_name:   { en: 'Tap your name to begin.', hi: 'शुरू करने के लिए अपना नाम छुएँ।', as: 'আৰম্ভ কৰিবলৈ আপোনাৰ নাম স্পৰ্শ কৰক।', bn: 'শুরু করতে আপনার নাম স্পর্শ করুন।', ne: 'सुरु गर्न आफ्नो नाम छुनुहोस्।' },
    disclaimer: {
      en: 'SMIVAI provides cognitive activity and performance insights. It does not replace professional medical diagnosis.',
      hi: 'SMIVAI गतिविधि और प्रदर्शन की जानकारी देता है। यह डॉक्टर की जाँच का विकल्प नहीं है।',
      as: 'SMIVAI এ কাৰ্যকলাপ আৰু কাৰ্যক্ষমতাৰ তথ্য দিয়ে। ই চিকিৎসকৰ পৰীক্ষাৰ বিকল্প নহয়।',
      bn: 'SMIVAI কার্যকলাপ ও পারফরম্যান্সের তথ্য দেয়। এটি ডাক্তারের পরীক্ষার বিকল্প নয়।',
      ne: 'SMIVAI गतिविधि र प्रदर्शनको जानकारी दिन्छ। यो चिकित्सकको जाँचको विकल्प होइन।'
    }
  };

  /* Every non-English bundled string is an AI-drafted seed awaiting review.
     Nothing here has been signed off by a native speaker, and the language
     panel reports that rather than implying validation. */
  var BUNDLED_PROVENANCE = 'seed';


  /* ------------------------------------------------------------
     SMIVAI v2 interface strings.

     Same standing as every other non-English string in this file: an
     AI-drafted seed, marked as such, awaiting a native speaker. The
     caregiver Language console exports them for review, and anything
     missing still falls back to English rather than to a guess.
     ------------------------------------------------------------ */
  var STRINGS_V2 = {
    /* ---- brand & chrome ---- */
    tagline:        { en: 'Care Closer to You', as: 'যত্ন, আপোনাৰ ওচৰত', hi: 'देखभाल, आपके क़रीब', bn: 'যত্ন, আপনার কাছে' },
    nav_talk:       { en: 'Talk with HUN', as: 'HUN ৰ সৈতে কথা পাতক', hi: 'HUN से बात करें', bn: 'HUN-এর সাথে কথা বলুন' },
    nav_talk_s:     { en: 'Talk', as: 'কথা', hi: 'बात', bn: 'কথা' },
    nav_games:      { en: 'Brain Games', as: 'মগজুৰ খেল', hi: 'दिमाग़ी खेल', bn: 'মস্তিষ্কের খেলা' },
    nav_games_s:    { en: 'Games', as: 'খেল', hi: 'खेल', bn: 'খেলা' },
    nav_memories2:  { en: 'My Memories', as: 'মোৰ সোঁৱৰণ', hi: 'मेरी यादें', bn: 'আমার স্মৃতি' },
    nav_memories2_s:{ en: 'Memories', as: 'সোঁৱৰণ', hi: 'यादें', bn: 'স্মৃতি' },
    nav_progress:   { en: 'My Progress', as: 'মোৰ অগ্ৰগতি', hi: 'मेरी प्रगति', bn: 'আমার অগ্রগতি' },
    nav_doctor:     { en: 'Book a Doctor', as: 'ডাক্তৰ বুক কৰক', hi: 'डॉक्टर बुक करें', bn: 'ডাক্তার বুক করুন' },
    nav_records:    { en: 'Health Records', as: 'স্বাস্থ্যৰ নথি', hi: 'स्वास्थ्य रिकॉर्ड', bn: 'স্বাস্থ্য রেকর্ড' },
    nav_caregiver:  { en: 'Caregiver Support', as: 'যত্ন লোৱাৰ সহায়', hi: 'देखभाल सहायता', bn: 'যত্নের সহায়তা' },
    nav_settings:   { en: 'Settings', as: 'ছেটিংছ', hi: 'सेटिंग्स', bn: 'সেটিংস' },
    nav_profile:    { en: 'Profile', as: 'প্ৰ’ফাইল', hi: 'प्रोफ़ाइल', bn: 'প্রোফাইল' },
    search_ph:      { en: 'Search doctors, medicines, or health services…', as: 'ডাক্তৰ, ঔষধ বা সেৱা বিচাৰক…', hi: 'डॉक्टर, दवा या सेवा खोजें…', bn: 'ডাক্তার, ওষুধ বা সেবা খুঁজুন…' },
    stay_healthy:   { en: 'Stay healthy, stay happy!', as: 'সুস্থ থাকক, সুখী থাকক!', hi: 'स्वस्थ रहें, ख़ुश रहें!', bn: 'সুস্থ থাকুন, ভালো থাকুন!' },
    notifications:  { en: 'Notifications', as: 'জাননী', hi: 'सूचनाएँ', bn: 'বিজ্ঞপ্তি' },
    sign_out:       { en: 'Sign out', as: 'বাহিৰ হওক', hi: 'साइन आउट', bn: 'সাইন আউট' },
    view_all:       { en: 'View all', as: 'সকলো চাওক', hi: 'सभी देखें', bn: 'সব দেখুন' },
    all:            { en: 'All', as: 'সকলো', hi: 'सभी', bn: 'সব' },
    edit:           { en: 'Edit', as: 'সলনি কৰক', hi: 'बदलें', bn: 'সম্পাদনা' },
    delete:         { en: 'Delete', as: 'মচি দিয়ক', hi: 'हटाएँ', bn: 'মুছুন' },
    save:           { en: 'Save', as: 'সাঁচি থওক', hi: 'सहेजें', bn: 'সংরক্ষণ করুন' },
    remove:         { en: 'Remove', as: 'আঁতৰাওক', hi: 'हटाएँ', bn: 'সরান' },
    undo:           { en: 'Undo', as: 'পূৰ্বৰ দৰে', hi: 'पहले जैसा', bn: 'ফেরান' },

    /* ---- text size, right in the top bar ---- */
    text_size:      { en: 'Text size', as: 'আখৰৰ আকাৰ', hi: 'अक्षर का आकार', bn: 'লেখার আকার' },
    font_size:      { en: 'Font Size', as: 'আখৰৰ আকাৰ', hi: 'अक्षर का आकार', bn: 'লেখার আকার' },
    font_md:        { en: 'Standard', as: 'সাধাৰণ', hi: 'सामान्य', bn: 'সাধারণ' },
    font_lg:        { en: 'Large', as: 'ডাঙৰ', hi: 'बड़ा', bn: 'বড়' },
    font_xl:        { en: 'Extra large', as: 'অধিক ডাঙৰ', hi: 'और बड़ा', bn: 'আরও বড়' },
    font_xxl:       { en: 'Largest', as: 'আটাইতকৈ ডাঙৰ', hi: 'सबसे बड़ा', bn: 'সবচেয়ে বড়' },
    more_settings:  { en: 'More settings', as: 'আৰু ছেটিংছ', hi: 'और सेटिंग्स', bn: 'আরও সেটিংস' },
    font_changed:   { en: 'Text size updated.', as: 'আখৰৰ আকাৰ সলনি হ’ল।', hi: 'अक्षर का आकार बदल गया।', bn: 'লেখার আকার বদলে গেছে।' },

    /* ---- home ---- */
    hero_sub:       { en: 'Healthier Today, Happier Tomorrow.', as: 'আজি সুস্থ, কাইলৈ সুখী।', hi: 'आज स्वस्थ, कल ख़ुशहाल।', bn: 'আজ সুস্থ, কাল সুখী।' },
    hero_note:      { en: 'HUN is here to talk, help, and keep you connected.', as: 'HUN কথা পাতিবলৈ, সহায় কৰিবলৈ আৰু আপোনাক সংযুক্ত ৰাখিবলৈ আছে।', hi: 'HUN बात करने, मदद करने और आपको जोड़े रखने के लिए है।', bn: 'HUN কথা বলতে, সাহায্য করতে আর আপনাকে যুক্ত রাখতে আছে।' },
    talk_smivai:    { en: 'Talk with HUN', as: 'HUN ৰ সৈতে কথা পাতক', hi: 'HUN से बात करें', bn: 'HUN-এর সাথে কথা বলুন' },
    quick_actions:  { en: 'Quick Actions', as: 'দ্ৰুত কাম', hi: 'तुरंत काम', bn: 'দ্রুত কাজ' },
    book_doctor:    { en: 'Book a Doctor', as: 'ডাক্তৰ বুক কৰক', hi: 'डॉक्टर बुक करें', bn: 'ডাক্তার বুক করুন' },
    bd_sub:         { en: 'Consult from home', as: 'ঘৰৰ পৰাই পৰামৰ্শ লওক', hi: 'घर से परामर्श लें', bn: 'বাড়ি থেকে পরামর্শ নিন' },
    order_medicines:{ en: 'Order Medicines', as: 'ঔষধ অৰ্ডাৰ কৰক', hi: 'दवा मँगाएँ', bn: 'ওষুধ অর্ডার করুন' },
    om_sub:         { en: 'Get medicines at your doorstep', as: 'ঔষধ ঘৰলৈকে পাওক', hi: 'दवा घर तक पाएँ', bn: 'ওষুধ বাড়িতে পান' },
    request_caregiver:{ en: 'Request a Caregiver', as: 'যত্ন লওঁতাক মাতক', hi: 'देखभाल करने वाले को बुलाएँ', bn: 'পরিচর্যাকারীকে ডাকুন' },
    rc_sub:         { en: 'Get help at home', as: 'ঘৰতে সহায় পাওক', hi: 'घर पर मदद पाएँ', bn: 'বাড়িতে সাহায্য পান' },
    health_records: { en: 'My Health Records', as: 'মোৰ স্বাস্থ্যৰ নথি', hi: 'मेरे स्वास्थ्य रिकॉर्ड', bn: 'আমার স্বাস্থ্য রেকর্ড' },
    hr_sub:         { en: 'View anytime, anywhere', as: 'যিকোনো সময়তে চাওক', hi: 'कभी भी, कहीं भी देखें', bn: 'যে কোনও সময় দেখুন' },
    in_emergency:   { en: 'In an Emergency?', as: 'জৰুৰী অৱস্থা?', hi: 'आपात स्थिति?', bn: 'জরুরি অবস্থা?' },
    get_help:       { en: 'Get immediate assistance', as: 'ততালিকে সহায় লওক', hi: 'तुरंत सहायता लें', bn: 'এখনই সাহায্য নিন' },
    call_now:       { en: 'Call Now', as: 'এতিয়াই ফোন কৰক', hi: 'अभी कॉल करें', bn: 'এখনই ফোন করুন' },
    need_help:      { en: 'Need Immediate Help?', as: 'ততালিকে সহায় লাগে নেকি?', hi: 'तुरंत मदद चाहिए?', bn: 'এখনই সাহায্য দরকার?' },
    need_help_sub:  { en: 'In an emergency, get assistance now.', as: 'জৰুৰী অৱস্থাত এতিয়াই সহায় লওক।', hi: 'आपात स्थिति में अभी सहायता लें।', bn: 'জরুরি অবস্থায় এখনই সাহায্য নিন।' },
    todays_activities:{ en: 'Today’s Activities', as: 'আজিৰ কাম', hi: 'आज की गतिविधियाँ', bn: 'আজকের কাজ' },
    brain_workout:  { en: 'Your brain workout for today', as: 'আজিৰ মগজুৰ অনুশীলন', hi: 'आज का दिमाग़ी अभ्यास', bn: 'আজকের মস্তিষ্ক অনুশীলন' },
    play_next:      { en: 'Play {name}', as: '{name} খেলক', hi: '{name} खेलें', bn: '{name} খেলুন' },
    add_memory:     { en: 'Add a Memory', as: 'সোঁৱৰণ যোগ কৰক', hi: 'याद जोड़ें', bn: 'স্মৃতি যোগ করুন' },
    add_memory_sub: { en: 'Save a photo and its story', as: 'ফটো আৰু তাৰ কাহিনী সাঁচি থওক', hi: 'फ़ोटो और उसकी कहानी सहेजें', bn: 'ছবি আর তার গল্প রাখুন' },
    daily_fact:     { en: 'Daily Fact', as: 'আজিৰ কথা', hi: 'आज की बात', bn: 'আজকের কথা' },
    read_now:       { en: 'Read now', as: 'এতিয়া পঢ়ক', hi: 'अभी पढ़ें', bn: 'এখন পড়ুন' },
    read:           { en: 'Read', as: 'পঢ়া হ’ল', hi: 'पढ़ लिया', bn: 'পড়া হয়েছে' },
    learn_skill:    { en: 'Learn a New Skill', as: 'নতুন কিবা শিকক', hi: 'कुछ नया सीखें', bn: 'নতুন কিছু শিখুন' },
    n_minutes:      { en: '{n} minutes', as: '{n} মিনিট', hi: '{n} मिनट', bn: '{n} মিনিট' },
    streak_n:       { en: '{n}-day streak', as: 'একেৰাহে {n} দিন', hi: 'लगातार {n} दिन', bn: 'টানা {n} দিন' },
    start_streak:   { en: 'Start your streak today', as: 'আজিৰ পৰা আৰম্ভ কৰক', hi: 'आज से शुरू करें', bn: 'আজ থেকে শুরু করুন' },
    doing_well:     { en: 'You’re doing well — keep going!', as: 'আপুনি ভালদৰে আগবাঢ়িছে — চলি থাকক!', hi: 'आप अच्छा कर रहे हैं — जारी रखें!', bn: 'আপনি ভালো করছেন — চালিয়ে যান!' },
    upcoming_appts: { en: 'Upcoming Appointments', as: 'অহা সাক্ষাৎ', hi: 'आने वाली मुलाक़ातें', bn: 'আসন্ন অ্যাপয়েন্টমেন্ট' },
    health_summary: { en: 'My Health Summary', as: 'মোৰ স্বাস্থ্যৰ সাৰাংশ', hi: 'मेरे स्वास्थ्य का सार', bn: 'আমার স্বাস্থ্যের সারসংক্ষেপ' },
    bp:             { en: 'Blood Pressure', as: 'ৰক্তচাপ', hi: 'रक्तचाप', bn: 'রক্তচাপ' },
    weight:         { en: 'Weight', as: 'ওজন', hi: 'वज़न', bn: 'ওজন' },
    steps_today:    { en: 'Steps Today', as: 'আজিৰ খোজ', hi: 'आज के क़दम', bn: 'আজকের হাঁটা' },
    small_steps:    { en: 'Small Steps, Big Difference', as: 'সৰু পদক্ষেপ, ডাঙৰ পৰিৱৰ্তন', hi: 'छोटे क़दम, बड़ा फ़र्क़', bn: 'ছোট পদক্ষেপ, বড় পরিবর্তন' },
    small_steps_sub:{ en: 'Take care of your health today for a brighter tomorrow.', as: 'কাইলৈৰ ভাল দিনৰ বাবে আজি স্বাস্থ্যৰ যত্ন লওক।', hi: 'बेहतर कल के लिए आज सेहत का ध्यान रखें।', bn: 'ভালো আগামীর জন্য আজ স্বাস্থ্যের যত্ন নিন।' },
    health_tip:     { en: 'Today’s Health Tip', as: 'আজিৰ স্বাস্থ্য পৰামৰ্শ', hi: 'आज की सेहत सलाह', bn: 'আজকের স্বাস্থ্য পরামর্শ' },

    /* ---- feelings ---- */
    feel_happy:     { en: 'Happy', as: 'সুখী', hi: 'ख़ुश', bn: 'খুশি' },
    feel_good:      { en: 'Good', as: 'ভাল', hi: 'अच्छा', bn: 'ভালো' },
    feel_okay:      { en: 'Okay', as: 'মোটামুটি', hi: 'ठीक', bn: 'মোটামুটি' },
    feel_worried:   { en: 'Worried', as: 'চিন্তিত', hi: 'चिंतित', bn: 'চিন্তিত' },
    feel_sad:       { en: 'Sad', as: 'দুখী', hi: 'उदास', bn: 'মন খারাপ' },
    feel_tired:     { en: 'Tired', as: 'ভাগৰুৱা', hi: 'थका हुआ', bn: 'ক্লান্ত' },

    /* ---- reminders ---- */
    add_reminder:   { en: 'Add a Reminder', as: 'সোঁৱৰণী যোগ কৰক', hi: 'याद दिलाना जोड़ें', bn: 'রিমাইন্ডার যোগ করুন' },
    mark_complete:  { en: 'Mark Complete', as: 'সম্পূৰ্ণ বুলি দিয়ক', hi: 'पूरा हुआ लिखें', bn: 'সম্পন্ন করুন' },
    high_priority:  { en: 'High Priority', as: 'অতি জৰুৰী', hi: 'बहुत ज़रूरी', bn: 'খুব জরুরি' },
    rc_medicine:    { en: 'Medication', as: 'ঔষধ', hi: 'दवा', bn: 'ওষুধ' },
    rc_meal:        { en: 'Food', as: 'খোৱা', hi: 'खाना', bn: 'খাবার' },
    rc_appointment: { en: 'Appointments', as: 'সাক্ষাৎ', hi: 'मुलाक़ात', bn: 'অ্যাপয়েন্টমেন্ট' },
    rc_exercise:    { en: 'Exercise', as: 'ব্যায়াম', hi: 'व्यायाम', bn: 'ব্যায়াম' },
    rc_cognitive:   { en: 'Activities', as: 'কাম-কাজ', hi: 'गतिविधियाँ', bn: 'কাজকর্ম' },
    rc_custom:      { en: 'Other', as: 'আন', hi: 'अन्य', bn: 'অন্য' },
    rc_hydration:   { en: 'Water', as: 'পানী', hi: 'पानी', bn: 'জল' },
    rc_rest:        { en: 'Rest', as: 'জিৰণি', hi: 'आराम', bn: 'বিশ্রাম' },

    /* ---- memories ---- */
    n_memories:     { en: '{n} memories', as: '{n} টা সোঁৱৰণ', hi: '{n} यादें', bn: '{n}টি স্মৃতি' },
    mg_family:      { en: 'Family', as: 'পৰিয়াল', hi: 'परिवार', bn: 'পরিবার' },
    mg_people:      { en: 'People', as: 'মানুহ', hi: 'लोग', bn: 'মানুষ' },
    mg_places:      { en: 'Places', as: 'ঠাই', hi: 'जगहें', bn: 'জায়গা' },
    mg_moments:     { en: 'Special Moments', as: 'বিশেষ মুহূৰ্ত', hi: 'ख़ास पल', bn: 'বিশেষ মুহূর্ত' },
    talk_about_memory:{ en: 'Talk about this memory', as: 'এই সোঁৱৰণৰ বিষয়ে কথা পাতক', hi: 'इस याद के बारे में बात करें', bn: 'এই স্মৃতি নিয়ে কথা বলুন' },

    /* ---- talk ---- */
    tap_to_talk:    { en: 'Tap the microphone and talk to me', as: 'মাইক্ৰ’ফোনত টিপি মোৰ লগত কথা পাতক', hi: 'माइक दबाकर मुझसे बात करें', bn: 'মাইক চেপে আমার সাথে কথা বলুন' },
    type_to_talk:   { en: 'Type your message below and I will answer', as: 'তলত লিখক, মই উত্তৰ দিম', hi: 'नीचे लिखिए, मैं जवाब दूँगा', bn: 'নিচে লিখুন, আমি উত্তর দেব' },
    tap_mic:        { en: 'Tap to speak', as: 'ক’বলৈ টিপক', hi: 'बोलने के लिए दबाएँ', bn: 'বলতে চাপুন' },
    listening_now:  { en: 'Listening… speak whenever you are ready', as: 'শুনি আছোঁ… আপুনি সাজু হ’লে ক’ব পাৰে', hi: 'सुन रहा हूँ… आप तैयार हों तो बोलिए', bn: 'শুনছি… আপনি তৈরি হলে বলুন' },
    thinking:       { en: 'One moment…', as: 'অলপ ৰ’ব…', hi: 'एक पल…', bn: 'একটু দাঁড়ান…' },
    done_btn2:      { en: 'DONE', as: 'শেষ', hi: 'हो गया', bn: 'শেষ' },
    conv_ended_state:{ en: 'Conversation ended', as: 'কথা-বতৰা শেষ হ’ল', hi: 'बातचीत ख़त्म', bn: 'কথা শেষ' },
    conv_ended:     { en: 'Conversation ended. I am here whenever you want to talk again.', as: 'কথা-বতৰা শেষ হ’ল। আকৌ কথা পাতিব বিচাৰিলে মই আছোঁ।', hi: 'बातचीत ख़त्म। फिर बात करनी हो तो मैं यहीं हूँ।', bn: 'কথা শেষ। আবার কথা বলতে চাইলে আমি আছি।' },
    mic_off:        { en: 'Microphone off.', as: 'মাইক্ৰ’ফোন বন্ধ।', hi: 'माइक बंद।', bn: 'মাইক বন্ধ।' },
    type_ph:        { en: 'Or type here…', as: 'বা ইয়াত লিখক…', hi: 'या यहाँ लिखें…', bn: 'বা এখানে লিখুন…' },

    /* ---- games & progress ---- */
    great_job:      { en: 'Great job!', as: 'বৰ ভাল!', hi: 'शाबाश!', bn: 'দারুণ!' },
    back_to_games:  { en: 'Back to Games', as: 'খেললৈ উভতি যাওক', hi: 'खेलों पर वापस', bn: 'খেলায় ফিরুন' },
    performance:    { en: 'Performance', as: 'কৰা কাম', hi: 'प्रदर्शन', bn: 'ফলাফল' },
    time_taken:     { en: 'Time', as: 'সময়', hi: 'समय', bn: 'সময়' },
    games_done:     { en: 'Games completed', as: 'খেলা সম্পূৰ্ণ', hi: 'पूरे किए खेल', bn: 'সম্পন্ন খেলা' },
    avg_score:      { en: 'Average score', as: 'গড় স্ক’ৰ', hi: 'औसत स्कोर', bn: 'গড় স্কোর' },
    accuracy:       { en: 'Accuracy', as: 'শুদ্ধতা', hi: 'सटीकता', bn: 'নির্ভুলতা' },
    streak:         { en: 'Day streak', as: 'একেৰাহে দিন', hi: 'लगातार दिन', bn: 'টানা দিন' },
    weekly_activity:{ en: 'Weekly activity', as: 'সাপ্তাহিক কাম', hi: 'साप्ताहिक गतिविधि', bn: 'সাপ্তাহিক কাজ' },
    recent_games:   { en: 'Recent games', as: 'শেহতীয়া খেল', hi: 'हाल के खेल', bn: 'সাম্প্রতিক খেলা' },

    /* ---- premium ---- */
    see_premium:    { en: 'See Premium', as: 'প্ৰিমিয়াম চাওক', hi: 'प्रीमियम देखें', bn: 'প্রিমিয়াম দেখুন' },
    unlock_premium: { en: 'Unlock SMIVAI Premium', as: 'SMIVAI প্ৰিমিয়াম খোলক', hi: 'SMIVAI प्रीमियम खोलें', bn: 'SMIVAI প্রিমিয়াম খুলুন' },
    with_premium:   { en: 'Available with SMIVAI Premium', as: 'SMIVAI প্ৰিমিয়ামত পোৱা যায়', hi: 'SMIVAI प्रीमियम में उपलब्ध', bn: 'SMIVAI প্রিমিয়ামে পাওয়া যায়' },

    /* ---- language & voice settings ---- */
    lang_voice:     { en: 'Language & voice', as: 'ভাষা আৰু কণ্ঠ', hi: 'भाषा और आवाज़', bn: 'ভাষা ও কণ্ঠ' },
    interface_text: { en: 'Interface text', as: 'পৰ্দাৰ আখৰ', hi: 'स्क्रीन का पाठ', bn: 'পর্দার লেখা' },
    spoken_voice:   { en: 'Spoken voice', as: 'কথা কোৱা কণ্ঠ', hi: 'बोलने की आवाज़', bn: 'কথা বলার কণ্ঠ' },
    speech_input:   { en: 'Speech recognition', as: 'কথা বুজা', hi: 'आवाज़ पहचान', bn: 'কথা শনাক্তকরণ' },
    read_fallback:  { en: 'If your language has no voice', as: 'আপোনাৰ ভাষাৰ কণ্ঠ নাথাকিলে', hi: 'आपकी भाषा की आवाज़ न हो तो', bn: 'আপনার ভাষার কণ্ঠ না থাকলে' },
    dont_read:      { en: 'Show the text only', as: 'কেৱল আখৰ দেখুৱাওক', hi: 'सिर्फ़ लिखा हुआ दिखाएँ', bn: 'শুধু লেখা দেখান' },
    read_in:        { en: 'Read aloud in {lang}', as: '{lang} ভাষাত পঢ়ি শুনাওক', hi: '{lang} में पढ़कर सुनाएँ', bn: '{lang} ভাষায় পড়ে শোনান' },
    read_instead:   { en: 'Read in {lang} — this device has no {missing} voice.', as: '{lang} ভাষাত পঢ়া হ’ল — এই ডিভাইচত {missing} কণ্ঠ নাই।', hi: '{lang} में पढ़ा गया — इस डिवाइस में {missing} आवाज़ नहीं है।', bn: '{lang} ভাষায় পড়া হয়েছে — এই ডিভাইসে {missing} কণ্ঠ নেই।' },
    no_voice_here:  { en: 'This device has no {lang} voice, so HUN shows the words instead of reading them.', as: 'এই ডিভাইচত {lang} কণ্ঠ নাই, গতিকে HUN এ পঢ়ি নুশুনায়, আখৰ দেখুৱায়।', hi: 'इस डिवाइस में {lang} आवाज़ नहीं है, इसलिए HUN पढ़कर नहीं सुनाता, लिखा हुआ दिखाता है।', bn: 'এই ডিভাইসে {lang} কণ্ঠ নেই, তাই HUN পড়ে শোনায় না, লেখা দেখায়।' }
  };
  Object.keys(STRINGS_V2).forEach(function (k) { STRINGS[k] = STRINGS_V2[k]; });

  /* Second batch: everything else a patient actually sees on the home
     screen, the sidebar, Settings and the two new games. Same standing —
     AI-drafted seeds, marked, awaiting a native speaker. */
  var STRINGS_V3 = {
    /* ---- sidebar & plan ---- */
    sos_short:      { en: 'Emergency SOS', as: 'জৰুৰী সহায়', hi: 'आपातकालीन मदद', bn: 'জরুরি সাহায্য' },
    premium_pitch_p:{ en: 'All 8 brain games, deeper conversations and detailed progress.', as: 'আঠোটা মগজুৰ খেল, গভীৰ কথা-বতৰা আৰু বিতং অগ্ৰগতি।', hi: 'आठों दिमाग़ी खेल, गहरी बातचीत और विस्तृत प्रगति।', bn: 'আটটি মস্তিষ্কের খেলা, গভীর কথা আর বিস্তারিত অগ্রগতি।' },
    premium_active: { en: 'All your Premium features are on.', as: 'আপোনাৰ প্ৰিমিয়াম সুবিধা সক্ৰিয় হৈ আছে।', hi: 'आपकी सभी प्रीमियम सुविधाएँ चालू हैं।', bn: 'আপনার সব প্রিমিয়াম সুবিধা চালু আছে।' },

    /* ---- health summary chips ---- */
    vl_normal:      { en: 'Normal', as: 'স্বাভাৱিক', hi: 'सामान्य', bn: 'স্বাভাবিক' },
    vl_good:        { en: 'Good', as: 'ভাল', hi: 'अच्छा', bn: 'ভালো' },
    vl_recorded:    { en: 'Recorded', as: 'লিখা হ’ল', hi: 'दर्ज है', bn: 'নথিভুক্ত' },
    vl_keep_going_: { en: 'Keep Going!', as: 'চলি থাকক!', hi: 'चलते रहिए!', bn: 'চালিয়ে যান!' },
    vl_great_going_:{ en: 'Great going!', as: 'বৰ ভাল চলিছে!', hi: 'बहुत बढ़िया!', bn: 'দারুণ চলছে!' },
    vl_ask_your_doctor:{ en: 'Ask your doctor', as: 'ডাক্তৰক সোধক', hi: 'डॉक्टर से पूछें', bn: 'ডাক্তারকে জিজ্ঞাসা করুন' },

    /* ---- health tips on the home rail ---- */
    tip_t_0: { en: 'Stay hydrated!', as: 'পানী খাই থাকক!', hi: 'पानी पीते रहें!', bn: 'জল খেতে থাকুন!' },
    tip_b_0: { en: 'Drink a glass of water with each meal and one in between.', as: 'প্ৰতিটো আহাৰৰ লগত এক গিলাচ পানী, আৰু মাজতো এক গিলাচ খাওক।', hi: 'हर भोजन के साथ एक गिलास पानी और बीच में भी एक गिलास पिएँ।', bn: 'প্রতি বেলা খাবারের সঙ্গে এক গ্লাস জল, আর মাঝেও এক গ্লাস খান।' },
    tip_t_1: { en: 'Move a little, often', as: 'অলপ অলপকৈ লৰচৰ কৰক', hi: 'थोड़ा-थोड़ा चलते रहें', bn: 'একটু একটু করে চলাফেরা করুন' },
    tip_b_1: { en: 'A short walk or chair marching after meals keeps the body happy.', as: 'আহাৰৰ পিছত অলপ খোজকঢ়া বা বহি থাকি ভৰি লৰোৱা শৰীৰৰ বাবে ভাল।', hi: 'खाने के बाद थोड़ा टहलना या कुर्सी पर बैठे-बैठे पैर चलाना शरीर के लिए अच्छा है।', bn: 'খাওয়ার পরে একটু হাঁটা বা চেয়ারে বসে পা নাড়ানো শরীরের জন্য ভালো।' },
    tip_t_2: { en: 'Talk to someone today', as: 'আজি কাৰোবাৰ সৈতে কথা পাতক', hi: 'आज किसी से बात करें', bn: 'আজ কারও সাথে কথা বলুন' },
    tip_b_2: { en: 'A phone call with family or a friend is good for the heart and mind.', as: 'পৰিয়াল বা বন্ধুৰ সৈতে এটা ফোন হৃদয় আৰু মনৰ বাবে ভাল।', hi: 'परिवार या दोस्त से एक फ़ोन दिल और मन दोनों के लिए अच्छा है।', bn: 'পরিবার বা বন্ধুর সঙ্গে একটা ফোন মন আর হৃদয়ের জন্য ভালো।' },
    tip_t_3: { en: 'Keep a steady routine', as: 'একেধৰণৰ দিনচৰ্যা ৰাখক', hi: 'दिनचर्या एक जैसी रखें', bn: 'নিয়মিত রুটিন রাখুন' },
    tip_b_3: { en: 'Waking and eating at the same times each day helps you feel settled.', as: 'প্ৰতিদিন একে সময়তে সাৰ পোৱা আৰু খোৱাই মনটো শান্ত ৰাখে।', hi: 'हर दिन एक ही समय पर उठना और खाना मन को स्थिर रखता है।', bn: 'প্রতিদিন একই সময়ে ওঠা আর খাওয়া মনকে শান্ত রাখে।' },
    tip_t_4: { en: 'Rest your eyes', as: 'চকুক জিৰণি দিয়ক', hi: 'आँखों को आराम दें', bn: 'চোখকে বিশ্রাম দিন' },
    tip_b_4: { en: 'Every so often, look at something far away for a few seconds.', as: 'মাজে মাজে দূৰৰ কিবা এটালৈ কেইছেকেণ্ডমান চাওক।', hi: 'बीच-बीच में कुछ सेकंड के लिए दूर की किसी चीज़ को देखें।', bn: 'মাঝে মাঝে কয়েক সেকেন্ড দূরের কিছু দেখুন।' },
    tip_t_5: { en: 'Enjoy some sunlight', as: 'অলপ ৰ’দ লওক', hi: 'थोड़ी धूप लें', bn: 'একটু রোদ নিন' },
    tip_b_5: { en: 'A little morning light near a window or on a walk can lift the mood.', as: 'ৰাতিপুৱাৰ অলপ পোহৰে মন ভাল কৰে — খিৰিকীৰ কাষত বা খোজ কাঢ়ি।', hi: 'सुबह की थोड़ी रोशनी — खिड़की के पास या टहलते हुए — मन अच्छा करती है।', bn: 'সকালের একটু আলো — জানালার পাশে বা হাঁটতে হাঁটতে — মন ভালো করে।' },

    /* ---- check-in replies ---- */
    feel_reply_happy:  { en: 'That’s lovely to hear! Keep smiling today.', as: 'শুনি ভাল লাগিল! আজি হাঁহি-মাত লৈ থাকক।', hi: 'सुनकर अच्छा लगा! आज मुस्कुराते रहिए।', bn: 'শুনে ভালো লাগল! আজ হাসিমুখে থাকুন।' },
    feel_reply_good:   { en: 'Wonderful. Have a gentle, good day.', as: 'বৰ ভাল। দিনটো শান্তিৰে যাওক।', hi: 'बहुत बढ़िया। दिन शांति से बीते।', bn: 'দারুণ। দিনটা শান্তিতে কাটুক।' },
    feel_reply_okay:   { en: 'Thank you for telling me. A short walk or a chat might brighten things.', as: 'কোৱাৰ বাবে ধন্যবাদ। অলপ খোজকঢ়া বা কথা পতাই মন ভাল কৰিব পাৰে।', hi: 'बताने के लिए धन्यवाद। थोड़ा टहलना या बातचीत मन हल्का कर सकती है।', bn: 'জানানোর জন্য ধন্যবাদ। একটু হাঁটা বা গল্প মন হালকা করতে পারে।' },
    feel_reply_worried:{ en: 'Thank you for telling me. You are not alone — would you like to talk?', as: 'কোৱাৰ বাবে ধন্যবাদ। আপুনি অকলশৰীয়া নহয় — কথা পাতিব নেকি?', hi: 'बताने के लिए धन्यवाद। आप अकेले नहीं हैं — बात करेंगे?', bn: 'জানানোর জন্য ধন্যবাদ। আপনি একা নন — কথা বলবেন?' },
    feel_reply_sad:    { en: 'I’m sorry you feel sad. Talking to someone can help.', as: 'আপোনাৰ মন বেয়া লাগিছে বুলি শুনি দুখ পালোঁ। কাৰোবাৰ সৈতে কথা পাতিলে ভাল লাগিব পাৰে।', hi: 'आपका मन उदास है, यह सुनकर दुख हुआ। किसी से बात करने से मदद मिल सकती है।', bn: 'আপনার মন খারাপ শুনে কষ্ট হল। কারও সঙ্গে কথা বললে ভালো লাগতে পারে।' },
    feel_reply_tired:  { en: 'Thank you for telling me. A little rest and some water can help.', as: 'কোৱাৰ বাবে ধন্যবাদ। অলপ জিৰণি আৰু পানীয়ে সহায় কৰিব।', hi: 'बताने के लिए धन्यवाद। थोड़ा आराम और पानी मदद करेगा।', bn: 'জানানোর জন্য ধন্যবাদ। একটু বিশ্রাম আর জল সাহায্য করবে।' },
    call_family:       { en: 'Call your family', as: 'পৰিয়ালক ফোন কৰক', hi: 'परिवार को फ़ोन करें', bn: 'পরিবারকে ফোন করুন' },

    /* ---- the two new games ---- */
    game_pattern:       { en: 'Complete the Pattern', as: 'আৰ্হি সম্পূৰ্ণ কৰক', hi: 'पैटर्न पूरा करें', bn: 'প্যাটার্ন সম্পূর্ণ করুন' },
    game_word_hustle:   { en: 'Word Hustle', as: 'শব্দ সজাওক', hi: 'शब्द जमाएँ', bn: 'শব্দ সাজান' },
    pattern_instruction:{ en: 'Choose the shape that comes next.', as: 'পিছত অহা আকৃতিটো বাছি লওক।', hi: 'आगे आने वाली आकृति चुनें।', bn: 'পরে আসা আকৃতিটি বেছে নিন।' },
    pattern_sub:        { en: 'Look at the row, then tap your answer below.', as: 'শাৰীটো চাওক, তাৰ পিছত তলত উত্তৰত টিপক।', hi: 'पंक्ति देखिए, फिर नीचे उत्तर पर दबाइए।', bn: 'সারিটি দেখুন, তারপর নিচে উত্তরে চাপুন।' },
    word_instruction:   { en: 'Spell the word in the picture.', as: 'ছবিখনৰ শব্দটো লিখক।', hi: 'तस्वीर का शब्द लिखिए।', bn: 'ছবির শব্দটি লিখুন।' },
    word_sub:           { en: 'Tap the letters in order. Tap a letter again to take it back.', as: 'আখৰবোৰ ক্ৰমে টিপক। ঘূৰাই ল’বলৈ আখৰটোত পুনৰ টিপক।', hi: 'अक्षरों को क्रम से दबाएँ। वापस लेने के लिए अक्षर फिर दबाएँ।', bn: 'অক্ষরগুলো ক্রমে চাপুন। ফেরাতে অক্ষরে আবার চাপুন।' },
    start_over:         { en: 'Start this word again', as: 'এই শব্দটো আকৌ আৰম্ভ কৰক', hi: 'यह शब्द फिर से शुरू करें', bn: 'এই শব্দটি আবার শুরু করুন' },

    /* ---- settings labels ---- */
    settings_sub:   { en: 'Make SMIVAI comfortable for you.', as: 'SMIVAI আপোনাৰ বাবে আৰামদায়ক কৰক।', hi: 'SMIVAI को अपने लिए आरामदेह बनाएँ।', bn: 'SMIVAI আপনার জন্য আরামদায়ক করুন।' },
    font_size_sub:  { en: 'Everything in SMIVAI gets bigger.', as: 'SMIVAI ৰ সকলো আখৰ ডাঙৰ হ’ব।', hi: 'SMIVAI में सब कुछ बड़ा हो जाएगा।', bn: 'SMIVAI-এর সবকিছু বড় হবে।' },
    lang_sub:       { en: 'The language you read and hear.', as: 'আপুনি পঢ়া আৰু শুনা ভাষা।', hi: 'जिस भाषा में आप पढ़ते और सुनते हैं।', bn: 'যে ভাষায় আপনি পড়েন ও শোনেন।' },
    voice_sound:    { en: 'Voice & sound', as: 'কণ্ঠ আৰু শব্দ', hi: 'आवाज़ और ध्वनि', bn: 'কণ্ঠ ও শব্দ' },
    voice_sub:      { en: 'How HUN speaks to you.', as: 'HUN এ আপোনাক কেনেকৈ কয়।', hi: 'HUN आपसे कैसे बोलता है।', bn: 'HUN আপনাকে কীভাবে বলে।' },
    read_aloud_auto:{ en: 'Read answers aloud automatically', as: 'উত্তৰবোৰ নিজেই পঢ়ি শুনাওক', hi: 'जवाब अपने आप पढ़कर सुनाएँ', bn: 'উত্তর নিজে থেকেই পড়ে শোনাক' },
    notif_sub:      { en: 'What SMIVAI tells you about.', as: 'SMIVAI এ কি বিষয়ে জনাব।', hi: 'SMIVAI किन बातों की ख़बर दे।', bn: 'SMIVAI কী কী জানাবে।' },
    n_reminders:    { en: 'Reminders when they are due', as: 'সময় হ’লে সোঁৱৰণী', hi: 'समय होने पर याद दिलाना', bn: 'সময় হলে মনে করানো' },
    n_caregiver:    { en: 'Messages from my care team', as: 'যত্ন লোৱা দলৰ বাৰ্তা', hi: 'देखभाल टीम के संदेश', bn: 'যত্ন দলের বার্তা' },
    n_appointments: { en: 'Appointments', as: 'সাক্ষাৎ', hi: 'मुलाक़ातें', bn: 'অ্যাপয়েন্টমেন্ট' },
    n_system:       { en: 'Also show notifications outside SMIVAI', as: 'SMIVAI ৰ বাহিৰতো জাননী দেখুৱাওক', hi: 'SMIVAI के बाहर भी सूचनाएँ दिखाएँ', bn: 'SMIVAI-এর বাইরেও বিজ্ঞপ্তি দেখান' },
    accessibility:  { en: 'Accessibility', as: 'সহজ ব্যৱহাৰ', hi: 'सुगमता', bn: 'সহজ ব্যবহার' },
    access_sub:     { en: 'Extra comfort options.', as: 'অধিক আৰামৰ বিকল্প।', hi: 'और आराम के विकल्प।', bn: 'আরও আরামের বিকল্প।' },
    high_contrast:  { en: 'Stronger contrast', as: 'অধিক স্পষ্ট ৰং', hi: 'ज़्यादा साफ़ रंग', bn: 'আরও স্পষ্ট রং' },
    reduce_motion:  { en: 'Reduce movement and animation', as: 'লৰচৰ কম কৰক', hi: 'हलचल कम करें', bn: 'নড়াচড়া কমান' },
    show_weather:   { en: 'Show the weather on my home screen', as: 'ঘৰৰ পৰ্দাত বতৰ দেখুৱাওক', hi: 'होम स्क्रीन पर मौसम दिखाएँ', bn: 'হোম স্ক্রিনে আবহাওয়া দেখান' },
    your_plan_t:    { en: 'Your plan', as: 'আপোনাৰ প্লেন', hi: 'आपका प्लान', bn: 'আপনার প্ল্যান' },
    plan_sub:       { en: 'What is included for you.', as: 'আপোনাৰ বাবে কি কি আছে।', hi: 'आपके लिए क्या-क्या शामिल है।', bn: 'আপনার জন্য কী কী আছে।' },
    account:        { en: 'Account', as: 'একাউণ্ট', hi: 'खाता', bn: 'অ্যাকাউন্ট' },
    account_sub:    { en: 'Who you are on SMIVAI.', as: 'SMIVAI ত আপুনি কোন।', hi: 'SMIVAI पर आप कौन हैं।', bn: 'SMIVAI-তে আপনি কে।' },
    years:          { en: 'years', as: 'বছৰ', hi: 'साल', bn: 'বছর' },
    your_code:      { en: 'Your care code', as: 'আপোনাৰ যত্ন ক’ড', hi: 'आपका देखभाल कोड', bn: 'আপনার যত্ন কোড' },
    copy_code:      { en: 'Copy code', as: 'ক’ড কপি কৰক', hi: 'कोड कॉपी करें', bn: 'কোড কপি করুন' },
    who_can_see:    { en: 'Who can see my information', as: 'মোৰ তথ্য কোনে চাব পাৰে', hi: 'मेरी जानकारी कौन देख सकता है', bn: 'আমার তথ্য কে দেখতে পারে' },
    data_storage:   { en: 'Data & storage', as: 'তথ্য আৰু ভঁৰাল', hi: 'डेटा और भंडारण', bn: 'তথ্য ও সংরক্ষণ' },
    data_sub:       { en: 'Where your information lives.', as: 'আপোনাৰ তথ্য ক’ত থাকে।', hi: 'आपकी जानकारी कहाँ रहती है।', bn: 'আপনার তথ্য কোথায় থাকে।' },
    sync_now:       { en: 'Sync now', as: 'এতিয়া ছিংক কৰক', hi: 'अभी सिंक करें', bn: 'এখনই সিঙ্ক করুন' },
    export_data:    { en: 'Export my data', as: 'মোৰ তথ্য ৰপ্তানি কৰক', hi: 'मेरा डेटा निर्यात करें', bn: 'আমার তথ্য রপ্তানি করুন' },

    /* ---- language panel ---- */
    cap_on:         { en: 'Working', as: 'চলি আছে', hi: 'चालू है', bn: 'চালু আছে' },
    cap_partial:    { en: 'Partly', as: 'আংশিক', hi: 'आंशिक', bn: 'আংশিক' },
    cap_off:        { en: 'Not available', as: 'নাই', hi: 'उपलब्ध नहीं', bn: 'নেই' },
    cov_detail:     { en: '{p}% of the app is written in {lang}; the rest is shown in English.', as: 'এপটোৰ {p}% {lang} ভাষাত লিখা; বাকীখিনি ইংৰাজীত দেখুৱা হয়।', hi: 'ऐप का {p}% {lang} में लिखा है; बाक़ी अंग्रेज़ी में दिखता है।', bn: 'অ্যাপের {p}% {lang} ভাষায় লেখা; বাকিটা ইংরেজিতে দেখানো হয়।' },
    lang_connect:   { en: 'Connect a language service', as: 'ভাষা সেৱা সংযোগ কৰক', hi: 'भाषा सेवा जोड़ें', bn: 'ভাষা সেবা যুক্ত করুন' },
    lang_change_conn:{ en: 'Change connection', as: 'সংযোগ সলনি কৰক', hi: 'कनेक्शन बदलें', bn: 'সংযোগ বদলান' },
    test_conn:      { en: 'Test it', as: 'পৰীক্ষা কৰক', hi: 'जाँचें', bn: 'পরীক্ষা করুন' },
    fill_gaps:      { en: 'Fill the missing words', as: 'বাকী শব্দবোৰ পূৰণ কৰক', hi: 'बाक़ी शब्द भरें', bn: 'বাকি শব্দগুলো পূরণ করুন' },
    export_review:  { en: 'Export for review', as: 'পৰীক্ষাৰ বাবে ৰপ্তানি', hi: 'समीक्षा के लिए निर्यात', bn: 'পর্যালোচনার জন্য রপ্তানি' },
    asr_on:         { en: 'You can speak to HUN in {lang}.', as: 'আপুনি {lang} ভাষাত HUN ৰ সৈতে ক’ব পাৰে।', hi: 'आप {lang} में HUN से बोल सकते हैं।', bn: 'আপনি {lang} ভাষায় HUN-এর সাথে বলতে পারেন।' },
    lang_honest:    { en: 'Every non-English line in SMIVAI is an AI-drafted seed awaiting a native speaker, and anything not yet translated is shown in English rather than guessed. Connecting Bhashini or AI4Bharat fills the gaps and adds a real voice.', as: 'SMIVAI ৰ ইংৰাজীৰ বাহিৰৰ প্ৰতিটো বাক্য AI-এ লিখা খচৰা, যাক এতিয়াও স্থানীয় ভাষীয়ে পৰীক্ষা কৰা নাই; যিখিনি অনুবাদ হোৱা নাই, সেইখিনি অনুমান নকৰি ইংৰাজীতে দেখুৱা হয়। Bhashini বা AI4Bharat সংযোগ কৰিলে বাকীখিনি পূৰণ হ’ব আৰু প্ৰকৃত কণ্ঠ পোৱা যাব।', hi: 'SMIVAI की हर ग़ैर-अंग्रेज़ी पंक्ति AI का लिखा मसौदा है, जिसकी जाँच किसी मातृभाषी ने अभी नहीं की; जो अनुवाद नहीं हुआ, वह अनुमान लगाए बिना अंग्रेज़ी में ही दिखता है। Bhashini या AI4Bharat जोड़ने पर कमी पूरी होगी और असली आवाज़ मिलेगी।', bn: 'SMIVAI-এর প্রতিটি অ-ইংরেজি বাক্য AI-এর লেখা খসড়া, যা এখনও মাতৃভাষীর যাচাই পায়নি; যা অনুবাদ হয়নি তা অনুমান না করে ইংরেজিতেই দেখানো হয়। Bhashini বা AI4Bharat যুক্ত করলে বাকিটা পূরণ হবে আর সত্যিকারের কণ্ঠ পাওয়া যাবে।' },
    connect_below:  { en: 'Connecting a language service below adds a real voice.', as: 'তলত ভাষা সেৱা সংযোগ কৰিলে প্ৰকৃত কণ্ঠ পোৱা যাব।', hi: 'नीचे भाषा सेवा जोड़ने पर असली आवाज़ मिलेगी।', bn: 'নিচে ভাষা সেবা যুক্ত করলে সত্যিকারের কণ্ঠ পাওয়া যাবে।' },
    asr_off:        { en: 'HUN cannot hear {lang} on this device yet — you can type instead.', as: 'এই ডিভাইচত HUN এ এতিয়ালৈকে {lang} শুনিব নোৱাৰে — আপুনি লিখিব পাৰে।', hi: 'इस डिवाइस पर HUN अभी {lang} नहीं सुन सकता — आप लिख सकते हैं।', bn: 'এই ডিভাইসে HUN এখনও {lang} শুনতে পারে না — আপনি লিখতে পারেন।' },
    asr_device:     { en: 'This browser can hear {lang}. Accuracy varies.', as: 'এই ব্ৰাউজাৰে {lang} শুনিব পাৰে। শুদ্ধতা ভিন্ন হ’ব পাৰে।', hi: 'यह ब्राउज़र {lang} सुन सकता है। सटीकता अलग-अलग हो सकती है।', bn: 'এই ব্রাউজার {lang} শুনতে পারে। নির্ভুলতা বদলাতে পারে।' },
    fallback_set:   { en: 'HUN will read aloud in {lang} when your language has no voice.', as: 'আপোনাৰ ভাষাৰ কণ্ঠ নাথাকিলে HUN এ {lang} ভাষাত পঢ়ি শুনাব।', hi: 'आपकी भाषा की आवाज़ न होने पर HUN {lang} में पढ़कर सुनाएगा।', bn: 'আপনার ভাষার কণ্ঠ না থাকলে HUN {lang} ভাষায় পড়ে শোনাবে।' }
  };
  Object.keys(STRINGS_V3).forEach(function (k) { STRINGS[k] = STRINGS_V3[k]; });

  /* Third batch: the first thing a patient reads on each inner screen —
     page headings, primary buttons and the short line under them. Same
     standing: AI-drafted seeds, marked, awaiting a native speaker. */
  var STRINGS_V4 = {
    /* ---- talk ---- */
    talk_open:      { en: 'Hello {name} Ji 👋 I’m HUN, and I’m here to talk with you. What would you like to talk about today?', as: 'নমস্কাৰ {name} জী 👋 মই আপোনাৰ লগত কথা পাতিবলৈ আছোঁ। আজি কি বিষয়ে কথা পাতিব?', hi: 'नमस्ते {name} जी 👋 मैं आपसे बात करने के लिए हूँ। आज किस बारे में बात करें?', bn: 'নমস্কার {name} জি 👋 আমি আপনার সঙ্গে কথা বলতে আছি। আজ কী নিয়ে কথা বলবেন?' },
    type_message:   { en: 'Type a message', as: 'বাৰ্তা লিখক', hi: 'संदेश लिखें', bn: 'বার্তা লিখুন' },
    send:           { en: 'Send', as: 'পঠাওক', hi: 'भेजें', bn: 'পাঠান' },
    start_talking:  { en: 'Start talking', as: 'কথা পতা আৰম্ভ কৰক', hi: 'बात करना शुरू करें', bn: 'কথা বলা শুরু করুন' },
    mic_unavailable:{ en: 'Microphone not available', as: 'মাইক্ৰ’ফোন নাই', hi: 'माइक उपलब्ध नहीं', bn: 'মাইক নেই' },
    type_instead:   { en: 'You can type instead — I will still answer and read it aloud.', as: 'আপুনি লিখিব পাৰে — মই তথাপি উত্তৰ দিম আৰু পঢ়ি শুনাম।', hi: 'आप लिख सकते हैं — मैं फिर भी जवाब दूँगा और पढ़कर सुनाऊँगा।', bn: 'আপনি লিখতে পারেন — আমি তবুও উত্তর দেব ও পড়ে শোনাব।' },
    talk_disc:      { en: 'HUN is a companion, not a doctor. It answers from your own reminders, memories and activity, and never gives medical advice.', as: 'HUN এজন সংগী, ডাক্তৰ নহয়। ই আপোনাৰ নিজৰ সোঁৱৰণী, সোঁৱৰণ আৰু কামৰ পৰাই উত্তৰ দিয়ে, চিকিৎসাৰ পৰামৰ্শ কেতিয়াও নিদিয়ে।', hi: 'HUN एक साथी है, डॉक्टर नहीं। यह आपकी अपनी याद-दिलाने, यादों और गतिविधि से जवाब देता है, चिकित्सा सलाह कभी नहीं देता।', bn: 'HUN একজন সঙ্গী, ডাক্তার নয়। এটি আপনার নিজের রিমাইন্ডার, স্মৃতি ও কাজ থেকে উত্তর দেয়, চিকিৎসার পরামর্শ কখনও দেয় না।' },
    progress_disc:  { en: 'This is a progress-tracking aid, not a medical diagnosis.', hi: 'यह प्रगति देखने का एक साधन है, चिकित्सीय निदान नहीं।', as: 'এইটো প্ৰগতি চোৱাৰ এটা সহায়, চিকিৎসা নিদান নহয়।', bn: 'এটি অগ্রগতি দেখার একটি সহায়, চিকিৎসা-নির্ণয় নয়।' },
    lock_level:     { en: 'Always use this level', hi: 'हमेशा यही स्तर रखें', as: 'সদায় এই স্তৰটো ৰাখক', bn: 'সবসময় এই স্তর রাখুন' },

    /* ---- games catalogue ---- */
    games_sub:      { en: 'Gentle games that keep your mind active. There is never any rush.', as: 'মনটো সজীৱ কৰি ৰখা শান্ত খেল। কেতিয়াও খৰখেদা নাই।', hi: 'मन को सक्रिय रखने वाले सहज खेल। कोई जल्दबाज़ी नहीं।', bn: 'মন সজীব রাখা শান্ত খেলা। কোনও তাড়াহুড়ো নেই।' },
    games_free:     { en: '4 of 8 games on your Free plan', as: 'বিনামূলীয়া প্লেনত ৮ টাৰ ভিতৰত ৪ টা খেল', hi: 'फ़्री प्लान में 8 में से 4 खेल', bn: 'ফ্রি প্ল্যানে ৮টির মধ্যে ৪টি খেলা' },
    games_all:      { en: 'All 8 games', as: 'আঠোটা খেল', hi: 'सभी 8 खेल', bn: 'আটটি খেলাই' },
    free_games:     { en: 'Your games', as: 'আপোনাৰ খেল', hi: 'आपके खेल', bn: 'আপনার খেলা' },
    free_games_sub: { en: 'Included in every plan', as: 'সকলো প্লেনতে আছে', hi: 'हर प्लान में शामिल', bn: 'সব প্ল্যানেই আছে' },
    premium_games:  { en: 'Premium games', as: 'প্ৰিমিয়াম খেল', hi: 'प्रीमियम खेल', bn: 'প্রিমিয়াম খেলা' },
    premium_games_off:{ en: 'Available with SMIVAI Premium', as: 'SMIVAI প্ৰিমিয়ামত পোৱা যায়', hi: 'SMIVAI प्रीमियम में उपलब्ध', bn: 'SMIVAI প্রিমিয়ামে পাওয়া যায়' },
    premium_games_on:{ en: 'Unlocked with your Premium plan', as: 'আপোনাৰ প্ৰিমিয়াম প্লেনে খুলি দিছে', hi: 'आपके प्रीमियम प्लान से खुला है', bn: 'আপনার প্রিমিয়াম প্ল্যানে খোলা' },
    coming_soon:    { en: 'Coming soon', as: 'সোনকালে আহিব', hi: 'जल्द आ रहा है', bn: 'শীঘ্রই আসছে' },
    soon:           { en: 'Coming soon', as: 'সোনকালে', hi: 'जल्द', bn: 'শীঘ্রই' },
    unlock:         { en: 'Unlock with Premium', as: 'প্ৰিমিয়ামেৰে খোলক', hi: 'प्रीमियम से खोलें', bn: 'প্রিমিয়াম দিয়ে খুলুন' },
    best:           { en: 'Best', as: 'সৰ্বোচ্চ', hi: 'सर्वोच्च', bn: 'সর্বোচ্চ' },
    level_short:    { en: 'Level', as: 'স্তৰ', hi: 'स्तर', bn: 'স্তর' },

    /* ---- memories ---- */
    mem_sub:        { en: 'The people, places and moments that matter to you — kept safe, ready to share.', as: 'আপোনাৰ প্ৰিয় মানুহ, ঠাই আৰু মুহূৰ্ত — সুৰক্ষিতভাৱে ৰখা, ভাগ কৰিবলৈ সাজু।', hi: 'आपके प्रिय लोग, जगहें और पल — सुरक्षित रखे, साझा करने को तैयार।', bn: 'আপনার প্রিয় মানুষ, জায়গা আর মুহূর্ত — নিরাপদে রাখা, ভাগ করে নিতে প্রস্তুত।' },
    memory_lane:    { en: 'Play Memory Lane', as: 'সোঁৱৰণৰ খেল খেলক', hi: 'यादों का खेल खेलें', bn: 'স্মৃতির খেলা খেলুন' },
    memory_lane_sub:{ en: 'Gentle questions made from your own memories.', as: 'আপোনাৰ নিজৰ সোঁৱৰণৰ পৰা কৰা সহজ প্ৰশ্ন।', hi: 'आपकी अपनी यादों से बने आसान सवाल।', bn: 'আপনার নিজের স্মৃতি থেকে তৈরি সহজ প্রশ্ন।' },
    mem_privacy:    { en: 'Photos stay on this device. Your caregivers can see the memory titles and stories you share with them.', as: 'ফটোবোৰ এই ডিভাইচতে থাকে। আপোনাৰ যত্ন লোৱাসকলে আপুনি ভাগ কৰা সোঁৱৰণৰ নাম আৰু কাহিনী চাব পাৰে।', hi: 'तस्वीरें इसी डिवाइस पर रहती हैं। आपकी देखभाल करने वाले वही यादें और कहानियाँ देख सकते हैं जो आप साझा करते हैं।', bn: 'ছবি এই ডিভাইসেই থাকে। আপনার পরিচর্যাকারীরা আপনি যে স্মৃতি ও গল্প ভাগ করেন, তা দেখতে পারেন।' },

    /* ---- reminders & progress ---- */
    rem_summary:    { en: '{done} of {total} done today', as: 'আজি {total} টাৰ ভিতৰত {done} টা সম্পূৰ্ণ', hi: 'आज {total} में से {done} पूरे', bn: 'আজ {total}টির মধ্যে {done}টি সম্পন্ন' },
    rc_all:         { en: 'All', as: 'সকলো', hi: 'सभी', bn: 'সব' },
    other_days:     { en: 'On other days', as: 'আন দিনত', hi: 'दूसरे दिनों में', bn: 'অন্য দিনে' },
    this_week:      { en: 'This week', as: 'এই সপ্তাহ', hi: 'इस हफ़्ते', bn: 'এই সপ্তাহে' },
    prog_great:     { en: 'You’re doing great this week!', as: 'এই সপ্তাহত আপুনি বৰ ভাল কৰিছে!', hi: 'इस हफ़्ते आप बहुत अच्छा कर रहे हैं!', bn: 'এই সপ্তাহে আপনি দারুণ করছেন!' },
    prog_sub:       { en: 'Here is how your week went. Every little bit of practice helps.', as: 'আপোনাৰ সপ্তাহটো কেনে গ’ল চাওক। অলপ অলপ অনুশীলনেও সহায় কৰে।', hi: 'देखिए आपका हफ़्ता कैसा रहा। थोड़ा-थोड़ा अभ्यास भी काम आता है।', bn: 'দেখুন আপনার সপ্তাহ কেমন গেল। একটু একটু অনুশীলনও কাজে লাগে।' },
    play_game:      { en: 'Play a game', as: 'এটা খেল খেলক', hi: 'एक खेल खेलें', bn: 'একটি খেলা খেলুন' },
    feelings_week:  { en: 'How you felt', as: 'আপোনাৰ মনৰ ভাব', hi: 'आपका मन कैसा रहा', bn: 'আপনার মন কেমন ছিল' },

    /* ---- care services ---- */
    bd_hero:        { en: 'Talk to a doctor by video from home, visit a clinic, or ask for a home visit.', as: 'ঘৰৰ পৰাই ভিডিঅ’ত ডাক্তৰৰ সৈতে কথা পাতক, ক্লিনিকলৈ যাওক, বা ঘৰলৈ মাতক।', hi: 'घर से वीडियो पर डॉक्टर से बात करें, क्लिनिक जाएँ, या घर बुलाएँ।', bn: 'বাড়ি থেকে ভিডিওতে ডাক্তারের সঙ্গে কথা বলুন, ক্লিনিকে যান, বা বাড়িতে ডাকুন।' },
    choose_doctor:  { en: 'Choose a doctor', as: 'ডাক্তৰ বাছি লওক', hi: 'डॉक्टर चुनें', bn: 'ডাক্তার বেছে নিন' },
    book:           { en: 'Book', as: 'বুক কৰক', hi: 'बुक करें', bn: 'বুক করুন' },
    your_doctor:    { en: 'Your doctor', as: 'আপোনাৰ ডাক্তৰ', hi: 'आपके डॉक्टर', bn: 'আপনার ডাক্তার' },
    past_visits:    { en: 'Past visits', as: 'আগৰ সাক্ষাৎ', hi: 'पिछली मुलाक़ातें', bn: 'আগের সাক্ষাৎ' },
    om_hero:        { en: 'Reorder what you already take, or add anything else you need.', as: 'আপুনি খাই থকা ঔষধ পুনৰ অৰ্ডাৰ কৰক, বা আন যি লাগে যোগ কৰক।', hi: 'जो दवा आप पहले से लेते हैं वह दोबारा मँगाएँ, या और जो चाहिए जोड़ें।', bn: 'যে ওষুধ আপনি খান তা আবার অর্ডার করুন, বা যা দরকার যোগ করুন।' },
    your_medicines: { en: 'Your medicines', as: 'আপোনাৰ ঔষধ', hi: 'आपकी दवाएँ', bn: 'আপনার ওষুধ' },
    your_order:     { en: 'Your order', as: 'আপোনাৰ অৰ্ডাৰ', hi: 'आपका ऑर्डर', bn: 'আপনার অর্ডার' },
    add:            { en: 'Add', as: 'যোগ কৰক', hi: 'जोड़ें', bn: 'যোগ করুন' },
    cg_hero:        { en: 'The people who look after you — and help at home when you need it.', as: 'আপোনাৰ যত্ন লোৱা মানুহবোৰ — আৰু প্ৰয়োজনত ঘৰত সহায়।', hi: 'आपकी देखभाल करने वाले लोग — और ज़रूरत पर घर पर मदद।', bn: 'যাঁরা আপনার যত্ন নেন — আর দরকারে বাড়িতে সাহায্য।' },
    care_team:      { en: 'Your care team', as: 'আপোনাৰ যত্নৰ দল', hi: 'आपकी देखभाल टीम', bn: 'আপনার যত্ন দল' },
    invite:         { en: 'Invite someone to help', as: 'সহায়ৰ বাবে কাৰোবাক মাতক', hi: 'मदद के लिए किसी को बुलाएँ', bn: 'সাহায্যের জন্য কাউকে ডাকুন' },
    share_hint:     { en: 'Read this out to your caregiver or doctor. They type it into SMIVAI to join your care team.', as: 'এইটো আপোনাৰ যত্ন লওঁতা বা ডাক্তৰক পঢ়ি শুনাওক। তেওঁলোকে SMIVAI ত লিখি আপোনাৰ দলত যোগ দিব।', hi: 'यह अपने देखभाल करने वाले या डॉक्टर को पढ़कर बताएँ। वे इसे SMIVAI में डालकर आपकी टीम में जुड़ेंगे।', bn: 'এটি আপনার পরিচর্যাকারী বা ডাক্তারকে পড়ে শোনান। তাঁরা SMIVAI-তে লিখে আপনার দলে যোগ দেবেন।' },
    request_help:   { en: 'Request help at home', as: 'ঘৰত সহায় বিচাৰক', hi: 'घर पर मदद माँगें', bn: 'বাড়িতে সাহায্য চান' },
    send_message:   { en: 'Message', as: 'বাৰ্তা', hi: 'संदेश', bn: 'বার্তা' },
    hr_hero:        { en: 'Your own readings and papers, in one place. Your doctor can see these too.', as: 'আপোনাৰ নিজৰ জোখ-মাপ আৰু কাগজ, এক ঠাইতে। আপোনাৰ ডাক্তৰেও চাব পাৰে।', hi: 'आपकी अपनी रीडिंग और काग़ज़, एक जगह। आपके डॉक्टर भी देख सकते हैं।', bn: 'আপনার নিজের রিডিং আর কাগজ, এক জায়গায়। আপনার ডাক্তারও দেখতে পারেন।' },
    add_reading:    { en: 'Add a reading', as: 'এটা জোখ যোগ কৰক', hi: 'एक रीडिंग जोड़ें', bn: 'একটি রিডিং যোগ করুন' },
    latest_readings:{ en: 'Latest readings', as: 'শেহতীয়া জোখ', hi: 'ताज़ा रीडिंग', bn: 'সাম্প্রতিক রিডিং' },
    documents:      { en: 'Reports & papers', as: 'ৰিপৰ্ট আৰু কাগজ', hi: 'रिपोर्ट और काग़ज़', bn: 'রিপোর্ট ও কাগজ' },
    print_summary:  { en: 'Print summary', as: 'সাৰাংশ প্ৰিন্ট কৰক', hi: 'सारांश प्रिंट करें', bn: 'সারসংক্ষেপ প্রিন্ট করুন' },

    /* ---- fact & skill ---- */
    another_fact:   { en: 'Another fact', as: 'আৰু এটা কথা', hi: 'एक और बात', bn: 'আরও একটি কথা' },
    talk_about:     { en: 'Talk about it', as: 'ইয়াৰ বিষয়ে কথা পাতক', hi: 'इस बारे में बात करें', bn: 'এ নিয়ে কথা বলুন' },
    step_of:        { en: 'Step {a} of {b}', as: '{b} টাৰ ভিতৰত {a} নং পদক্ষেপ', hi: '{b} में से {a} क़दम', bn: '{b}টির মধ্যে {a} নম্বর ধাপ' },
    next:           { en: 'Next', as: 'পিছৰটো', hi: 'आगे', bn: 'পরেরটি' },
    i_did_it:       { en: 'I did it!', as: 'মই কৰিলোঁ!', hi: 'मैंने कर लिया!', bn: 'আমি করেছি!' },
    more_skills:    { en: 'More skills to try', as: 'চেষ্টা কৰিবলগীয়া আৰু কিছু', hi: 'आज़माने के लिए और भी', bn: 'চেষ্টা করার মতো আরও' },

    /* ---- misc chrome ---- */
    not_found:      { en: 'We could not find that page', as: 'সেই পৃষ্ঠাটো পোৱা নগ’ল', hi: 'वह पन्ना नहीं मिला', bn: 'সেই পাতাটি পাওয়া গেল না' },
    go_home:        { en: 'Go home', as: 'ঘৰলৈ যাওক', hi: 'घर जाएँ', bn: 'হোমে যান' },
    no_results:     { en: 'Nothing found. Try another word.', as: 'একো পোৱা নগ’ল। আন এটা শব্দ চেষ্টা কৰক।', hi: 'कुछ नहीं मिला। कोई और शब्द आज़माएँ।', bn: 'কিছু পাওয়া গেল না। অন্য শব্দ চেষ্টা করুন।' }
  };
  Object.keys(STRINGS_V4).forEach(function (k) { STRINGS[k] = STRINGS_V4[k]; });

  /* ---- home: the lines the dashboard signs off with ---- */
  var STRINGS_V5 = {
    hero_quote:  { en: 'You are stronger than you think.', as: 'আপুনি ভবাতকৈ অধিক শক্তিশালী।', hi: 'आप जितना सोचते हैं उससे ज़्यादा मज़बूत हैं।', bn: 'আপনি যা ভাবেন তার চেয়ে শক্তিশালী।' },
    home_quote:  { en: 'A healthier, happier you — always.', as: 'এটা সুস্থ, সুখী আপুনি — সদায়।', hi: 'एक स्वस्थ, ख़ुशहाल आप — हमेशा।', bn: 'একজন সুস্থ, খুশি আপনি — সবসময়।' },
    better_days: { en: 'Better Days Together', as: 'একেলগে ভাল দিন', hi: 'साथ में बेहतर दिन', bn: 'একসাথে ভালো দিন' },
    your_health: { en: 'Your health. Our priority.', as: 'আপোনাৰ স্বাস্থ্য। আমাৰ অগ্ৰাধিকাৰ।', hi: 'आपका स्वास्थ्य। हमारी प्राथमिकता।', bn: 'আপনার স্বাস্থ্য। আমাদের অগ্রাধিকার।' },

    /* ---- welcome picture card ---- */
    wl_chip_hi:   { en: 'Hello! I’m HUN', as: 'নমস্কাৰ! মই HUN', hi: 'नमस्ते! मैं HUN हूँ', bn: 'নমস্কার! আমি HUN' },
    wl_chip_help: { en: 'How can I help?', as: 'কি সহায় কৰিব পাৰোঁ?', hi: 'मैं कैसे मदद करूँ?', bn: 'কীভাবে সাহায্য করব?' },
    wl_cap_title: { en: 'Care that feels human.', as: 'মানৱীয় অনুভৱৰ যত্ন।', hi: 'देखभाल, जो इंसानी लगे।', bn: 'যত্ন, যা মানবিক মনে হয়।' },
    wl_cap_sub:   { en: 'Warm, simple, and built around everyday life.', as: 'উষ্ম, সৰল আৰু দৈনন্দিন জীৱনৰ বাবে সজা।', hi: 'गर्मजोशी भरा, सरल और रोज़मर्रा की ज़िंदगी के लिए बना।', bn: 'উষ্ণ, সরল এবং প্রতিদিনের জীবনের জন্য তৈরি।' }
  };
  /* ---- results screen: what the adaptive engine decided, and why ---- */
  var STRINGS_V7 = {
    adapt_up:     { en: 'You got {right} of {total} right — next time will be a little harder: {level}.',
                    hi: 'आपने {total} में से {right} सही किए — अगली बार थोड़ा कठिन होगा: {level}।',
                    as: '{total}টাৰ ভিতৰত {right}টা শুদ্ধ হ’ল — পিছৰবাৰ অলপ কঠিন হ’ব: {level}।',
                    bn: '{total}টির মধ্যে {right}টি ঠিক হয়েছে — পরের বার একটু কঠিন হবে: {level}।' },
    adapt_down:   { en: 'You got {right} of {total} right — next time will be a little easier: {level}.',
                    hi: 'आपने {total} में से {right} सही किए — अगली बार थोड़ा आसान होगा: {level}।',
                    as: '{total}টাৰ ভিতৰত {right}টা শুদ্ধ হ’ল — পিছৰবাৰ অলপ সহজ হ’ব: {level}।',
                    bn: '{total}টির মধ্যে {right}টি ঠিক হয়েছে — পরের বার একটু সহজ হবে: {level}।' },
    adapt_same:   { en: 'You got {right} of {total} right — {level} suits you, so it stays the same.',
                    hi: 'आपने {total} में से {right} सही किए — {level} आपके लिए ठीक है, इसलिए यही रहेगा।',
                    as: '{total}টাৰ ভিতৰত {right}টা শুদ্ধ হ’ল — {level} আপোনাৰ বাবে ঠিক, সেয়েহে একেই থাকিব।',
                    bn: '{total}টির মধ্যে {right}টি ঠিক হয়েছে — {level} আপনার জন্য ঠিক, তাই একই থাকবে।' },
    adapt_top:    { en: 'You got {right} of {total} right — you are already on the hardest level.',
                    hi: 'आपने {total} में से {right} सही किए — आप पहले से सबसे कठिन स्तर पर हैं।',
                    as: '{total}টাৰ ভিতৰত {right}টা শুদ্ধ হ’ল — আপুনি ইতিমধ্যে আটাইতকৈ কঠিন স্তৰত আছে।',
                    bn: '{total}টির মধ্যে {right}টি ঠিক হয়েছে — আপনি ইতিমধ্যেই সবচেয়ে কঠিন স্তরে আছেন।' },
    adapt_bottom: { en: 'You got {right} of {total} right — it stays at the gentlest level.',
                    hi: 'आपने {total} में से {right} सही किए — यह सबसे आसान स्तर पर ही रहेगा।',
                    as: '{total}টাৰ ভিতৰত {right}টা শুদ্ধ হ’ল — ই আটাইতকৈ সহজ স্তৰতে থাকিব।',
                    bn: '{total}টির মধ্যে {right}টি ঠিক হয়েছে — এটি সবচেয়ে সহজ স্তরেই থাকবে।' }
  };
  Object.keys(STRINGS_V7).forEach(function (k) { STRINGS[k] = STRINGS_V7[k]; });

  /* ---- memory card menu ---- */
  var STRINGS_V8 = {
    open_memory: { en: 'Open this memory', hi: 'यह याद खोलें', as: 'এই সোঁৱৰণটো খোলক', bn: 'এই স্মৃতিটি খুলুন' },
    mem_more:    { en: 'More for {title}', hi: '{title} के लिए और विकल्प', as: '{title}ৰ বাবে আৰু বিকল্প', bn: '{title}-এর জন্য আরও বিকল্প' }
  };
  Object.keys(STRINGS_V8).forEach(function (k) { STRINGS[k] = STRINGS_V8[k]; });

  /* ---- after a game: play again, and the level that just opened ---- */
  var STRINGS_V9 = {
    unlocked_new: { en: 'New level opened: {level}', hi: 'नया स्तर खुला: {level}', as: 'নতুন স্তৰ খুলিল: {level}', bn: 'নতুন স্তর খুলল: {level}' },
    play_level:   { en: 'Play {level}', hi: '{level} खेलें', as: '{level} খেলক', bn: '{level} খেলুন' },
    play_same:    { en: 'Play {level} again', hi: '{level} फिर से खेलें', as: '{level} আকৌ খেলক', bn: '{level} আবার খেলুন' },
    try_same:     { en: 'Try {level} again', hi: '{level} फिर से आज़माएँ', as: '{level} আকৌ চেষ্টা কৰক', bn: '{level} আবার চেষ্টা করুন' },
    locked_hint:  { en: 'Do well at {level} to open this', hi: 'यह खोलने के लिए {level} अच्छा खेलें', as: 'এইটো খুলিবলৈ {level}ত ভাল কৰক', bn: 'এটি খুলতে {level}-এ ভালো করুন' }
  };
  Object.keys(STRINGS_V9).forEach(function (k) { STRINGS[k] = STRINGS_V9[k]; });

  /* ---- role chooser ---- */
  var STRINGS_V6 = {
    wl_who2:            { en: 'Who are you using SMIVAI as?', as: 'আপুনি SMIVAI কোন হিচাপে ব্যৱহাৰ কৰিছে?', hi: 'आप SMIVAI किस रूप में इस्तेमाल कर रहे हैं?', bn: 'আপনি SMIVAI কোন হিসেবে ব্যবহার করছেন?' },
    wl_who_sub:         { en: 'Different roles, a common purpose — a happier, healthier tomorrow.', as: 'বেলেগ বেলেগ ভূমিকা, একেটাই লক্ষ্য — এটা সুখী, সুস্থ কাইলৈ।', hi: 'अलग-अलग भूमिकाएँ, एक ही मक़सद — एक ख़ुशहाल, स्वस्थ कल।', bn: 'ভিন্ন ভূমিকা, একই উদ্দেশ্য — একটি সুখী, সুস্থ আগামী।' },
    role_patient_sub2:  { en: 'Learn, play, keep memories alive, set reminders and have a friendly voice by your side.', as: 'শিকক, খেলক, সোঁৱৰণ জীয়াই ৰাখক, সোঁৱৰণী দিয়ক আৰু কাষত এটা বন্ধুত্বপূৰ্ণ মাত পাওক।', hi: 'सीखें, खेलें, यादें ज़िंदा रखें, याद दिलाने सेट करें और साथ में एक दोस्ताना आवाज़ पाएँ।', bn: 'শিখুন, খেলুন, স্মৃতি বাঁচিয়ে রাখুন, রিমাইন্ডার দিন এবং পাশে একটি বন্ধুত্বপূর্ণ কণ্ঠ পান।' },
    role_caregiver_sub2:{ en: 'Support your loved one, from near or far.', as: 'ওচৰৰ পৰা হওক বা দূৰৰ পৰা, আপোনাৰ প্ৰিয়জনক সহায় কৰক।', hi: 'पास हों या दूर, अपने अपनों का ख़्याल रखें।', bn: 'কাছে থাকুন বা দূরে, আপনার প্রিয়জনের পাশে থাকুন।' },
    role_doctor_sub2:   { en: 'See your patients’ activity, progress and well-being.', as: 'আপোনাৰ ৰোগীৰ কাম, উন্নতি আৰু সুস্থতা চাওক।', hi: 'अपने मरीज़ों की गतिविधि, प्रगति और सेहत देखें।', bn: 'আপনার রোগীদের কাজ, উন্নতি ও সুস্থতা দেখুন।' }
  };
  Object.keys(STRINGS_V6).forEach(function (k) { STRINGS[k] = STRINGS_V6[k]; });

  Object.keys(STRINGS_V5).forEach(function (k) { STRINGS[k] = STRINGS_V5[k]; });



  /* ------------------------------------------------------------
     Runtime machine-translation cache
     ------------------------------------------------------------ */
  function cacheKey(lang, key) { return lang + '::' + key; }

  var pendingFetch = {};

  var I18N = {
    languages: LANGUAGES,
    strings: STRINGS,
    BUNDLED_PROVENANCE: BUNDLED_PROVENANCE,

    /** Languages grouped for the picker. */
    forPicker: function () {
      return {
        ner: LANGUAGES.filter(function (l) { return l.region === 'ner'; }),
        other: LANGUAGES.filter(function (l) { return l.region !== 'ner'; })
      };
    },

    lang: function (code) {
      for (var i = 0; i < LANGUAGES.length; i++) if (LANGUAGES[i].code === code) return LANGUAGES[i];
      return LANGUAGES[0];
    },

    isSupportedByBhashini: function (code) { return !!this.lang(code).bhashini; },
    isCommunityLanguage: function (code) { return !!this.lang(code).community; },

    /** The language currently in use (patient's preference, else English). */
    current: function () {
      var p = S.State && S.State.patient && S.State.patient();
      if (S.State && S.State.role === 'patient' && p) return p.language || 'en';
      if (S.State && S.State.previewLanguage) return S.State.previewLanguage;
      /* nobody signed in: the language chosen on the welcome screen */
      if (!(S.Auth && S.Auth.session && S.Auth.session())) return (S.Prefs && S.Prefs.get('ui_lang')) || 'en';
      return 'en';
    },

    /* ---------- cached machine translations ---------- */
    cached: function (lang, key) {
      var rows = S.DB.where('translations', function (r) {
        return r.lang === lang && r.key === key;
      });
      return rows.length ? rows[0] : null;
    },

    putCached: function (lang, key, text, provenance) {
      var existing = this.cached(lang, key);
      if (existing) {
        return S.DB.update('translations', existing.translation_id, {
          text: text, provenance: provenance || 'machine'
        }, { silent: true });
      }
      return S.DB.insert('translations', {
        translation_id: S.uid('tr'),
        lang: lang, key: key,
        source_text: (STRINGS[key] || {}).en || key,
        text: text,
        provenance: provenance || 'machine',
        created_at: S.stamp()
      }, { silent: true });
    },

    /**
     * Resolve a key.
     * @returns {{text, lang, fallback, provenance}}
     */
    resolve: function (key, code) {
      code = code || this.current();
      var row = STRINGS[key];
      if (!row) return { text: key, lang: 'en', fallback: false, provenance: 'missing' };
      if (!code || code === 'en') return { text: row.en, lang: 'en', fallback: false, provenance: 'source' };

      if (row[code]) return { text: row[code], lang: code, fallback: false, provenance: BUNDLED_PROVENANCE };

      var hit = this.cached(code, key);
      if (hit) return { text: hit.text, lang: code, fallback: false, provenance: hit.provenance };

      // Nothing bundled and nothing cached — fetch in the background if a
      // machine pipeline exists for this language, and show English now.
      this.requestTranslation(key, code);
      return { text: row.en, lang: 'en', fallback: true, provenance: 'english-fallback' };
    },

    /** Backwards-compatible signature used by voice.js and gameshell.js. */
    t: function (key, code) { return this.resolve(key, code); },

    /** The convenient form: returns a plain, interpolated string. */
    text: function (key, params, code) {
      var r = this.resolve(key, code);
      return interpolate(r.text, params);
    },

    /** Fire-and-forget machine translation for a missing string. */
    requestTranslation: function (key, code) {
      if (!S.LangService || !STRINGS[key]) return;
      if (!this.lang(code).bhashini) return;              // no pipeline exists
      var ck = cacheKey(code, key);
      if (pendingFetch[ck]) return;
      pendingFetch[ck] = true;
      var self = this;
      S.LangService.translate(STRINGS[key].en, 'en', code).then(function (res) {
        delete pendingFetch[ck];
        if (res && res.ok && res.text) {
          self.putCached(code, key, res.text, 'machine:' + res.provider);
          S.bus.emit('i18n:updated', { key: key, lang: code });
        }
      }).catch(function () { delete pendingFetch[ck]; });
    },

    /** Warm the cache for a whole language — used by the caregiver panel. */
    pretranslate: function (code, onProgress) {
      var self = this;
      var keys = Object.keys(STRINGS).filter(function (k) {
        return !STRINGS[k][code] && !self.cached(code, k);
      });
      if (!keys.length || !this.lang(code).bhashini) {
        return Promise.resolve({ translated: 0, total: 0, skipped: !this.lang(code).bhashini });
      }
      var done = 0;
      return keys.reduce(function (chain, key) {
        return chain.then(function () {
          return S.LangService.translate(STRINGS[key].en, 'en', code).then(function (res) {
            if (res && res.ok && res.text) {
              self.putCached(code, key, res.text, 'machine:' + res.provider);
              done++;
            }
            if (onProgress) onProgress(done, keys.length);
          });
        });
      }, Promise.resolve()).then(function () {
        S.bus.emit('i18n:updated', { lang: code });
        return { translated: done, total: keys.length };
      });
    },

    /* ---------- coverage reporting ---------- */
    coverage: function (code) {
      if (code === 'en') return { bundled: 1, machine: 0, missing: 0, total: this.keyCount(), percent: 100 };
      var keys = Object.keys(STRINGS);
      var bundled = 0, machine = 0;
      var self = this;
      keys.forEach(function (k) {
        if (STRINGS[k][code]) bundled++;
        else if (self.cached(code, k)) machine++;
      });
      return {
        bundled: bundled,
        machine: machine,
        missing: keys.length - bundled - machine,
        total: keys.length,
        percent: Math.round(((bundled + machine) / keys.length) * 100),
        bundledPercent: Math.round((bundled / keys.length) * 100)
      };
    },

    keyCount: function () { return Object.keys(STRINGS).length; },

    /** Everything a reviewer needs, as reviewable rows. */
    exportForReview: function (code) {
      var self = this;
      return Object.keys(STRINGS).map(function (key) {
        var bundled = STRINGS[key][code];
        var cachedRow = self.cached(code, key);
        return {
          key: key,
          english: STRINGS[key].en,
          translation: bundled || (cachedRow ? cachedRow.text : ''),
          provenance: bundled ? BUNDLED_PROVENANCE : (cachedRow ? cachedRow.provenance : 'missing'),
          needs_review: true
        };
      });
    },

    has: function (key, code) { return !!(STRINGS[key] && STRINGS[key][code]); }
  };

  function interpolate(text, params) {
    if (!params) return text;
    return String(text).replace(/\{(\w+)\}/g, function (m, k) {
      return params[k] !== undefined ? params[k] : m;
    });
  }
  I18N.interpolate = interpolate;

  /* Global shorthand used throughout the UI. */
  S.t = function (key, params, code) { return I18N.text(key, params, code); };
  S.I18N = I18N;
})(window);
