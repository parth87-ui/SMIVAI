/* ============================================================
   SMIVAI — langdetect.js
   Which language did the person just use — and what did they mean?

   SMIVAI answers in the language of each message, not only the one on the
   patient's profile. A Hindi speaker whose profile says Bodo, or who types
   Hindi in English letters ("mera next task kya h"), still gets a Hindi
   answer — in the same script they wrote.

   detect(text, profileLang) → { lang, script, variant }
     variant is the reply style SMIVAI can produce on this device:
       'en' · 'hi' (Devanagari) · 'hi-Latn' (Hindi in English letters)
       'as' · 'bn'
     or null for a language it recognises but cannot answer in without a
     language service (then Talk falls back to Bhashini / AI4Bharat, or
     says plainly that it is answering in English).

   toPivot(text, det) → the message rewritten into English keywords, so
     the companion's one table of intents serves every language. Words it
     does not know pass through unchanged (English words in Hinglish, names).

   Everything here runs on the device. Nothing is sent anywhere.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* ---------------- scripts ---------------- */
  var SCRIPTS = [
    { re: /[ঀ-৿]/, script: 'beng' },
    { re: /[ऀ-ॿ]/, script: 'deva' },
    { re: /[ꯀ-꯿]/, script: 'mtei', lang: 'mni' },
    { re: /[਀-੿]/, script: 'guru', lang: 'pa' },
    { re: /[઀-૿]/, script: 'gujr', lang: 'gu' },
    { re: /[଀-୿]/, script: 'orya', lang: 'or' },
    { re: /[஀-௿]/, script: 'taml', lang: 'ta' },
    { re: /[ఀ-౿]/, script: 'telu', lang: 'te' },
    { re: /[ಀ-೿]/, script: 'knda', lang: 'kn' },
    { re: /[ഀ-ൿ]/, script: 'mlym', lang: 'ml' }
  ];

  /* Languages written in Devanagari besides Hindi — the profile decides
     between them when a message has no plainly Hindi words. */
  var DEVA_LANGS = { hi: 1, brx: 1, ne: 1, mr: 1, mai: 1, doi: 1, kok: 1, sa: 1 };

  /* A handful of the commonest Hindi words; any one is enough. */
  var HI_DEVA = /(^|[\s,.?!।])(है|हैं|क्या|मेरा|मेरी|मेरे|मुझे|आप|आपका|आपको|कब|कौन|कैसे|कहाँ|कहां|नहीं|था|थी|हूँ|हूं|हो|का|की|के|में|को|से|और|भी)(?=$|[\s,.?!।])/;

  /* Assamese has two letters Bengali does not: ৰ and ৱ. */
  var AS_LETTERS = /[ৰৱ]/;
  var BN_WORDS = /(আমার|আমাকে|আপনার|আপনাকে|কখন|কোথায়|করতে|হবে|ওষুধ|তোমার|কেমন|ভালো)/;

  /* Hindi typed in English letters. Strong words are not English words;
     weak ones are, or are too short to count on their own. */
  var HINGLISH_STRONG = ('kya kyaa kyu kyun hai hain hoon hun mera meri mere mujhe mujhko mujhse aap aapka aapki aapke aapko ' +
    'tum tumhara tera kab kaun kaise kahan kidhar kitna kitne kitni batao bataiye bataao karna karni karo kariye karein ' +
    'kaam agla agli agle abhi aaj raat subah shaam dopahar baje bajey dawai dawa dawaai goli khana khaana paani ' +
    'nahi nahin haan theek thik accha acha achha yaad dilao dilana dilaiye chahiye hoga hogi wala wali sakta sakti ' +
    'dikhao dikhaiye samay ghar beta beti bahu pati patni parivar khel khelna khelte udaas akela akeli dukhi khush ' +
    'shukriya dhanyavaad dhanyawad alvida namaste namaskar madad bachao dard seene saans gir gaya gayi mausam baarish ' +
    'chutkula kahani tasveer yaadein pragati kal parson').split(' ');
  var HINGLISH_WEAK = ('h ki ka ke ko se me mein ji han hu bhi aur sab kuch koi time bata').split(' ');
  var STRONG = {}, WEAK = {};
  HINGLISH_STRONG.forEach(function (w) { STRONG[w] = 1; });
  HINGLISH_WEAK.forEach(function (w) { WEAK[w] = 1; });

  /* ---------------- meaning: phrase and word maps into English ---------------- */
  /* Phrases first (they need more than one word), then single words. */
  var PHRASES = {
    hi: [
      [/(सीने|छाती)\s*(में)?\s*दर्द/g, ' chest pain '],
      [/(seene|chhati|chati)\s*(me|mein)?\s*dard/g, ' chest pain '],
      [/(साँस|सांस)\s*(नहीं|लेने\s*में)/g, ' cannot breathe '],
      [/saans\s*(nahi|nahin|lene\s*me|lene\s*mein)/g, ' cannot breathe '],
      [/गिर\s*(गया|गई|गयी)/g, ' i fell '],
      [/gir\s*(gaya|gayi|gai)/g, ' i fell '],
      [/याद\s*(दिलाओ|दिलाइए|दिलाना)/g, ' remind '],
      [/yaad\s*(dilao|dilaiye|dilana|dila)/g, ' remind '],
      [/कैसे\s*हो/g, ' how are you '],
      [/kaise\s*(ho|hain|hai)/g, ' how are you '],
      [/कौन\s*हो/g, ' who are you '],
      [/kaun\s*(ho|hai)\s*(tum|aap)?/g, ' who are you '],
      [/क्या\s*करना\s*(है|हैं)/g, ' what next '],
      [/kya\s*karna\s*(hai|h|he)/g, ' what next ']
    ],
    as: [
      [/বুকু(ত)?\s*বিষ/g, ' chest pain '],
      [/উশাহ\s*(ল’ব|লব|লʼব)?\s*(পৰা\s*নাই|নোৱাৰো)/g, ' cannot breathe '],
      [/পৰি\s*(গ’লো|গলো|গৈছোঁ)/g, ' i fell '],
      [/মনত\s*পেলাই\s*দিয়া/g, ' remind '],
      [/কেনে\s*আছে/g, ' how are you '],
      [/কি\s*কৰিব\s*লাগিব/g, ' what next ']
    ],
    bn: [
      [/বুকে\s*ব্যথা/g, ' chest pain '],
      [/শ্বাস\s*নিতে\s*পারছি\s*না/g, ' cannot breathe '],
      [/পড়ে\s*গেছি/g, ' i fell '],
      [/মনে\s*করিয়ে\s*দাও/g, ' remind '],
      [/কেমন\s*আছ/g, ' how are you '],
      [/কী\s*করতে\s*হবে|কি\s*করতে\s*হবে/g, ' what next ']
    ]
  };
  PHRASES['hi-Latn'] = PHRASES.hi;

  var WORDS = {
    hi: {
      /* Devanagari */
      'मेरा': 'my', 'मेरी': 'my', 'मेरे': 'my', 'मुझे': 'me', 'आप': 'you', 'आपका': 'your', 'आपकी': 'your',
      'क्या': 'what', 'कब': 'when', 'कौन': 'who', 'कैसे': 'how', 'कहाँ': 'where', 'कहां': 'where',
      'है': 'is', 'हैं': 'are', 'अगला': 'next', 'अगली': 'next', 'अगले': 'next', 'काम': 'task',
      'दवाई': 'medicine', 'दवा': 'medicine', 'दवाइयाँ': 'medicine', 'गोली': 'medicine', 'खाना': 'food', 'पानी': 'water',
      'डॉक्टर': 'doctor', 'डाक्टर': 'doctor', 'परिवार': 'family', 'बेटा': 'son', 'बेटी': 'daughter', 'पत्नी': 'wife', 'पति': 'husband',
      'खेल': 'game', 'आज': 'today', 'कल': 'tomorrow', 'अभी': 'now', 'समय': 'time', 'टाइम': 'time', 'दिन': 'day', 'तारीख': 'date',
      'मौसम': 'weather', 'बारिश': 'rain', 'नमस्ते': 'hello', 'नमस्कार': 'hello', 'धन्यवाद': 'thanks', 'शुक्रिया': 'thanks',
      'अलविदा': 'bye', 'उदास': 'sad', 'अकेला': 'lonely', 'अकेली': 'lonely', 'दुखी': 'sad', 'खुश': 'happy', 'ठीक': 'fine',
      'अच्छा': 'good', 'मदद': 'help', 'दर्द': 'pain', 'कहानी': 'story', 'चुटकुला': 'joke', 'फोटो': 'photo', 'तस्वीर': 'photo',
      'यादें': 'memories', 'याद': 'remember', 'प्रगति': 'progress', 'रिमाइंडर': 'reminder', 'अपॉइंटमेंट': 'appointment',
      /* Hindi in English letters */
      'mera': 'my', 'meri': 'my', 'mere': 'my', 'mujhe': 'me', 'mujhko': 'me', 'aap': 'you', 'aapka': 'your', 'aapki': 'your',
      'kya': 'what', 'kyaa': 'what', 'kab': 'when', 'kaun': 'who', 'kaise': 'how', 'kahan': 'where', 'kidhar': 'where',
      'hai': 'is', 'h': 'is', 'hain': 'are', 'agla': 'next', 'agli': 'next', 'agle': 'next', 'kaam': 'task',
      'dawai': 'medicine', 'dawa': 'medicine', 'dawaai': 'medicine', 'goli': 'medicine', 'khana': 'food', 'khaana': 'food', 'paani': 'water',
      'parivar': 'family', 'beta': 'son', 'beti': 'daughter', 'patni': 'wife', 'pati': 'husband',
      'khel': 'game', 'khelna': 'play', 'aaj': 'today', 'kal': 'tomorrow', 'abhi': 'now', 'samay': 'time', 'din': 'day', 'tareekh': 'date',
      'mausam': 'weather', 'baarish': 'rain', 'namaste': 'hello', 'namaskar': 'hello', 'dhanyavaad': 'thanks', 'dhanyawad': 'thanks',
      'shukriya': 'thanks', 'alvida': 'bye', 'udaas': 'sad', 'akela': 'lonely', 'akeli': 'lonely', 'dukhi': 'sad', 'khush': 'happy',
      'theek': 'fine', 'thik': 'fine', 'accha': 'good', 'acha': 'good', 'achha': 'good', 'madad': 'help', 'bachao': 'help me now', 'dard': 'pain',
      'kahani': 'story', 'chutkula': 'joke', 'tasveer': 'photo', 'yaadein': 'memories', 'yaad': 'remember', 'pragati': 'progress',
      'batao': 'tell', 'bataiye': 'tell', 'bata': 'tell', 'dikhao': 'show', 'dikhaiye': 'show',
      'main': 'i', 'hoon': 'am', 'hun': 'am', 'kitne': 'what', 'kitna': 'what', 'baje': 'time', 'bajey': 'time',
      'rochak': 'interesting', 'haan': 'yes', 'nahi': 'no', 'nahin': 'no',
      'मैं': 'i', 'हूँ': 'am', 'हूं': 'am', 'कितने': 'what', 'बजे': 'time', 'रोचक': 'interesting',
      'हाँ': 'yes', 'हां': 'yes', 'नहीं': 'no', 'बचाओ': 'help me now'
    },
    as: {
      'মোৰ': 'my', 'মোক': 'me', 'মই': 'i', 'আপোনাৰ': 'your', 'আপুনি': 'you', 'কি': 'what', 'কেতিয়া': 'when',
      'কোন': 'who', 'কেনেকৈ': 'how', 'ক’ত': 'where', 'কত': 'where', 'পিছৰ': 'next', 'পাছৰ': 'next', 'কাম': 'task',
      'ঔষধ': 'medicine', 'দৰব': 'medicine', 'আহাৰ': 'food', 'ভাত': 'food', 'পানী': 'water', 'ডাক্তৰ': 'doctor',
      'পৰিয়াল': 'family', 'ল’ৰা': 'son', 'ছোৱালী': 'daughter', 'খেল': 'game', 'আজি': 'today', 'কাইলৈ': 'tomorrow',
      'এতিয়া': 'now', 'সময়': 'time', 'বতৰ': 'weather', 'বৰষুণ': 'rain', 'নমস্কাৰ': 'hello', 'ধন্যবাদ': 'thanks',
      'বিদায়': 'bye', 'দুখ': 'sad', 'অকলশৰীয়া': 'lonely', 'ভাল': 'good', 'সহায়': 'help', 'বিষ': 'pain',
      'সোঁৱৰণী': 'reminder', 'ফটো': 'photo', 'সোঁৱৰণ': 'memories', 'সাধু': 'story', 'অগ্ৰগতি': 'progress',
      'হয়': 'yes', 'নহয়': 'no', 'নালাগে': 'no', 'কিমান': 'what', 'বজা': 'time', 'বাজিছে': 'time'
    },
    bn: {
      'আমার': 'my', 'আমাকে': 'me', 'আমি': 'i', 'আপনার': 'your', 'আপনি': 'you', 'কী': 'what', 'কি': 'what',
      'কখন': 'when', 'কে': 'who', 'কীভাবে': 'how', 'কোথায়': 'where', 'পরের': 'next', 'কাজ': 'task',
      'ওষুধ': 'medicine', 'খাবার': 'food', 'জল': 'water', 'পানি': 'water', 'ডাক্তার': 'doctor', 'পরিবার': 'family',
      'ছেলে': 'son', 'মেয়ে': 'daughter', 'খেলা': 'game', 'আজ': 'today', 'কাল': 'tomorrow', 'এখন': 'now',
      'সময়': 'time', 'আবহাওয়া': 'weather', 'বৃষ্টি': 'rain', 'নমস্কার': 'hello', 'ধন্যবাদ': 'thanks', 'বিদায়': 'bye',
      'দুঃখ': 'sad', 'একা': 'lonely', 'ভালো': 'good', 'সাহায্য': 'help', 'ব্যথা': 'pain', 'রিমাইন্ডার': 'reminder',
      'ছবি': 'photo', 'স্মৃতি': 'memories', 'গল্প': 'story', 'অগ্রগতি': 'progress',
      'হ্যাঁ': 'yes', 'কটা': 'what', 'বাজে': 'time'
    }
  };
  WORDS['hi-Latn'] = WORDS.hi;

  function tokens(text) {
    return String(text || '').toLowerCase().split(/[\s,.;:!?।॥"“”'‘’()\-–—]+/).filter(Boolean);
  }

  var LangDetect = {
    /** Which language and script this message is in. */
    detect: function (text, profileLang) {
      var t = String(text || '');
      var profile = profileLang || 'en';
      var script = null, lang = null;
      for (var i = 0; i < SCRIPTS.length; i++) {
        if (SCRIPTS[i].re.test(t)) { script = SCRIPTS[i].script; lang = SCRIPTS[i].lang || null; break; }
      }

      if (script === 'beng') {
        lang = AS_LETTERS.test(t) ? 'as' : BN_WORDS.test(t) ? 'bn' : (profile === 'as' ? 'as' : 'bn');
      } else if (script === 'deva') {
        lang = HI_DEVA.test(t) ? 'hi' : (DEVA_LANGS[profile] ? profile : 'hi');
      } else if (!script) {
        script = 'latn';
        var strong = 0, weak = 0, other = 0;
        tokens(t).forEach(function (w) { if (STRONG[w]) strong++; else if (WEAK[w]) weak++; else other++; });
        /* two Hindi words, one plus a small one, or nothing but Hindi words
           ("namaste", "theek hoon") — English words alone never qualify */
        lang = (strong >= 2 || (strong >= 1 && weak >= 1) || (strong >= 1 && !other) || (strong >= 1 && profile === 'hi')) ? 'hi' : 'en';
      }

      var variant = lang === 'hi' ? (script === 'latn' ? 'hi-Latn' : 'hi')
        : (lang === 'en' || lang === 'as' || lang === 'bn') ? lang : null;
      return { lang: lang || 'en', script: script, variant: variant };
    },

    /** The message in English keywords, for the companion's intent table. */
    toPivot: function (text, det) {
      var v = det && det.variant;
      var out = String(text || '').toLowerCase();
      if (!v || v === 'en') return out;
      (PHRASES[v] || []).forEach(function (pr) { out = out.replace(pr[0], pr[1]); });
      var map = WORDS[v] || {};
      return tokens(out).map(function (w) {
        if (map[w]) return map[w];
        /* Assamese and Bengali add endings to a word (ঔষধটো, পিছৰটো): match
           the start of a longer word against words of three letters or more */
        if (v === 'as' || v === 'bn') {
          for (var k in map) if (k.length >= 3 && w.indexOf(k) === 0) return map[k];
        }
        return w;
      }).join(' ');
    }
  };

  S.LangDetect = LangDetect;
})(window);
