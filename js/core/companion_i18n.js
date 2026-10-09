/* ============================================================
   SMIVAI — companion_i18n.js
   What the companion says, in the language the person spoke.

   Five reply styles, chosen per message by S.LangDetect:
     en        English
     hi        Hindi, Devanagari
     hi-Latn   Hindi in English letters, the way people type it
     as        Assamese
     bn        Bengali

   Replies are templates filled with the patient's own data — the same
   facts in every language. A value may be a function of the style, so a
   reminder time comes out as "8:00 PM", "रात 8 बजे", "raat 8 baje" or
   "ৰাতি ৮ বজাত" from one record. Assamese and Bengali numbers are
   written in their own digits.

   These lines are drafted, like the rest of SMIVAI's non-English text,
   and are waiting for a native speaker's review. Titles the family typed
   ("Evening medicine") stay as they were written.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var NATIVE_DIGITS = { as: '০১২৩৪৫৬৭৮৯', bn: '০১২৩৪৫৬৭৮৯' };
  function digits(str, v) {
    var d = NATIVE_DIGITS[v];
    return d ? String(str).replace(/[0-9]/g, function (c) { return d.charAt(+c); }) : String(str);
  }

  var PARTS = {
    hi: { morning: 'सुबह', afternoon: 'दोपहर', evening: 'शाम', night: 'रात' },
    'hi-Latn': { morning: 'subah', afternoon: 'dopahar', evening: 'shaam', night: 'raat' },
    as: { morning: 'ৰাতিপুৱা', afternoon: 'দুপৰীয়া', evening: 'সন্ধিয়া', night: 'ৰাতি' },
    bn: { morning: 'সকাল', afternoon: 'দুপুর', evening: 'সন্ধ্যা', night: 'রাত' }
  };
  function partOf(h) { return h < 4 ? 'night' : h < 12 ? 'morning' : h < 16 ? 'afternoon' : h < 20 ? 'evening' : 'night'; }
  function split(hhmm) { var p = String(hhmm || '00:00').split(':'); return { h: +p[0] || 0, m: +p[1] || 0 }; }
  function num12(t) { return (t.h % 12 || 12) + (t.m ? ':' + (t.m < 10 ? '0' : '') + t.m : ''); }

  /** "at 8 PM" — for reminders and appointments. */
  function clockAt(hhmm, v) {
    var t = split(hhmm), part = partOf(t.h);
    if (v === 'hi') return PARTS.hi[part] + ' ' + num12(t) + ' बजे';
    if (v === 'hi-Latn') return PARTS['hi-Latn'][part] + ' ' + num12(t) + ' baje';
    if (v === 'as') return PARTS.as[part] + ' ' + digits(num12(t), v) + ' বজাত';
    if (v === 'bn') return PARTS.bn[part] + ' ' + digits(num12(t), v) + (t.m ? '-এ' : 'টায়');
    return S.prettyTime(hhmm);
  }
  /** "it is 8 PM" — for telling the time. */
  function clockIs(hhmm, v) {
    var t = split(hhmm), part = partOf(t.h);
    if (v === 'hi') return PARTS.hi[part] + ' के ' + num12(t) + ' बजे';
    if (v === 'hi-Latn') return PARTS['hi-Latn'][part] + ' ke ' + num12(t) + ' baje';
    if (v === 'as') return PARTS.as[part] + ' ' + digits(num12(t), v) + ' বাজিছে';
    if (v === 'bn') return PARTS.bn[part] + ' ' + digits(num12(t), v) + 'টা বাজে';
    return S.prettyTime(hhmm);
  }

  var WEEKDAYS = {
    hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
    'hi-Latn': ['Ravivaar', 'Somvaar', 'Mangalvaar', 'Budhvaar', 'Guruvaar', 'Shukravaar', 'Shanivaar'],
    as: ['দেওবাৰ', 'সোমবাৰ', 'মঙলবাৰ', 'বুধবাৰ', 'বৃহস্পতিবাৰ', 'শুকুৰবাৰ', 'শনিবাৰ'],
    bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']
  };
  var MONTHS = {
    hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
    'hi-Latn': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    as: ['জানুৱাৰী', 'ফেব্ৰুৱাৰী', 'মাৰ্চ', 'এপ্ৰিল', 'মে’', 'জুন', 'জুলাই', 'আগষ্ট', 'ছেপ্টেম্বৰ', 'অক্টোবৰ', 'নৱেম্বৰ', 'ডিচেম্বৰ'],
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
  };
  function dateOf(iso, v) {
    if (!MONTHS[v]) return S.prettyDate(iso);
    var d = S.fromISO(iso);
    return digits(d.getDate(), v) + ' ' + MONTHS[v][d.getMonth()];
  }
  function weekdayOf(iso, v) {
    return WEEKDAYS[v] ? WEEKDAYS[v][S.fromISO(iso).getDay()] : S.weekdayName(iso);
  }

  /* "today" / "tomorrow" */
  var DAY = {
    en: ['today', 'tomorrow'], hi: ['आज', 'कल'], 'hi-Latn': ['aaj', 'kal'], as: ['আজি', 'কাইলৈ'], bn: ['আজ', 'কাল']
  };

  /* What a reminder asks the person to do, by category. */
  var DOING = {
    medicine:    { hi: 'दवाई लेनी है', 'hi-Latn': 'dawai leni hai', as: 'ঔষধ খাব লাগিব', bn: 'ওষুধ খেতে হবে' },
    meal:        { hi: 'खाना खाना है', 'hi-Latn': 'khana khana hai', as: 'আহাৰ খাব লাগিব', bn: 'খাবার খেতে হবে' },
    hydration:   { hi: 'पानी पीना है', 'hi-Latn': 'paani peena hai', as: 'পানী খাব লাগিব', bn: 'জল খেতে হবে' },
    exercise:    { hi: 'थोड़ा व्यायाम करना है', 'hi-Latn': 'thoda exercise karna hai', as: 'অলপ ব্যায়াম কৰিব লাগিব', bn: 'একটু ব্যায়াম করতে হবে' },
    appointment: { hi: 'डॉक्टर से मिलना है', 'hi-Latn': 'doctor se milna hai', as: 'ডাক্তৰৰ ওচৰলৈ যাব লাগিব', bn: 'ডাক্তারের কাছে যেতে হবে' },
    cognitive:   { hi: 'दिमाग़ का खेल खेलना है', 'hi-Latn': 'brain game khelna hai', as: 'মগজুৰ খেল খেলিব লাগিব', bn: 'মস্তিষ্কের খেলা খেলতে হবে' },
    rest:        { hi: 'आराम करना है', 'hi-Latn': 'aaram karna hai', as: 'জিৰণি ল’ব লাগিব', bn: 'বিশ্রাম নিতে হবে' },
    custom:      { hi: 'यह करना है', 'hi-Latn': 'yeh karna hai', as: 'এইটো কৰিব লাগিব', bn: 'এটা করতে হবে' }
  };

  var MED_STATUS = {
    taken:   { en: 'already taken', hi: 'ले ली गई', 'hi-Latn': 'le li gayi', as: 'খোৱা হৈছে', bn: 'খাওয়া হয়ে গেছে' },
    missed:  { en: 'not marked yet', hi: 'अभी दर्ज नहीं हुई', 'hi-Latn': 'abhi darj nahi hui', as: 'এতিয়াও চিহ্ন দিয়া নাই', bn: 'এখনও চিহ্নিত হয়নি' },
    upcoming:{ en: 'coming up', hi: 'अभी बाकी है', 'hi-Latn': 'abhi baaki hai', as: 'এতিয়াও বাকী আছে', bn: 'এখনও বাকি আছে' }
  };
  var LIST_SEP = { en: ', or ', hi: ' या ', 'hi-Latn': ' ya ', as: ' বা ', bn: ' বা ' };

  var JOKES = {
    en: ['Why did the tea go to school? To become a little bitter at mathematics!',
         'My neighbour says I never listen to him. Or something like that.',
         'I asked the calendar for a day off. It said it was already booked.'],
    hi: ['डॉक्टर ने कहा रोज़ सैर कीजिए। अब मैं रोज़ फ़्रिज तक सैर करता हूँ!',
         'मैंने कैलेंडर से एक दिन की छुट्टी माँगी। उसने कहा — सारे दिन पहले से बुक हैं!',
         'चश्मा ढूँढते-ढूँढते आधा घंटा बीत गया — और वो मेरी नाक पर ही था!'],
    'hi-Latn': ['Doctor ne kaha roz sair kijiye. Ab main roz fridge tak sair karta hoon!',
         'Maine calendar se ek din ki chhutti maangi. Usne kaha — saare din pehle se book hain!',
         'Chashma dhoondhte-dhoondhte aadha ghanta beet gaya — aur woh meri naak par hi tha!'],
    as: ['ডাক্তৰে ক’লে সদায় খোজ কাঢ়িব। এতিয়া মই সদায় ফ্ৰিজলৈকে খোজ কাঢ়োঁ!',
         'কেলেণ্ডাৰক এদিনৰ ছুটী বিচাৰিলোঁ। সি ক’লে — সকলো দিন আগতেই বুক হৈ আছে!',
         'চছমাযোৰ বিচাৰি বিচাৰি আধা ঘণ্টা গ’ল — পিছত দেখোঁ নাকতে আছে!'],
    bn: ['ডাক্তার বললেন রোজ হাঁটবেন। এখন আমি রোজ ফ্রিজ পর্যন্ত হাঁটি!',
         'ক্যালেন্ডারের কাছে একদিনের ছুটি চাইলাম। সে বলল — সব দিন আগেই বুক করা!',
         'চশমা খুঁজতে খুঁজতে আধঘণ্টা গেল — পরে দেখি নাকের ওপরেই আছে!']
  };

  /* ------------------------------------------------------------------ */
  var R = {
    emergency: {
      en: 'That sounds serious. Please press the red SOS button now — I will alert your caregivers straight away — or dial 112 from your phone. I am not able to call for you myself.',
      hi: 'यह गंभीर लग रहा है। कृपया अभी लाल SOS बटन दबाइए — मैं तुरंत आपके परिवार और देखभाल करने वालों को बताऊँगा — या अपने फ़ोन से 112 पर कॉल कीजिए। मैं खुद कॉल नहीं कर सकता।',
      'hi-Latn': 'Yeh gambhir lag raha hai. Kripya abhi laal SOS button dabaiye — main turant aapke parivaar aur caregivers ko bataunga — ya apne phone se 112 par call kijiye. Main khud call nahi kar sakta.',
      as: 'এইটো গুৰুতৰ যেন লাগিছে। অনুগ্ৰহ কৰি এতিয়াই ৰঙা SOS বুটামটো টিপক — মই লগে লগে আপোনাৰ পৰিয়াল আৰু পৰিচাৰকসকলক জনাম — নাইবা আপোনাৰ ফোনৰ পৰা 112 লৈ ফোন কৰক। মই নিজে ফোন কৰিব নোৱাৰোঁ।',
      bn: 'এটা গুরুতর মনে হচ্ছে। দয়া করে এখনই লাল SOS বোতামটি টিপুন — আমি সঙ্গে সঙ্গে আপনার পরিবার ও দেখাশোনাকারীদের জানাব — অথবা আপনার ফোন থেকে 112-এ কল করুন। আমি নিজে কল করতে পারি না।'
    },
    medical_advice: {
      en: 'I am not able to give medical advice — that is for your doctor. Would you like me to help you book a doctor?',
      hi: 'मैं दवा या इलाज के बारे में सलाह नहीं दे सकता — यह आपके डॉक्टर का काम है। क्या मैं डॉक्टर से मिलने का समय लेने में आपकी मदद करूँ?',
      'hi-Latn': 'Main dawa ya ilaaj ke baare mein salah nahi de sakta — yeh aapke doctor ka kaam hai. Kya main doctor se milne ka samay lene mein aapki madad karun?',
      as: 'মই চিকিৎসাৰ পৰামৰ্শ দিব নোৱাৰোঁ — সেয়া আপোনাৰ ডাক্তৰৰ কাম। ডাক্তৰৰ সৈতে দেখা কৰাৰ সময় ল’বলৈ মই সহায় কৰিম নেকি?',
      bn: 'আমি চিকিৎসার পরামর্শ দিতে পারি না — সেটা আপনার ডাক্তারের কাজ। ডাক্তারের সঙ্গে দেখা করার সময় নিতে আমি কি সাহায্য করব?'
    },
    medical_advice_apt: {
      en: 'I am not able to give medical advice — that is for your doctor. You are seeing {doctor} on {date}. Would you like me to open your appointment?',
      hi: 'मैं दवा या इलाज के बारे में सलाह नहीं दे सकता — यह आपके डॉक्टर का काम है। आप {date} को {doctor} से मिल रहे हैं। क्या मैं आपकी अपॉइंटमेंट खोलूँ?',
      'hi-Latn': 'Main dawa ya ilaaj ke baare mein salah nahi de sakta — yeh aapke doctor ka kaam hai. Aap {date} ko {doctor} se mil rahe hain. Kya main aapki appointment kholun?',
      as: 'মই চিকিৎসাৰ পৰামৰ্শ দিব নোৱাৰোঁ — সেয়া আপোনাৰ ডাক্তৰৰ কাম। আপুনি {date} তাৰিখে {doctor}ৰ সৈতে দেখা কৰিব। মই আপোনাৰ এপইণ্টমেণ্টটো খুলিম নেকি?',
      bn: 'আমি চিকিৎসার পরামর্শ দিতে পারি না — সেটা আপনার ডাক্তারের কাজ। আপনি {date} তারিখে {doctor}-এর সঙ্গে দেখা করবেন। আমি কি আপনার অ্যাপয়েন্টমেন্টটি খুলব?'
    },
    greeting_plan: {
      en: 'Hello {name} Ji. It is good to hear from you. Would you like to talk, or shall we do today’s activity together?',
      hi: 'नमस्ते {name} जी। आपसे बात करके अच्छा लगा। क्या आप बातें करना चाहेंगे, या हम साथ में आज की गतिविधि करें?',
      'hi-Latn': 'Namaste {name} Ji. Aapse baat karke accha laga. Kya aap baatein karna chahenge, ya hum saath mein aaj ki activity karein?',
      as: 'নমস্কাৰ {name} জী। আপোনাৰ মাত শুনি ভাল লাগিল। আপুনি কথা পাতিব বিচাৰে নে, নে আমি একেলগে আজিৰ কামটো কৰোঁ?',
      bn: 'নমস্কার {name} জি। আপনার সঙ্গে কথা বলে ভালো লাগল। আপনি কি গল্প করতে চান, নাকি আমরা একসঙ্গে আজকের কাজটি করি?'
    },
    greeting_done: {
      en: 'Hello {name} Ji. It is good to hear from you. How are you feeling today?',
      hi: 'नमस्ते {name} जी। आपसे बात करके अच्छा लगा। आज आप कैसा महसूस कर रहे हैं?',
      'hi-Latn': 'Namaste {name} Ji. Aapse baat karke accha laga. Aaj aap kaisa mehsoos kar rahe hain?',
      as: 'নমস্কাৰ {name} জী। আপোনাৰ মাত শুনি ভাল লাগিল। আজি আপুনি কেনে অনুভৱ কৰিছে?',
      bn: 'নমস্কার {name} জি। আপনার সঙ্গে কথা বলে ভালো লাগল। আজ আপনি কেমন বোধ করছেন?'
    },
    how_are_you: {
      en: 'I am well, thank you for asking. I am always here to listen. How has your day been?',
      hi: 'मैं ठीक हूँ, पूछने के लिए धन्यवाद। मैं हमेशा आपकी बात सुनने के लिए यहाँ हूँ। आपका दिन कैसा रहा?',
      'hi-Latn': 'Main theek hoon, poochhne ke liye dhanyavaad. Main hamesha aapki baat sunne ke liye yahan hoon. Aapka din kaisa raha?',
      as: 'মই ভালে আছোঁ, সোধাৰ বাবে ধন্যবাদ। মই সদায় আপোনাৰ কথা শুনিবলৈ আছোঁ। আপোনাৰ দিনটো কেনে গ’ল?',
      bn: 'আমি ভালো আছি, জিজ্ঞেস করার জন্য ধন্যবাদ। আমি সবসময় আপনার কথা শোনার জন্য আছি। আপনার দিনটা কেমন কাটল?'
    },
    low_mood: {
      en: 'I am sorry you are feeling that way, and thank you for telling me. Feelings like this pass more easily when they are shared.',
      hi: 'मुझे दुख है कि आप ऐसा महसूस कर रहे हैं, और मुझे बताने के लिए धन्यवाद। ऐसी भावनाएँ बाँटने से हल्की हो जाती हैं।',
      'hi-Latn': 'Mujhe dukh hai ki aap aisa mehsoos kar rahe hain, aur mujhe batane ke liye dhanyavaad. Aisi bhaavnaayein baantne se halki ho jaati hain.',
      as: 'আপুনি এনে অনুভৱ কৰিছে বুলি শুনি মোৰ দুখ লাগিল, আৰু মোক কোৱাৰ বাবে ধন্যবাদ। এনে অনুভৱ ভগাই ল’লে পাতল হৈ যায়।',
      bn: 'আপনার এমন লাগছে শুনে আমার খারাপ লাগল, আর আমাকে বলার জন্য ধন্যবাদ। এমন অনুভূতি ভাগ করে নিলে হালকা হয়ে যায়।'
    },
    low_mood_call: {
      en: 'Would you like to call {contact}?',
      hi: 'क्या आप {contact} को फ़ोन करना चाहेंगे?',
      'hi-Latn': 'Kya aap {contact} ko phone karna chahenge?',
      as: 'আপুনি {contact}ক ফোন কৰিব বিচাৰিবনে?',
      bn: 'আপনি কি {contact}-কে ফোন করতে চান?'
    },
    low_mood_memory: {
      en: 'Or we could look at a happy memory together.',
      hi: 'या हम साथ में कोई खुशी की याद देख सकते हैं।',
      'hi-Latn': 'Ya hum saath mein koi khushi ki yaad dekh sakte hain.',
      as: 'নাইবা আমি একেলগে এটা সুখৰ সোঁৱৰণ চাব পাৰোঁ।',
      bn: 'অথবা আমরা একসঙ্গে একটি সুখের স্মৃতি দেখতে পারি।'
    },
    good_mood: {
      en: 'That is lovely to hear. Shall we keep the good feeling going with a game, or a memory?',
      hi: 'यह सुनकर बहुत अच्छा लगा। इस अच्छे मन को बनाए रखने के लिए कोई खेल खेलें, या कोई याद देखें?',
      'hi-Latn': 'Yeh sunkar bahut accha laga. Is acche mann ko banaye rakhne ke liye koi game khelein, ya koi yaad dekhein?',
      as: 'শুনি বৰ ভাল লাগিল। এই ভাল লগাটো ধৰি ৰাখিবলৈ এটা খেল খেলোঁ নে, নে এটা সোঁৱৰণ চাওঁ?',
      bn: 'শুনে খুব ভালো লাগল। এই ভালো লাগাটা ধরে রাখতে একটা খেলা খেলি, নাকি একটা স্মৃতি দেখি?'
    },
    next_reminder: {
      en: 'Next is {title} at {time}, {when}.',
      hi: 'आपको {when} {time} {doing} — “{title}”।',
      'hi-Latn': 'Aapko {when} {time} {doing} — “{title}”.',
      as: 'আপুনি {when} {time} {doing} — “{title}”।',
      bn: 'আপনাকে {when} {time} {doing} — “{title}”।'
    },
    next_none: {
      en: 'You have nothing else scheduled today. That is a good moment to rest, or to play a short game.',
      hi: 'आज आपके लिए और कुछ तय नहीं है। थोड़ा आराम करने या छोटा सा खेल खेलने का अच्छा समय है।',
      'hi-Latn': 'Aaj aapke liye aur kuch tay nahi hai. Thoda aaraam karne ya chhota sa game khelne ka accha samay hai.',
      as: 'আজি আপোনাৰ আৰু একো কাম ঠিক কৰা নাই। জিৰণি ল’বলৈ বা এটা সৰু খেল খেলিবলৈ এইটো ভাল সময়।',
      bn: 'আজ আপনার আর কিছু ঠিক করা নেই। একটু বিশ্রাম নেওয়ার বা ছোট একটা খেলা খেলার এটাই ভালো সময়।'
    },
    medicine_none: {
      en: 'There is no medicine reminder set for today. Your caregiver can add one, or you can add it yourself in Reminders.',
      hi: 'आज के लिए दवाई का कोई रिमाइंडर नहीं है। आपके देखभाल करने वाले इसे जोड़ सकते हैं, या आप खुद रिमाइंडर में जोड़ सकते हैं।',
      'hi-Latn': 'Aaj ke liye dawai ka koi reminder nahi hai. Aapke caregiver ise jod sakte hain, ya aap khud Reminders mein jod sakte hain.',
      as: 'আজিৰ বাবে ঔষধৰ কোনো সোঁৱৰণী নাই। আপোনাৰ পৰিচাৰকে এটা যোগ কৰিব পাৰে, বা আপুনি নিজে সোঁৱৰণীত যোগ কৰিব পাৰে।',
      bn: 'আজকের জন্য ওষুধের কোনো রিমাইন্ডার নেই। আপনার দেখাশোনাকারী একটি যোগ করতে পারেন, বা আপনি নিজেই রিমাইন্ডারে যোগ করতে পারেন।'
    },
    medicine_list: {
      en: '{list}.',
      hi: 'आज की दवाइयाँ: {list}।',
      'hi-Latn': 'Aaj ki dawaiyan: {list}.',
      as: 'আজিৰ ঔষধ: {list}।',
      bn: 'আজকের ওষুধ: {list}।'
    },
    med_item: {
      en: '{title} at {time}, {status}',
      hi: '“{title}” {time}, {status}',
      'hi-Latn': '“{title}” {time}, {status}',
      as: '“{title}” {time}, {status}',
      bn: '“{title}” {time}, {status}'
    },
    activity_none: {
      en: 'There is no activity planned for today, but we can choose one together.',
      hi: 'आज के लिए कोई गतिविधि तय नहीं है, पर हम साथ में एक चुन सकते हैं।',
      'hi-Latn': 'Aaj ke liye koi activity tay nahi hai, par hum saath mein ek chun sakte hain.',
      as: 'আজিৰ বাবে কোনো কাম ঠিক কৰা নাই, কিন্তু আমি একেলগে এটা বাছি ল’ব পাৰোঁ।',
      bn: 'আজকের জন্য কোনো কাজ ঠিক করা নেই, তবে আমরা একসঙ্গে একটা বেছে নিতে পারি।'
    },
    activity_done: {
      en: 'You have finished all {total} activities today. Well done — that is something to be proud of.',
      hi: 'आपने आज की सभी {total} गतिविधियाँ पूरी कर लीं। बहुत बढ़िया — यह गर्व की बात है।',
      'hi-Latn': 'Aapne aaj ki sabhi {total} activities poori kar leen. Bahut badhiya — yeh garv ki baat hai.',
      as: 'আপুনি আজিৰ আটাইকেইটা — {total}টা — কাম শেষ কৰিলে। বৰ ভাল — ই গৌৰৱৰ কথা।',
      bn: 'আপনি আজকের সব {total}টি কাজ শেষ করেছেন। খুব ভালো — এটা গর্বের কথা।'
    },
    activity_next: {
      en: 'You have done {done} of {total}. Next is {game}, about {minutes} minutes. Shall we start?',
      hi: 'आपने {total} में से {done} कर लीं। अगली है {game}, लगभग {minutes} मिनट की। शुरू करें?',
      'hi-Latn': 'Aapne {total} mein se {done} kar leen. Agli hai {game}, lagbhag {minutes} minute ki. Shuru karein?',
      as: 'আপুনি {total}টাৰ ভিতৰত {done}টা কৰিলে। পিছৰটো {game}, প্ৰায় {minutes} মিনিটৰ। আৰম্ভ কৰোঁ নেকি?',
      bn: 'আপনি {total}টির মধ্যে {done}টি করেছেন। পরেরটি {game}, প্রায় {minutes} মিনিটের। শুরু করি?'
    },
    family_named: { en: '{title} — {content}{place}' },
    family_none: {
      en: 'There are no family contacts saved yet. Your caregiver can add them for you.',
      hi: 'अभी परिवार का कोई संपर्क सहेजा नहीं गया है। आपके देखभाल करने वाले इन्हें जोड़ सकते हैं।',
      'hi-Latn': 'Abhi parivaar ka koi contact save nahi hai. Aapke caregiver inhe jod sakte hain.',
      as: 'এতিয়ালৈকে পৰিয়ালৰ কোনো যোগাযোগ সংৰক্ষণ কৰা নাই। আপোনাৰ পৰিচাৰকে সেইবোৰ যোগ কৰিব পাৰে।',
      bn: 'এখনও পরিবারের কোনো যোগাযোগ সংরক্ষণ করা হয়নি। আপনার দেখাশোনাকারী সেগুলো যোগ করতে পারেন।'
    },
    family_list: {
      en: 'You can call {list}.',
      hi: 'आप {list} को फ़ोन कर सकते हैं।',
      'hi-Latn': 'Aap {list} ko phone kar sakte hain.',
      as: 'আপুনি {list}ক ফোন কৰিব পাৰে।',
      bn: 'আপনি {list}-কে ফোন করতে পারেন।'
    },
    memories_photo: {
      en: 'One of my favourites of yours is “{title}”{place}. Would you like to talk about that day?',
      hi: 'आपकी यादों में से मुझे “{title}” बहुत पसंद है{place}। क्या आप उस दिन के बारे में बात करना चाहेंगे?',
      'hi-Latn': 'Aapki yaadon mein se mujhe “{title}” bahut pasand hai{place}. Kya aap us din ke baare mein baat karna chahenge?',
      as: 'আপোনাৰ সোঁৱৰণবোৰৰ ভিতৰত মোৰ “{title}” বৰ ভাল লাগে{place}। সেই দিনটোৰ কথা পাতিব বিচাৰিবনে?',
      bn: 'আপনার স্মৃতিগুলোর মধ্যে “{title}” আমার খুব প্রিয়{place}। সেই দিনটার কথা বলতে চান?'
    },
    memories_count: {
      en: 'You have {n} memories saved. Shall I open them?',
      hi: 'आपकी {n} यादें सहेजी हुई हैं। क्या मैं उन्हें खोलूँ?',
      'hi-Latn': 'Aapki {n} yaadein save hain. Kya main unhe kholun?',
      as: 'আপোনাৰ {n}টা সোঁৱৰণ সংৰক্ষিত আছে। মই সেইবোৰ খুলিম নেকি?',
      bn: 'আপনার {n}টি স্মৃতি সংরক্ষিত আছে। আমি কি সেগুলো খুলব?'
    },
    memories_none: {
      en: 'No memories have been saved yet. We could add one — a photo and the story behind it.',
      hi: 'अभी तक कोई याद सहेजी नहीं गई है। हम एक जोड़ सकते हैं — एक फोटो और उसके पीछे की कहानी।',
      'hi-Latn': 'Abhi tak koi yaad save nahi hui hai. Hum ek jod sakte hain — ek photo aur uske peechhe ki kahani.',
      as: 'এতিয়ালৈকে কোনো সোঁৱৰণ সংৰক্ষণ কৰা হোৱা নাই। আমি এটা যোগ কৰিব পাৰোঁ — এখন ফটো আৰু তাৰ পিছৰ কাহিনী।',
      bn: 'এখনও কোনো স্মৃতি সংরক্ষণ করা হয়নি। আমরা একটি যোগ করতে পারি — একটি ছবি আর তার পেছনের গল্প।'
    },
    progress: {
      en: 'You have done {done} of {total} activities today. You are doing well.',
      hi: 'आज आपने {total} में से {done} गतिविधियाँ कीं। आप बहुत अच्छा कर रहे हैं।',
      'hi-Latn': 'Aaj aapne {total} mein se {done} activities kin. Aap bahut accha kar rahe hain.',
      as: 'আজি আপুনি {total}টাৰ ভিতৰত {done}টা কাম কৰিলে। আপুনি বৰ ভাল কৰিছে।',
      bn: 'আজ আপনি {total}টির মধ্যে {done}টি কাজ করেছেন। আপনি খুব ভালো করছেন।'
    },
    progress_streak: {
      en: 'You have done {done} of {total} activities today, and you have kept going {streak} days in a row. You are doing well.',
      hi: 'आज आपने {total} में से {done} गतिविधियाँ कीं, और आप लगातार {streak} दिन से लगे हुए हैं। आप बहुत अच्छा कर रहे हैं।',
      'hi-Latn': 'Aaj aapne {total} mein se {done} activities kin, aur aap lagaataar {streak} din se lage hue hain. Aap bahut accha kar rahe hain.',
      as: 'আজি আপুনি {total}টাৰ ভিতৰত {done}টা কাম কৰিলে, আৰু একেৰাহে {streak} দিন ধৰি কৰি আছে। আপুনি বৰ ভাল কৰিছে।',
      bn: 'আজ আপনি {total}টির মধ্যে {done}টি কাজ করেছেন, আর টানা {streak} দিন ধরে চালিয়ে যাচ্ছেন। আপনি খুব ভালো করছেন।'
    },
    appointment_next: {
      en: 'Your next appointment is with {doctor} on {date} at {time}.',
      hi: 'आपकी अगली अपॉइंटमेंट {doctor} के साथ {date} को {time} है।',
      'hi-Latn': 'Aapki agli appointment {doctor} ke saath {date} ko {time} hai.',
      as: 'আপোনাৰ পিছৰ এপইণ্টমেণ্ট {doctor}ৰ সৈতে, {date} তাৰিখে {time}।',
      bn: 'আপনার পরের অ্যাপয়েন্টমেন্ট {doctor}-এর সঙ্গে, {date} তারিখে {time}।'
    },
    appointment_none: {
      en: 'You have no appointment booked. Would you like me to open the doctors list?',
      hi: 'आपकी कोई अपॉइंटमेंट बुक नहीं है। क्या मैं डॉक्टरों की सूची खोलूँ?',
      'hi-Latn': 'Aapki koi appointment book nahi hai. Kya main doctors ki list kholun?',
      as: 'আপোনাৰ কোনো এপইণ্টমেণ্ট বুক কৰা নাই। মই ডাক্তৰৰ তালিকাখন খুলিম নেকি?',
      bn: 'আপনার কোনো অ্যাপয়েন্টমেন্ট বুক করা নেই। আমি কি ডাক্তারদের তালিকা খুলব?'
    },
    fact: {
      en: '{title}. {text}',
      hi: 'आज की रोचक बात (अंग्रेज़ी में): {title}. {text}',
      'hi-Latn': 'Aaj ki rochak baat (English mein): {title}. {text}',
      as: 'আজিৰ আমোদজনক কথা (ইংৰাজীত): {title}. {text}',
      bn: 'আজকের মজার তথ্য (ইংরেজিতে): {title}. {text}'
    },
    skill: {
      en: 'Today’s little lesson is “{title}” — {intro} It takes about {minutes} minutes. Shall I open it?',
      hi: 'आज की छोटी सीख है “{title}” (अंग्रेज़ी में), लगभग {minutes} मिनट की। क्या मैं इसे खोलूँ?',
      'hi-Latn': 'Aaj ki chhoti seekh hai “{title}” (English mein), lagbhag {minutes} minute ki. Kya main ise kholun?',
      as: 'আজিৰ সৰু শিক্ষাটো হ’ল “{title}” (ইংৰাজীত), প্ৰায় {minutes} মিনিটৰ। মই ইয়াক খুলিম নেকি?',
      bn: 'আজকের ছোট শিক্ষা “{title}” (ইংরেজিতে), প্রায় {minutes} মিনিটের। আমি কি এটা খুলব?'
    },
    joke: {
      en: '{joke} Would you like another?',
      hi: '{joke} एक और सुनेंगे?',
      'hi-Latn': '{joke} Ek aur sunenge?',
      as: '{joke} আৰু এটা শুনিবনে?',
      bn: '{joke} আরেকটা শুনবেন?'
    },
    time: {
      en: 'It is {time} on {weekday}, {date}.',
      hi: 'अभी {time} हैं। आज {weekday} है, {date}।',
      'hi-Latn': 'Abhi {time} hain. Aaj {weekday} hai, {date}.',
      as: 'এতিয়া {time}। আজি {weekday}, {date}।',
      bn: 'এখন {time}। আজ {weekday}, {date}।'
    },
    weather_ok: {
      en: 'In {city} it is about {temp} degrees, {desc}.',
      hi: '{city} में अभी लगभग {temp} डिग्री है।',
      'hi-Latn': '{city} mein abhi lagbhag {temp} degree hai.',
      as: '{city}ত এতিয়া প্ৰায় {temp} ডিগ্ৰী।',
      bn: '{city}-এ এখন প্রায় {temp} ডিগ্রি।'
    },
    weather_fail: {
      en: 'I could not check the weather just now. If you are going out, a light shawl is always a good idea.',
      hi: 'मैं अभी मौसम नहीं देख पाया। अगर बाहर जा रहे हैं, तो एक हल्की शॉल साथ रखना अच्छा रहेगा।',
      'hi-Latn': 'Main abhi mausam nahi dekh paaya. Agar bahar ja rahe hain, to ek halki shawl saath rakhna accha rahega.',
      as: 'মই এতিয়া বতৰ চাব নোৱাৰিলোঁ। বাহিৰলৈ গ’লে এখন পাতল চাদৰ লগত লোৱাটো ভাল।',
      bn: 'আমি এখন আবহাওয়া দেখতে পারলাম না। বাইরে গেলে একটা হালকা শাল সঙ্গে রাখা ভালো।'
    },
    /* ---- personal questions, answered from saved records ---- */
    my_name: {
      en: 'Your name is {name}. It is always good to talk with you, {first} Ji.',
      hi: 'आपका नाम {name} है। आपसे बात करके हमेशा अच्छा लगता है, {first} जी।',
      'hi-Latn': 'Aapka naam {name} hai. Aapse baat karke hamesha accha lagta hai, {first} Ji.'
    },
    remember_me: {
      en: 'Of course I remember you — you are {name}. I am glad you are here, {first} Ji.',
      hi: 'बिल्कुल, मुझे आप याद हैं — आप {name} हैं। आप यहाँ हैं, इससे मुझे खुशी है, {first} जी।',
      'hi-Latn': 'Bilkul, mujhe aap yaad hain — aap {name} hain. Aap yahan hain, isse mujhe khushi hai, {first} Ji.'
    },
    name_unknown: { en: 'I do not have your name saved yet. What would you like me to call you?' },
    family_member_one: { en: 'Your {rel} is {name}. Would you like to call them, {first} Ji?' },
    family_member_many: { en: 'You have {n} saved as your {rel}: {names}.' },
    family_member_none: { en: 'I do not have a {rel} saved in your family list, so I will not guess. Your caregiver can add them under Caregiver Support, or you can tell me their name.' },
    family_member_phone: { en: 'Here is the number I have saved: {list}. Would you like to call?' },
    family_member_nophone: { en: 'I have {names} saved as your {rel}, but no phone number for them yet.' },
    family_all: { en: 'In your family list you have {list}.{mem}' },
    reminders_list: { en: 'You have {n} reminders: {list}{more}. Would you like to open them?' },
    reminders_none: { en: 'You have not set any reminders yet. Would you like to add one?' },
    memories_list: { en: 'You have saved {n} memories. The most recent are {list}. Would you like to look at one together?' },
    memory_recent: { en: 'Yes — the last memory you saved is “{title}”{where}.{note} Would you like to talk about it?' },
    recall: { en: 'Earlier you told me {list}. Would you like to talk more about that?' },
    recall_none: { en: 'I cannot find anything you told me earlier, so I will not guess. What would you like to tell me now?' },
    today_plan: { en: 'Today you have {list}. One step at a time, {first} Ji — shall we begin?' },
    today_free: { en: 'Nothing is planned for today yet, {first} Ji. We could look at a memory, play a short game, or call someone you love.' },
    encourage: { en: '{text}{by}' },
    statement_ack: { en: 'Thank you for telling me, {first} Ji. I will remember that you said it. Would you like to tell me more?' },
    personal_unknown: { en: 'I do not have that saved, so I will not guess. Could you tell me a little more?' },
    general_offline: { en: 'That is a general-knowledge question. I can answer those only when Hun’s online service is connected, and it is not right now — so I will not guess. I can help with your reminders, family, memories or today’s activities.' },
    identity: {
      en: 'I am HUN, your companion in SMIVAI. I keep your reminders, your memories and your games, and I am always happy to talk with you, {name} Ji.',
      hi: 'मैं HUN हूँ, SMIVAI में आपका साथी। मैं आपके रिमाइंडर, आपकी यादें और आपके खेल संभालता हूँ, और आपसे बात करके मुझे हमेशा खुशी होती है, {name} जी।',
      'hi-Latn': 'Main HUN hoon, SMIVAI mein aapka saathi. Main aapke reminders, aapki yaadein aur aapke games sambhaalta hoon, aur aapse baat karke mujhe hamesha khushi hoti hai, {name} Ji.',
      as: 'মই HUN, SMIVAI ত আপোনাৰ সংগী। মই আপোনাৰ সোঁৱৰণী, সোঁৱৰণ আৰু খেলবোৰ ৰাখোঁ, আৰু আপোনাৰ লগত কথা পাতি মোৰ সদায় ভাল লাগে, {name} জী।',
      bn: 'আমি HUN, SMIVAI-তে আপনার সঙ্গী। আমি আপনার রিমাইন্ডার, স্মৃতি আর খেলাগুলো রাখি, আর আপনার সঙ্গে কথা বলে আমার সবসময় ভালো লাগে, {name} জি।'
    },
    thanks: {
      en: 'You are most welcome. I am glad to help.',
      hi: 'आपका स्वागत है। मदद करके मुझे खुशी हुई।',
      'hi-Latn': 'Aapka swagat hai. Madad karke mujhe khushi hui.',
      as: 'আপোনাক স্বাগতম। সহায় কৰিব পাৰি মোৰ ভাল লাগিল।',
      bn: 'আপনাকে স্বাগত। সাহায্য করতে পেরে আমার ভালো লাগল।'
    },
    bye: {
      en: 'Goodbye {name} Ji. I am here whenever you want to talk. Take care.',
      hi: 'अलविदा {name} जी। जब भी बात करनी हो, मैं यहीं हूँ। अपना ख़याल रखिए।',
      'hi-Latn': 'Alvida {name} Ji. Jab bhi baat karni ho, main yahin hoon. Apna khayal rakhiye.',
      as: 'বিদায় {name} জী। যেতিয়াই কথা পাতিব মন যায়, মই ইয়াতে আছোঁ। নিজৰ যত্ন ল’ব।',
      bn: 'বিদায় {name} জি। যখনই কথা বলতে চান, আমি এখানেই আছি। নিজের যত্ন নেবেন।'
    },
    fallback_0: {
      en: 'Tell me more — I am listening.',
      hi: 'और बताइए — मैं सुन रहा हूँ।',
      'hi-Latn': 'Aur bataiye — main sun raha hoon.',
      as: 'আৰু কওক — মই শুনি আছোঁ।',
      bn: 'আরও বলুন — আমি শুনছি।'
    },
    fallback_1: {
      en: 'I am not sure I understood that, but I am happy to listen. You can ask me about your reminders, your medicines, your family, your memories, or today’s activity.',
      hi: 'मैं शायद पूरी तरह समझ नहीं पाया, पर मैं सुनने के लिए यहाँ हूँ। आप मुझसे अपने रिमाइंडर, दवाइयों, परिवार, यादों या आज की गतिविधि के बारे में पूछ सकते हैं।',
      'hi-Latn': 'Main shayad poori tarah samajh nahi paaya, par main sunne ke liye yahan hoon. Aap mujhse apne reminders, dawaiyon, parivaar, yaadon ya aaj ki activity ke baare mein pooch sakte hain.',
      as: 'মই হয়তো সম্পূৰ্ণ বুজি নাপালোঁ, কিন্তু মই শুনিবলৈ আছোঁ। আপুনি মোক আপোনাৰ সোঁৱৰণী, ঔষধ, পৰিয়াল, সোঁৱৰণ বা আজিৰ কামৰ বিষয়ে সুধিব পাৰে।',
      bn: 'আমি হয়তো পুরোপুরি বুঝতে পারিনি, তবে আমি শোনার জন্য আছি। আপনি আমাকে আপনার রিমাইন্ডার, ওষুধ, পরিবার, স্মৃতি বা আজকের কাজের কথা জিজ্ঞেস করতে পারেন।'
    },
    fallback_2: {
      en: 'That is interesting. Would you like to hear today’s fact, or look at a memory together?',
      hi: 'यह दिलचस्प है। क्या आप आज की रोचक बात सुनना चाहेंगे, या साथ में कोई याद देखें?',
      'hi-Latn': 'Yeh dilchasp hai. Kya aap aaj ki rochak baat sunna chahenge, ya saath mein koi yaad dekhein?',
      as: 'ই আমোদজনক। আজিৰ আমোদজনক কথাটো শুনিব বিচাৰিবনে, নে একেলগে এটা সোঁৱৰণ চাওঁ?',
      bn: 'এটা মজার। আজকের মজার তথ্যটা শুনবেন, নাকি একসঙ্গে একটা স্মৃতি দেখব?'
    },
    mem_saved: {
      en: 'I have added that to “{title}”. It will be there whenever you want to read it again.',
      hi: 'मैंने इसे “{title}” में जोड़ दिया है। जब भी आप दोबारा पढ़ना चाहें, यह वहीं रहेगा।',
      'hi-Latn': 'Maine ise “{title}” mein jod diya hai. Jab bhi aap dobara padhna chahein, yeh wahin rahega.',
      as: 'মই ইয়াক “{title}”ত যোগ কৰিলোঁ। আপুনি যেতিয়াই আকৌ পঢ়িব বিচাৰে, ই তাতে থাকিব।',
      bn: 'আমি এটা “{title}”-এ যোগ করেছি। আপনি যখনই আবার পড়তে চান, এটা সেখানেই থাকবে।'
    },
    mem_not_saved: {
      en: 'That is fine. I will keep it just between us.',
      hi: 'कोई बात नहीं। यह बात हम दोनों के बीच ही रहेगी।',
      'hi-Latn': 'Koi baat nahi. Yeh baat hum dono ke beech hi rahegi.',
      as: 'ঠিক আছে। এই কথা আমাৰ দুয়োৰে মাজতে থাকিব।',
      bn: 'ঠিক আছে। কথাটা আমাদের দুজনের মধ্যেই থাকবে।'
    },
    mem_who: {
      en: 'In “{title}” you were with {people}.',
      hi: '“{title}” में आपके साथ {people} थे।',
      'hi-Latn': '“{title}” mein aapke saath {people} the.',
      as: '“{title}”ত আপোনাৰ লগত {people} আছিল।',
      bn: '“{title}”-এ আপনার সঙ্গে {people} ছিলেন।'
    },
    mem_where: {
      en: 'This was at {place}.',
      hi: 'यह {place} की बात है।',
      'hi-Latn': 'Yeh {place} ki baat hai.',
      as: 'এইটো {place}ৰ কথা।',
      bn: 'এটা {place}-এর কথা।'
    },
    mem_who_unknown: {
      en: 'This memory does not say who was there yet. Would you like to tell me, so I can save it?',
      hi: 'इस याद में अभी यह नहीं लिखा कि कौन-कौन था। क्या आप बताएँगे, ताकि मैं इसे सहेज सकूँ?',
      'hi-Latn': 'Is yaad mein abhi yeh nahi likha ki kaun-kaun tha. Kya aap batayenge, taaki main ise save kar sakun?',
      as: 'এই সোঁৱৰণত কোন কোন আছিল এতিয়াও লিখা নাই। মোক ক’বনে, যাতে মই সংৰক্ষণ কৰিব পাৰোঁ?',
      bn: 'এই স্মৃতিতে কে কে ছিলেন তা এখনও লেখা নেই। আমাকে বলবেন, যাতে আমি সংরক্ষণ করতে পারি?'
    },
    mem_when: {
      en: '“{title}” is from {date}.',
      hi: '“{title}” {date} की याद है।',
      'hi-Latn': '“{title}” {date} ki yaad hai.',
      as: '“{title}” {date}ৰ সোঁৱৰণ।',
      bn: '“{title}” {date}-এর স্মৃতি।'
    },
    mem_when_unknown: {
      en: 'There is no date on this memory yet. Do you remember roughly when it was?',
      hi: 'इस याद पर अभी कोई तारीख़ नहीं है। क्या आपको मोटा-मोटा याद है कि यह कब की बात है?',
      'hi-Latn': 'Is yaad par abhi koi tareekh nahi hai. Kya aapko mota-mota yaad hai ki yeh kab ki baat hai?',
      as: 'এই সোঁৱৰণত এতিয়াও কোনো তাৰিখ নাই। মোটামুটিকৈ কেতিয়াৰ কথা আপোনাৰ মনত আছেনে?',
      bn: 'এই স্মৃতিতে এখনও কোনো তারিখ নেই। মোটামুটি কবেকার কথা আপনার মনে আছে?'
    },
    mem_offer: {
      en: 'What a lovely thing to remember. Would you like me to add that to “{title}”?',
      hi: 'कितनी प्यारी याद है। क्या मैं इसे “{title}” में जोड़ दूँ?',
      'hi-Latn': 'Kitni pyaari yaad hai. Kya main ise “{title}” mein jod doon?',
      as: 'কিমান সুন্দৰ সোঁৱৰণ। মই ইয়াক “{title}”ত যোগ কৰি দিম নেকি?',
      bn: 'কী সুন্দর স্মৃতি। আমি কি এটা “{title}”-এ যোগ করে দেব?'
    },
    mem_prompt: {
      en: 'Tell me more about that day. What do you remember most — the people, the place, or the food?',
      hi: 'उस दिन के बारे में और बताइए। आपको सबसे ज़्यादा क्या याद है — लोग, जगह, या खाना?',
      'hi-Latn': 'Us din ke baare mein aur bataiye. Aapko sabse zyada kya yaad hai — log, jagah, ya khana?',
      as: 'সেই দিনটোৰ কথা আৰু কওক। আপোনাৰ আটাইতকৈ কি মনত আছে — মানুহবোৰ, ঠাইখন, নে খাদ্য?',
      bn: 'সেই দিনটার কথা আরও বলুন। আপনার সবচেয়ে বেশি কী মনে আছে — মানুষজন, জায়গা, নাকি খাবার?'
    }
  };

  var Replies = {
    STYLES: ['en', 'hi', 'hi-Latn', 'as', 'bn'],
    digits: digits,

    /* Values that come out differently in each style. */
    at: function (hhmm) { return function (v) { return clockAt(hhmm, v); }; },
    now: function (hhmm) { return function (v) { return clockIs(hhmm, v); }; },
    date: function (iso) { return function (v) { return dateOf(iso, v); }; },
    weekday: function (iso) { return function (v) { return weekdayOf(iso, v); }; },
    day: function (isToday) { return function (v) { return (DAY[v] || DAY.en)[isToday ? 0 : 1]; }; },
    doing: function (category) { return function (v) { var d = DOING[category] || DOING.custom; return d[v] || ''; }; },
    medStatus: function (status) { return function (v) { var st = MED_STATUS[status] || MED_STATUS.upcoming; return st[v] || st.en; }; },
    joke: function (seed) { return function (v) { var l = JOKES[v] || JOKES.en; return l[Math.floor(seed * l.length) % l.length]; }; },
    listSep: function (v) { return LIST_SEP[v] || LIST_SEP.en; },

    /**
     * Render a reply in one style. A reply is {key, params} or a list of
     * them (joined by a space). Returns null if any part has no text in
     * that style, so the caller can fall back rather than mix languages.
     */
    render: function (reply, v) {
      if (!reply) return null;
      if (Array.isArray(reply)) {
        var parts = [];
        for (var i = 0; i < reply.length; i++) {
          var s = this.render(reply[i], v);
          if (s === null) return null;
          if (s) parts.push(s);
        }
        return parts.join(' ');
      }
      var tpl = R[reply.key];
      if (!tpl) return null;
      var text = tpl[v] !== undefined ? tpl[v] : (reply.key === 'family_named' ? tpl.en : null);
      if (text === null) return null;
      var params = reply.params || {};
      return text.replace(/\{(\w+)\}/g, function (m, k) {
        var val = params[k];
        if (typeof val === 'function') val = val(v);
        if (val && typeof val === 'object' && val.key) val = Replies.render(val, v);
        if (Array.isArray(val)) val = val.map(function (x) { return typeof x === 'function' ? x(v) : Replies.render(x, v); }).join(v === 'en' ? '. ' : '; ');
        if (typeof val === 'number') val = digits(val, v);
        return val === undefined || val === null ? '' : String(val);
      });
    }
  };

  S.Replies = Replies;
})(window);
