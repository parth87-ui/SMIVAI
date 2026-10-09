/* ============================================================
   SMIVAI — content_daily.js
   The content of the Daily Facts section: three kinds of item, each
   labelled for what it is.

     story    a real person's later-life achievement, checked against the
              cited source. Details are stated as the sources give them,
              including where sources disagree.
     fact     evidence-based information on ageing, social connection,
              dementia awareness and caregiving, with its source.
     message  an encouraging message. Original Smivai messages say so;
              a quotation appears only with a verifiable source.

   Nothing here claims that games or activities prevent, cure or reverse
   dementia. Sources were checked in October 2026; the collection ships
   with the app, so it works offline — it is not a live feed.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var SRC = {
    sanders: { name: 'Wikipedia — Colonel Sanders', url: 'https://en.wikipedia.org/wiki/Colonel_Sanders' },
    moses: { name: 'Smithsonian American Art Museum — Grandma Moses', url: 'https://americanart.si.edu/exhibitions/grandma-moses' },
    wilder: { name: 'Wikipedia — Little House books', url: 'https://en.wikipedia.org/wiki/List_of_Little_House_on_the_Prairie_books' },
    roget: { name: 'University of Edinburgh — Peter Mark Roget', url: 'https://alumni.ed.ac.uk/services/notable-alumni/alumni-in-history/peter-mark-roget' },
    karthiyani: { name: 'Kerala State Literacy Mission', url: 'https://literacymissionkerala.org/en/after-scoring-a-top-score-of-98-96-year-old-karthiyani-amma-is-now-aiming-to-clear-the-10th-equivalency/' },
    bhageerathi: { name: 'The News Minute', url: 'https://www.thenewsminute.com/kerala/bhageerathi-amma-who-passed-level-4-exam-age-105-passes-away-152811' },
    thimmakka: { name: 'Wikipedia — Saalumarada Thimmakka', url: 'https://en.wikipedia.org/wiki/Saalumarada_Thimmakka' },
    mandela: { name: 'Wikipedia — Nelson Mandela', url: 'https://en.wikipedia.org/wiki/Nelson_Mandela' },
    whoActivity: { name: 'WHO 2020 guidelines on physical activity', url: 'https://www.who.int/publications/i/item/9789240015128' },
    whoSocial: { name: 'WHO — Commission on Social Connection (2025)', url: 'https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death' },
    lancet: { name: 'The Lancet Commission on dementia (2024)', url: 'https://www.alzheimer-europe.org/news/2024-lancet-commission-underscores-potential-dementia-risk-reduction-identifying-14-modifiable' },
    lasi: { name: 'NIH Fogarty — LASI-DAD dementia estimate for India', url: 'https://www.fic.nih.gov/News/GlobalHealthMatters/march-april-2023/Pages/new-estimate-dementia-prevalence-magnitude-india-challenge.aspx' },
    nia: { name: 'National Institute on Aging — communicating with a person with Alzheimer’s', url: 'https://www.nia.nih.gov/health/alzheimers-changes-behavior-and-communication' },
    niaCare: { name: 'National Institute on Aging — taking care of yourself as a caregiver', url: 'https://www.nia.nih.gov/health/caregiving/taking-care-yourself-tips-caregivers' },
    tagore: { name: 'Rabindranath Tagore, Stray Birds (1916), no. 6 — Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/6524' }
  };

  var ORIGINAL = 'Original Smivai message';

  var ITEMS = [
    /* ---------------- real-life stories ---------------- */
    { id: 'st_sanders', type: 'story', title: 'Colonel Sanders started over in his sixties',
      text: 'Harland Sanders ran a roadside café in Corbin, Kentucky. In 1952, at about 62, he began licensing his fried-chicken recipe to other restaurants. A few years later a new highway took traffic away from his café and he sold it — then kept travelling to sign up more restaurants. By 1964 there were over 600, and at 73 he sold the company. It was not overnight success: it was years of patient work after many setbacks.',
      source: SRC.sanders },
    { id: 'st_moses', type: 'story', title: 'Grandma Moses began painting in her late 70s',
      text: 'Anna Mary Robertson Moses turned to painting in her late seventies, when arthritis made sewing too hard. Her pictures of farm life were shown at a country fair and a drugstore, and at 80 she had her first solo exhibition in New York. She kept painting for the rest of her long life.',
      source: SRC.moses },
    { id: 'st_wilder', type: 'story', title: 'A first book at 65',
      text: 'Laura Ingalls Wilder wrote down her memories of growing up on the American frontier. Her first book, “Little House in the Big Woods”, was published in 1932, when she was 65. Her own childhood memories became a series loved by readers for generations.',
      source: SRC.wilder },
    { id: 'st_roget', type: 'story', title: 'A lifelong word list, published at 73',
      text: 'Peter Mark Roget, a doctor, kept lists of words with similar meanings for decades. He published them as his famous Thesaurus in 1852, at the age of 73.',
      source: SRC.roget },
    { id: 'st_karthiyani', type: 'story', title: 'Karthiyani Amma topped a literacy exam at 96',
      text: 'Karthiyani Amma of Alappuzha, Kerala, never went to school and worked for years cleaning temple premises. Watching her grandchildren study, she wished to learn too. In 2018, at about 96, she came first in the Kerala Literacy Mission’s Aksharalaksham exam, scoring 98 out of 100. Afterwards she said she wanted to learn computers.',
      source: SRC.karthiyani },
    { id: 'st_bhageerathi', type: 'story', title: 'Bhageerathi Amma passed an exam at 105',
      text: 'In 2019, Bhageerathi Amma of Kollam, Kerala, passed the Kerala Literacy Mission’s fourth-standard equivalency exam at 105, with full marks in mathematics. She received the Nari Shakti Puraskar in 2020 and was preparing for her next level when she died in 2021.',
      source: SRC.bhageerathi },
    { id: 'st_thimmakka', type: 'story', title: 'Saalumarada Thimmakka and her banyan trees',
      text: 'With her husband, Saalumarada Thimmakka of Karnataka planted and cared for 385 banyan trees along about four kilometres of road between Hulikal and Kudur, a few trees each year over decades. She received the Padma Shri in 2019, when she was well over a hundred.',
      source: SRC.thimmakka },
    { id: 'st_mandela', type: 'story', title: 'Nelson Mandela became president at 75',
      text: 'Nelson Mandela spent 27 years in prison. He was released in 1990 and in 1994, at 75, he became South Africa’s first president elected in a fully democratic election — showing that it is never too late to serve.',
      source: SRC.mandela },

    /* ---------------- evidence-based facts ---------------- */
    { id: 'fa_activity', type: 'fact', title: 'Moving more helps at any age',
      text: 'The World Health Organization suggests 150–300 minutes of moderate activity a week for older adults — that is about 20–40 minutes a day — plus balance and strength activities on at least three days a week to help prevent falls. A walk with a friend counts.',
      source: SRC.whoActivity },
    { id: 'fa_balance', type: 'fact', title: 'Balance can be practised',
      text: 'For people over 65, WHO recommends activities that combine balance, coordination and strength — such as standing from a chair a few times, or gentle exercises holding a support — on at least three days a week.',
      source: SRC.whoActivity },
    { id: 'fa_sitting', type: 'fact', title: 'Every bit of movement counts',
      text: 'WHO’s guidance says that doing some physical activity is better than doing none, and that sitting for long stretches should be broken up with light movement where possible.',
      source: SRC.whoActivity },
    { id: 'fa_social', type: 'fact', title: 'Staying connected is good for health',
      text: 'A 2025 World Health Organization report found that strong social connection is linked to better health and a lower risk of early death, while loneliness is linked to stroke, heart disease, depression and cognitive decline.',
      source: SRC.whoSocial },
    { id: 'fa_lonely_common', type: 'fact', title: 'Loneliness is common — and not a failing',
      text: 'WHO estimates that about one in six people worldwide feel lonely. Feeling lonely is not a weakness; it is a signal to reach out, and a phone call or a visit can help.',
      source: SRC.whoSocial },
    { id: 'fa_risk', type: 'fact', title: 'Some dementia risk factors can be changed',
      text: 'The 2024 Lancet Commission lists 14 risk factors that can be changed, including hearing loss, untreated vision loss, high blood pressure, physical inactivity, smoking and social isolation. It estimates that, across whole populations, close to half of dementia might in theory be prevented or delayed. This is about populations, not a promise for any one person.',
      source: SRC.lancet },
    { id: 'fa_hearing', type: 'fact', title: 'Look after your hearing',
      text: 'The Lancet Commission names hearing loss as one of the largest changeable risk factors for dementia. Having hearing checked, and using a hearing aid if one is advised, also makes conversation easier and more enjoyable.',
      source: SRC.lancet },
    { id: 'fa_vision', type: 'fact', title: 'Eye checks matter too',
      text: 'In 2024 the Lancet Commission added untreated vision loss in later life to its list of changeable dementia risk factors. Cataracts and many eye problems can be treated — a check-up is worthwhile.',
      source: SRC.lancet },
    { id: 'fa_india', type: 'fact', title: 'You are not alone in India',
      text: 'A 2023 national study (LASI-DAD) estimated that about 7.4% of Indians aged 60 and over — roughly 8.8 million people — live with dementia, more often women and people in rural areas. Many families are on this journey, and support exists.',
      source: SRC.lasi },
    { id: 'fa_talk_calm', type: 'fact', title: 'Speaking so it is easier to follow',
      text: 'The US National Institute on Aging suggests reducing background noise, using the person’s name, and speaking calmly in short, simple sentences — without talking down or using baby talk.',
      source: SRC.nia },
    { id: 'fa_yes_no', type: 'fact', title: 'Simple choices are kinder',
      text: 'Caregiving guidance from the National Institute on Aging suggests asking one question at a time and offering simple choices — “Would you like tea?” rather than “What would you like?”',
      source: SRC.nia },
    { id: 'fa_time', type: 'fact', title: 'Give time to answer',
      text: 'When someone is searching for a word, waiting patiently — and gently offering a word if they want help — works better than correcting them. Phrases like “Don’t you remember?” can hurt.',
      source: SRC.nia },
    { id: 'fa_feelings', type: 'fact', title: 'Feelings are heard even when words are hard',
      text: 'The National Institute on Aging advises taking a person’s concerns seriously even when their words are hard to follow. Respect, a warm tone and a gentle touch still communicate.',
      source: SRC.nia },
    { id: 'fa_decisions', type: 'fact', title: 'Choices keep dignity',
      text: 'Letting a person with memory difficulties make their own choices where they can — what to wear, what to eat, what to do today — helps them stay involved and respected.',
      source: SRC.nia },
    { id: 'fa_carer_break', type: 'fact', title: 'Caregivers need rest too',
      text: 'The National Institute on Aging encourages caregivers to take breaks, ask family and friends for help, and look after their own health. Caring for yourself is part of caring well.',
      source: SRC.niaCare },
    { id: 'fa_carer_anger', type: 'fact', title: 'It is not personal',
      text: 'Frustration or anger from someone with memory difficulties is often part of the illness, not about the caregiver. Stepping away for a few minutes to breathe is a sensible thing to do.',
      source: SRC.nia },

    /* ---------------- encouraging messages ---------------- */
    { id: 'ms_tagore', type: 'message', title: 'From Tagore',
      text: '“If you shed tears when you miss the sun, you also miss the stars.”', by: 'Rabindranath Tagore, Stray Birds (1916)',
      source: SRC.tagore },
    { id: 'ms_worth', type: 'message', title: 'You matter', text: 'Your worth does not depend on what you remember. You are valued for who you are.', by: ORIGINAL },
    { id: 'ms_small', type: 'message', title: 'Small steps count', text: 'Getting dressed, making tea, saying hello to a neighbour — everyday things are real achievements. Be proud of them.', by: ORIGINAL },
    { id: 'ms_patience', type: 'message', title: 'Be gentle with yourself', text: 'It is all right to take your time. Forgetting something does not make you less capable or less loved.', by: ORIGINAL },
    { id: 'ms_stories', type: 'message', title: 'Your stories are a gift', text: 'The stories of your life are a gift to your family. Telling one today is a lovely thing to share.', by: ORIGINAL },
    { id: 'ms_learning', type: 'message', title: 'Learning has no age limit', text: 'A new song, a new word, a new recipe — it is never too late to enjoy learning something.', by: ORIGINAL },
    { id: 'ms_today', type: 'message', title: 'Today is enough', text: 'You do not have to do everything today. One small thing you enjoy is enough.', by: ORIGINAL },
    { id: 'ms_connection', type: 'message', title: 'Someone would love to hear from you', text: 'A short call to someone you love can brighten both of your days.', by: ORIGINAL },
    { id: 'ms_choice', type: 'message', title: 'Your choices matter', text: 'You decide what feels right for you today. Your wishes are important.', by: ORIGINAL },
    { id: 'ms_hope', type: 'message', title: 'Good moments still come', text: 'Hard days happen, and so do good moments — a song you love, a warm meal, a familiar face. Notice them.', by: ORIGINAL },
    { id: 'ms_experience', type: 'message', title: 'What you know is valuable', text: 'The skills and wisdom of a lifetime are still yours. Others can learn a lot from you.', by: ORIGINAL },
    { id: 'ms_carer_thanks', type: 'message', title: 'For caregivers: thank you', text: 'Caring for someone is quiet, important work. Thank you for the patience and love you give every day.', by: ORIGINAL },
    { id: 'ms_carer_rest', type: 'message', title: 'For caregivers: rest is allowed', text: 'Taking time for yourself is not selfish. Rested carers give better care.', by: ORIGINAL },
    { id: 'ms_carer_enough', type: 'message', title: 'For caregivers: you are doing enough', text: 'There is no perfect way to care. Showing up with kindness is what matters most.', by: ORIGINAL },
    { id: 'ms_together', type: 'message', title: 'Together', text: 'Nobody has to face difficult days alone. Family, friends and your care team are here with you.', by: ORIGINAL },
    { id: 'ms_laughter', type: 'message', title: 'A smile counts', text: 'Laughing together over an old story is a wonderful way to spend a few minutes.', by: ORIGINAL }
  ];

  var TYPE_LABEL = { story: 'Real-life story', fact: 'Health & wellbeing fact', message: 'Encouraging message' };
  var ROTATION = ['story', 'fact', 'message'];

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dayNumber(iso) { return Math.floor(Date.parse(iso + 'T00:00:00Z') / 86400000); }

  var Daily = {
    ITEMS: ITEMS,
    TYPE_LABEL: TYPE_LABEL,

    byId: function (id) { return ITEMS.filter(function (i) { return i.id === id; })[0] || null; },

    seen: function (pid) {
      return S.DB.where('content_seen', function (r) { return r.patient_id === pid; })
        .sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
    },

    /**
     * The item for this patient on this day (slot 0 = the day's item; slot 1+
     * = "another one"). The day's type follows the rotation story → fact →
     * message; within a type, items never seen come first, then the
     * least-recently seen. The choice is saved, so the same day shows the same
     * item and a new day never repeats until the whole type has been shown.
     */
    forDay: function (pid, slot, dateISO) {
      pid = pid || 'device';
      slot = slot || 0;
      var date = dateISO || S.todayISO();
      var already = S.DB.where('content_seen', function (r) { return r.patient_id === pid && r.date === date && r.slot === slot; })[0];
      if (already && this.byId(already.content_id)) return this.byId(already.content_id);

      var type = ROTATION[(dayNumber(date) + slot) % ROTATION.length];
      var history = this.seen(pid);
      var lastSeen = {};
      history.forEach(function (r, i) { lastSeen[r.content_id] = i; });
      var todays = S.DB.where('content_seen', function (r) { return r.patient_id === pid && r.date === date; })
        .map(function (r) { return r.content_id; });
      var pool = ITEMS.filter(function (it) { return it.type === type && todays.indexOf(it.id) === -1; });
      if (!pool.length) pool = ITEMS.filter(function (it) { return todays.indexOf(it.id) === -1; });
      pool.sort(function (a, b) {
        var la = lastSeen.hasOwnProperty(a.id) ? lastSeen[a.id] : -1;
        var lb = lastSeen.hasOwnProperty(b.id) ? lastSeen[b.id] : -1;
        if (la !== lb) return la - lb;                      // never seen (-1) first, then oldest
        return hash(pid + a.id) - hash(pid + b.id);         // stable, per-patient order
      });
      var pick = pool[0];
      S.DB.insert('content_seen', { seen_id: S.uid('seen'), patient_id: pid, content_id: pick.id, date: date, slot: slot, at: S.stamp() }, { silent: true });
      return pick;
    },

    /** An encouraging message for Hun to say, rotating through the messages. */
    encouragement: function (pid) {
      var history = this.seen(pid || 'device');
      var lastSeen = {};
      history.forEach(function (r, i) { lastSeen[r.content_id] = i; });
      var msgs = ITEMS.filter(function (it) { return it.type === 'message'; }).sort(function (a, b) {
        var la = lastSeen.hasOwnProperty(a.id) ? lastSeen[a.id] : -1;
        var lb = lastSeen.hasOwnProperty(b.id) ? lastSeen[b.id] : -1;
        return la - lb || (hash(a.id) - hash(b.id));
      });
      var pick = msgs[0];
      S.DB.insert('content_seen', { seen_id: S.uid('seen'), patient_id: pid || 'device', content_id: pick.id, date: S.todayISO(), slot: -1, at: S.stamp() }, { silent: true });
      return { text: pick.text, by: pick.by === ORIGINAL ? '' : pick.by, id: pick.id };
    }
  };

  S.Daily = Daily;
})(window);
