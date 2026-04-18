import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'ta' | 'bn'

type I18nValue = {
  language: Language
  setLanguage: (language: Language) => void
  copy: TranslationCopy
}

const STORAGE_KEY = 'mytracker-language'

const translations = {
  en: {
    nav: {
      brand: 'Expense Autopsy',
      brandAria: 'Expense Autopsy home',
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      simulator: 'Simulator',
      goals: 'Goals',
      profile: 'Profile',
      languageLabel: 'Language',
      languageNames: {
        en: 'English',
        hi: 'Hindi',
        ta: 'Tamil',
        bn: 'Bengali',
      },
    },
    app: {
      loadingEyebrow: 'Loading profile',
      loadingTitle: 'Fetching your saved data from MongoDB',
      loadingCopy: 'Hang tight while we restore your profile, expenses, goals, and SIP state.',
      errorEyebrow: 'Startup error',
      errorTitle: 'We could not load your saved profile',
    },
    landing: {
      heroPill: 'Automated money intelligence',
      heroTitle: 'Spot leaks. Stop wasting. Build wealth.',
      heroCopy:
        'We turn bad spending habits into clear financial warnings so you can redirect your money and watch it grow.',
      primaryCta: 'Start Saving',
      secondaryCta: 'View Dashboard',
      liveBleedTitle: 'Live money bleeding',
      liveBleedPill: 'Running now',
      liveBleedCopy: 'per second from avoidable and impulse habits',
      askLabel: 'Ask AI-style what if',
      askPrompt: 'What if I stop ordering Swiggy twice a week?',
      trustStrip: [
        'Built for students',
        'young professionals',
        'first-time investors',
        'wealth builders',
        'privacy-first',
      ],
      bentoEyebrow: 'Bento overview',
      bentoTitle: 'Spot leaks. Simulate outcomes. Prove the upside.',
      bentoDescription: 'Categorize spending, redirect waste, and start investing.',
      bentoItems: [
        ['Live bleed ticker', 'Per-second updates tied to avoidable habits'],
        ['Classification engine', 'Essential, avoidable, or impulse in one dropdown'],
        ['Future cost', 'See the 10-year price tag of today\'s behavior'],
        ['What-if simulator', 'Type a sentence and recalculate instantly'],
        ['SIP redirection', 'Send leakage straight into compounding'],
        ['Financial health', 'A score that moves as habits improve'],
        ['Goals tracking', 'Priority, deadline, and monthly savings'],
        ['Scenario comparison', 'Run side-by-side habit outcomes'],
      ],
      howEyebrow: 'How it works',
      howTitle: 'Four simple steps.',
      howDescription: 'Get running in seconds. Turn raw data into financial goals.',
      howSteps: [
        ['Add profile and salary', 'Set name, PIN, income, and starting savings.'],
        ['Tag expenses', 'Drop every recurring habit into a clear expense class.'],
        ['Explore what-ifs', 'Use natural-language prompts to test one habit change.'],
        ['Redirect the leak', 'Move wasted money into SIPs and goals instantly.'],
      ],
      previewEyebrow: 'Product preview',
      previewTitle: 'Track, simulate, and grow your wealth in one place.',
      previewPanels: ['Dashboard', 'Expenses', 'Simulator', 'Insights'],
      metricsEyebrow: 'Outcome',
      metricsTitle: 'Real metrics in seconds.',
      metricsLabels: {
        savedFromLeaks: 'Saved from leaks',
        leakCost: '10-year leak cost',
        corpusGain: 'Corpus gain from starting now',
        healthScore: 'Health score improvement',
        avoidableShare: 'Avoidable spend reduced',
      },
      metricsNotes: {
        savedFromLeaks: 'annualized from current behavior',
        leakCost: 'cost of doing nothing',
        corpusGain: '10-year compounding',
        healthScore: 'classified as',
        avoidableShare: 'share of monthly outflow',
      },
      personasEyebrow: 'Personas',
      personasTitle: 'Personalized spending insights.',
      personasPill: 'Insight',
      personas: [
        { title: 'Impulse spender', copy: 'Avoidable spend above 30% of salary.' },
        { title: 'SIP neglector', copy: 'No monthly investment set yet.' },
        { title: 'Disciplined saver', copy: 'Goals are on track and waste is low.' },
        { title: 'Subscription hoarder', copy: 'Too many recurring services in the stack.' },
      ],
      testimonialsEyebrow: 'Testimonials',
      testimonialsTitle: 'Trusted by smart spenders.',
      testimonials: [
        [
          'The live bleed ticker immediately helped me spot where my salary was disappearing.',
          'Priya, Software Engineer',
        ],
        [
          'The what-if simulator felt like magic. I finally see how small choices compound.',
          'Kabir, Marketing Director',
        ],
        [
          'Expense Autopsy transformed my finances from overwhelming to completely managed.',
          'Meera, First-time Investor',
        ],
      ],
      pricingEyebrow: 'Pricing Plans',
      pricingTitle: 'Simple pricing that grows with you.',
      pricingDescription: 'Clear and honest plans.',
      pricingChoose: 'Choose plan',
      pricingPlans: [
        ['Basic', 'Free', ['Expense tracking', 'Basic analytics', 'Goal setting']],
        ['Pro', '499', ['What-if simulator', 'Custom scenarios', 'Priority goal tracking']],
        ['Premium', '999', ['Advanced routing', 'AI Insights', '1-on-1 advisor logic']],
      ],
      faqEyebrow: 'FAQ',
      faqTitle: 'Frequently Asked Questions.',
      faqItems: [
        [
          'How is leakage calculated?',
          'We sum avoidable and impulse expenses, convert to monthly equivalents, and project the future cost with a compound-growth formula.',
        ],
        [
          'Does data stay local?',
          'Yes. Your financial workspace stays tied to your saved app session and is not shared publicly.',
        ],
        [
          'How does the what-if input work?',
          'A lightweight parser matches a few common commands like stop, add SIP, or delay SIP.',
        ],
        [
          'Is this beginner-friendly?',
          'Very. The onboarding keeps the first session to profile, expenses, goals, and one SIP decision.',
        ],
        [
          'How are SIP projections estimated?',
          'They use standard monthly compounding with a configurable annual return rate.',
        ],
      ],
      finalEyebrow: 'Get Started Today',
      finalTitle: 'Start saving today.',
      finalCopy: 'Spot leaks, run what-ifs, and grow your money instantly.',
      finalPrimary: 'Start your expense autopsy',
      finalSecondary: 'Jump to dashboard',
      previewTicker: '0.023 / sec',
    },
  },
  hi: {
    nav: {
      brand: 'Expense Autopsy',
      brandAria: 'Expense Autopsy home',
      dashboard: 'डैशबोर्ड',
      expenses: 'खर्चे',
      simulator: 'सिम्युलेटर',
      goals: 'लक्ष्य',
      profile: 'प्रोफाइल',
      languageLabel: 'भाषा',
      languageNames: {
        en: 'English',
        hi: 'हिन्दी',
        ta: 'தமிழ்',
        bn: 'বাংলা',
      },
    },
    app: {
      loadingEyebrow: 'प्रोफाइल लोड हो रही है',
      loadingTitle: 'MongoDB से आपका सेव किया हुआ डेटा लाया जा रहा है',
      loadingCopy: 'थोड़ा इंतज़ार करें, हम आपकी प्रोफाइल, खर्चे, लक्ष्य और SIP स्थिति बहाल कर रहे हैं।',
      errorEyebrow: 'स्टार्टअप त्रुटि',
      errorTitle: 'हम आपकी सेव की हुई प्रोफाइल लोड नहीं कर पाए',
    },
    landing: {
      heroPill: 'ऑटोमेटेड मनी इंटेलिजेंस',
      heroTitle: 'लीक पकड़ो। फिजूलखर्ची रोको। धन बनाओ।',
      heroCopy:
        'हम खराब खर्च आदतों को साफ वित्तीय चेतावनियों में बदलते हैं ताकि आप अपना पैसा सही दिशा में मोड़कर उसे बढ़ते हुए देख सकें।',
      primaryCta: 'बचत शुरू करें',
      secondaryCta: 'डैशबोर्ड देखें',
      liveBleedTitle: 'लाइव पैसा लीक',
      liveBleedPill: 'अभी चल रहा है',
      liveBleedCopy: 'हर सेकंड, avoidable और impulse आदतों से',
      askLabel: 'AI-स्टाइल क्या हो अगर पूछें',
      askPrompt: 'अगर मैं हफ्ते में दो बार Swiggy बंद कर दूँ तो?',
      trustStrip: [
        'स्टूडेंट्स के लिए',
        'यंग प्रोफेशनल्स',
        'पहली बार निवेश करने वालों के लिए',
        'वेल्थ बिल्डर्स',
        'प्राइवेसी-फर्स्ट',
      ],
      bentoEyebrow: 'ओवरव्यू',
      bentoTitle: 'लीक पकड़ो। नतीजे सिम्युलेट करो। फायदा साबित करो।',
      bentoDescription: 'खर्चों को वर्गीकृत करें, फिजूलखर्ची घटाएँ, और निवेश शुरू करें।',
      bentoItems: [
        ['लाइव ब्लीड टिकर', 'फिजूल आदतों से जुड़ा प्रति-सेकंड अपडेट'],
        ['क्लासिफिकेशन इंजन', 'Essential, avoidable या impulse एक ड्रॉपडाउन में'],
        ['भविष्य की लागत', 'आज की आदत की 10 साल की कीमत देखें'],
        ['व्हाट-इफ सिम्युलेटर', 'एक वाक्य लिखें और तुरंत नया परिणाम देखें'],
        ['SIP रीडायरेक्शन', 'लीक को सीधे compounding में भेजें'],
        ['फाइनेंशियल हेल्थ', 'आदत सुधरते ही स्कोर बदलता है'],
        ['गोल ट्रैकिंग', 'प्राथमिकता, समयसीमा और मासिक बचत'],
        ['सीनारियो तुलना', 'दो आदतों के परिणाम साथ में देखें'],
      ],
      howEyebrow: 'कैसे काम करता है',
      howTitle: 'चार आसान कदम।',
      howDescription: 'सेकंडों में शुरू करें। रॉ डेटा को वित्तीय लक्ष्यों में बदलें।',
      howSteps: [
        ['प्रोफाइल और सैलरी जोड़ें', 'नाम, PIN, आय और शुरुआती बचत सेट करें।'],
        ['खर्च टैग करें', 'हर recurring आदत को सही category में डालें।'],
        ['व्हाट-इफ देखें', 'एक आदत बदलने का असर natural language से टेस्ट करें।'],
        ['लीक को मोड़ें', 'फिजूल खर्च को तुरंत SIP और goals में भेजें।'],
      ],
      previewEyebrow: 'प्रोडक्ट प्रीव्यू',
      previewTitle: 'एक ही जगह पर ट्रैक करें, सिम्युलेट करें और संपत्ति बढ़ाएँ।',
      previewPanels: ['डैशबोर्ड', 'खर्चे', 'सिम्युलेटर', 'इनसाइट्स'],
      metricsEyebrow: 'नतीजा',
      metricsTitle: 'सेकंडों में असली मेट्रिक्स।',
      metricsLabels: {
        savedFromLeaks: 'लीक से बचत',
        leakCost: '10 साल की लीक लागत',
        corpusGain: 'आज शुरू करने से corpus gain',
        healthScore: 'हेल्थ स्कोर सुधार',
        avoidableShare: 'घटा हुआ avoidable खर्च',
      },
      metricsNotes: {
        savedFromLeaks: 'मौजूदा आदतों से annualized',
        leakCost: 'कुछ न बदलने की कीमत',
        corpusGain: '10 साल की compounding',
        healthScore: 'वर्गीकृत है',
        avoidableShare: 'मासिक outflow का हिस्सा',
      },
      personasEyebrow: 'पर्सोना',
      personasTitle: 'पर्सनलाइज़्ड खर्च इनसाइट्स।',
      personasPill: 'इनसाइट',
      personas: [
        { title: 'Impulse spender', copy: 'Avoidable खर्च salary के 30% से ऊपर है।' },
        { title: 'SIP neglector', copy: 'अभी तक मासिक निवेश सेट नहीं है।' },
        { title: 'Disciplined saver', copy: 'Goals ट्रैक पर हैं और waste कम है।' },
        { title: 'Subscription hoarder', copy: 'बहुत सारी recurring services चल रही हैं।' },
      ],
      testimonialsEyebrow: 'टेस्टिमोनियल्स',
      testimonialsTitle: 'स्मार्ट spenders का भरोसा।',
      testimonials: [
        [
          'लाइव bleed ticker ने तुरंत दिखा दिया कि मेरी salary कहाँ गायब हो रही थी।',
          'प्रिया, सॉफ्टवेयर इंजीनियर',
        ],
        [
          'What-if simulator जादू जैसा लगा। अब समझ आता है कि छोटी choices कैसे compound करती हैं।',
          'कबीर, मार्केटिंग डायरेक्टर',
        ],
        [
          'Expense Autopsy ने मेरी finances को भारी लगने वाली चीज़ से manageable बना दिया।',
          'मीरा, पहली बार निवेशक',
        ],
      ],
      pricingEyebrow: 'प्राइसिंग प्लान',
      pricingTitle: 'सरल प्राइसिंग जो आपके साथ बढ़ती है।',
      pricingDescription: 'सीधी और ईमानदार योजनाएँ।',
      pricingChoose: 'प्लान चुनें',
      pricingPlans: [
        ['Basic', 'Free', ['Expense tracking', 'Basic analytics', 'Goal setting']],
        ['Pro', '499', ['What-if simulator', 'Custom scenarios', 'Priority goal tracking']],
        ['Premium', '999', ['Advanced routing', 'AI Insights', '1-on-1 advisor logic']],
      ],
      faqEyebrow: 'सवाल-जवाब',
      faqTitle: 'अक्सर पूछे जाने वाले सवाल।',
      faqItems: [
        [
          'Leakage कैसे calculate होती है?',
          'हम avoidable और impulse खर्च जोड़ते हैं, उन्हें monthly equivalent में बदलते हैं और compound-growth formula से future cost निकालते हैं।',
        ],
        [
          'क्या डेटा local रहता है?',
          'हाँ। आपका financial workspace आपकी saved app session से जुड़ा रहता है और सार्वजनिक रूप से साझा नहीं होता।',
        ],
        [
          'What-if input कैसे काम करता है?',
          'एक lightweight parser stop, add SIP या delay SIP जैसी common commands पहचानता है।',
        ],
        [
          'क्या यह beginners के लिए आसान है?',
          'बहुत। Onboarding पहले session को profile, expenses, goals और एक SIP decision तक सीमित रखता है।',
        ],
        [
          'SIP projections कैसे estimate होती हैं?',
          'यह configurable annual return rate के साथ standard monthly compounding का उपयोग करती हैं।',
        ],
      ],
      finalEyebrow: 'आज ही शुरू करें',
      finalTitle: 'आज से बचत शुरू करें।',
      finalCopy: 'लीक पकड़ें, what-if चलाएँ और अपना पैसा बढ़ते देखें।',
      finalPrimary: 'अपना expense autopsy शुरू करें',
      finalSecondary: 'डैशबोर्ड पर जाएँ',
      previewTicker: '0.023 / sec',
    },
  },
  ta: {
    nav: {
      brand: 'Expense Autopsy',
      brandAria: 'Expense Autopsy home',
      dashboard: 'டாஷ்போர்டு',
      expenses: 'செலவுகள்',
      simulator: 'சிமுலேட்டர்',
      goals: 'இலக்குகள்',
      profile: 'சுயவிவரம்',
      languageLabel: 'மொழி',
      languageNames: {
        en: 'English',
        hi: 'हिन्दी',
        ta: 'தமிழ்',
        bn: 'বাংলা',
      },
    },
    app: {
      loadingEyebrow: 'சுயவிவரம் ஏற்றப்படுகிறது',
      loadingTitle: 'MongoDB இலிருந்து உங்கள் சேமித்த தரவு எடுக்கப்படுகிறது',
      loadingCopy: 'உங்கள் சுயவிவரம், செலவுகள், இலக்குகள், SIP நிலை ஆகியவற்றை மீட்டெடுக்கிறோம்.',
      errorEyebrow: 'தொடக்கப் பிழை',
      errorTitle: 'உங்கள் சேமித்த சுயவிவரத்தை ஏற்ற முடியவில்லை',
    },
    landing: {
      heroPill: 'தானியங்கி பண நுண்ணறிவு',
      heroTitle: 'சிலைவுகளை கண்டுபிடி. வீணை நிறுத்து. செல்வம் உருவாக்கு.',
      heroCopy:
        'தவறான செலவு பழக்கங்களை தெளிவான நிதி எச்சரிக்கைகளாக மாற்றி, உங்கள் பணத்தை சரியான திசைக்கு திருப்ப உதவுகிறோம்.',
      primaryCta: 'சேமிப்பை தொடங்கு',
      secondaryCta: 'டாஷ்போர்டை பார்',
      liveBleedTitle: 'நேரடி பண சுரிவு',
      liveBleedPill: 'இப்போது நடக்கிறது',
      liveBleedCopy: 'avoidable மற்றும் impulse பழக்கங்களால் ஒவ்வொரு விநாடியும்',
      askLabel: 'AI-style என்ன ஆகும் என்று கேள்',
      askPrompt: 'நான் வாரத்தில் இரு முறை Swiggy நிறுத்தினால்?',
      trustStrip: [
        'மாணவர்களுக்கு',
        'இளம் தொழில்முனைவோருக்கு',
        'முதல் முதலீட்டாளர்களுக்கு',
        'செல்வம் உருவாக்குவோருக்கு',
        'privacy-first',
      ],
      bentoEyebrow: 'மேலோட்டம்',
      bentoTitle: 'சிலைவுகளை கண்டுபிடி. முடிவுகளை சிமுலேட் செய். பலனை நிரூபி.',
      bentoDescription: 'செலவுகளை வகைப்படுத்தி, வீணை குறைத்து, முதலீட்டை தொடங்கு.',
      bentoItems: [
        ['நேரடி bleed ticker', 'வீணான பழக்கங்களுக்கு விநாடி தோறும் update'],
        ['வகைப்படுத்தும் இயந்திரம்', 'Essential, avoidable, impulse ஒன்றே dropdown-ல்'],
        ['எதிர்கால செலவு', 'இன்றைய பழக்கத்தின் 10 ஆண்டு விலையை பாருங்கள்'],
        ['What-if simulator', 'ஒரு வாக்கியம் தட்டச்சு செய்து உடனே மாற்றத்தை பாருங்கள்'],
        ['SIP redirection', 'சுரிவை compounding-க்கு மாற்றுங்கள்'],
        ['நிதி ஆரோக்கியம்', 'பழக்கம் மேம்பட்டால் score மாறும்'],
        ['Goal tracking', 'முன்னுரிமை, deadline, மாதச் சேமிப்பு'],
        ['Scenario comparison', 'இரண்டு பழக்க முடிவுகளை பக்கப்பக்கமாக பாருங்கள்'],
      ],
      howEyebrow: 'இது எப்படி வேலை செய்கிறது',
      howTitle: 'நான்கு எளிய படிகள்.',
      howDescription: 'சில விநாடிகளில் தொடங்குங்கள். raw data-ஐ நிதி இலக்குகளாக மாற்றுங்கள்.',
      howSteps: [
        ['சுயவிவரம் மற்றும் சம்பளம் சேர்க்கவும்', 'பெயர், PIN, வருமானம், தொடக்கச் சேமிப்பு அமைக்கவும்.'],
        ['செலவுகளை tag செய்யவும்', 'ஒவ்வொரு recurring பழக்கத்தையும் சரியான category-யில் இடவும்.'],
        ['What-ifs ஆராயவும்', 'ஒரு பழக்க மாற்றத்தின் தாக்கத்தை natural language மூலம் சோதிக்கவும்.'],
        ['சுரிவை மாற்றவும்', 'வீணாகும் பணத்தை SIP மற்றும் goals-க்கு மாற்றவும்.'],
      ],
      previewEyebrow: 'பொருள் முன்னோட்டம்',
      previewTitle: 'ஒரே இடத்தில் track, simulate, grow.',
      previewPanels: ['டாஷ்போர்டு', 'செலவுகள்', 'சிமுலேட்டர்', 'இன்சைட்ஸ்'],
      metricsEyebrow: 'விளைவு',
      metricsTitle: 'விநாடிகளில் உண்மையான அளவைகள்.',
      metricsLabels: {
        savedFromLeaks: 'சுரிவில் இருந்து சேமிப்பு',
        leakCost: '10 ஆண்டு சுரிவு செலவு',
        corpusGain: 'இப்போது தொடங்குவதன் corpus gain',
        healthScore: 'ஆரோக்கிய score மேம்பாடு',
        avoidableShare: 'குறைக்கப்பட்ட avoidable செலவு',
      },
      metricsNotes: {
        savedFromLeaks: 'தற்போதைய பழக்கத்தின் annualized மதிப்பு',
        leakCost: 'எதையும் மாற்றாததின் விலை',
        corpusGain: '10 ஆண்டு compounding',
        healthScore: 'இவ்வாறு வகைப்படுத்தப்பட்டது',
        avoidableShare: 'மாதாந்திர outflow-இன் பங்கு',
      },
      personasEyebrow: 'பயனர் வகைகள்',
      personasTitle: 'தனிப்பயன் செலவு insights.',
      personasPill: 'Insight',
      personas: [
        { title: 'Impulse spender', copy: 'Avoidable செலவு சம்பளத்தின் 30% ஐ கடந்துள்ளது.' },
        { title: 'SIP neglector', copy: 'மாதாந்திர முதலீடு இன்னும் அமைக்கப்படவில்லை.' },
        { title: 'Disciplined saver', copy: 'Goals பாதையில் உள்ளன, வீணாகும் செலவு குறைவு.' },
        { title: 'Subscription hoarder', copy: 'மிக அதிக recurring services இயங்குகின்றன.' },
      ],
      testimonialsEyebrow: 'பாராட்டுகள்',
      testimonialsTitle: 'சிந்தித்து செலவிடுவோரின் நம்பிக்கை.',
      testimonials: [
        [
          'Live bleed ticker என் சம்பளம் எங்கே மறைந்து கொண்டிருந்தது என்பதை உடனே காட்டியது.',
          'ப்ரியா, மென்பொருள் பொறியாளர்',
        ],
        [
          'What-if simulator மாயம் போல இருந்தது. சிறிய முடிவுகள் எப்படி பெருகுகின்றன என்று இப்போது புரிகிறது.',
          'கபீர், மார்க்கெட்டிங் டைரக்டர்',
        ],
        [
          'Expense Autopsy என் finances-ஐ குழப்பத்திலிருந்து கட்டுப்பாட்டுக்குள் கொண்டு வந்தது.',
          'மீரா, முதல் முதலீட்டாளர்',
        ],
      ],
      pricingEyebrow: 'விலை திட்டங்கள்',
      pricingTitle: 'உங்களுடன் வளரும் எளிய விலை அமைப்பு.',
      pricingDescription: 'தெளிவான மற்றும் நேர்மையான திட்டங்கள்.',
      pricingChoose: 'திட்டத்தை தேர்வு செய்',
      pricingPlans: [
        ['Basic', 'Free', ['Expense tracking', 'Basic analytics', 'Goal setting']],
        ['Pro', '499', ['What-if simulator', 'Custom scenarios', 'Priority goal tracking']],
        ['Premium', '999', ['Advanced routing', 'AI Insights', '1-on-1 advisor logic']],
      ],
      faqEyebrow: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
      faqTitle: 'அடிக்கடி கேட்கப்படும் கேள்விகள்.',
      faqItems: [
        [
          'Leakage எப்படி கணக்கிடப்படுகிறது?',
          'Avoidable மற்றும் impulse செலவுகளை சேர்த்து monthly equivalent ஆக மாற்றி, compound-growth formula மூலம் future cost கணக்கிடுகிறோம்.',
        ],
        [
          'தரவு local ஆகவே இருக்கிறதா?',
          'ஆம். உங்கள் financial workspace உங்கள் saved app session-க்கு இணைந்தே இருக்கும்; அது public ஆக பகிரப்படாது.',
        ],
        [
          'What-if input எப்படி வேலை செய்கிறது?',
          'Stop, add SIP, delay SIP போன்ற commands-ஐ ஒரு lightweight parser கண்டறிகிறது.',
        ],
        [
          'புதியவர்களுக்கு இது எளிதா?',
          'மிகவும். முதல் session-ஐ profile, expenses, goals, SIP decision வரை மட்டுப்படுத்துகிறது.',
        ],
        [
          'SIP projections எப்படி கணக்கிடப்படுகின்றன?',
          'Configurable annual return rate உடன் standard monthly compounding பயன்படுத்தப்படுகிறது.',
        ],
      ],
      finalEyebrow: 'இன்றே தொடங்குங்கள்',
      finalTitle: 'இன்றே சேமிக்க தொடங்குங்கள்.',
      finalCopy: 'சுரிவைக் கண்டுபிடித்து, what-if ஓட்டி, உங்கள் பணத்தை வளர்த்துக் கொள்ளுங்கள்.',
      finalPrimary: 'உங்கள் expense autopsy-ஐ தொடங்கு',
      finalSecondary: 'டாஷ்போர்டுக்கு செல்லுங்கள்',
      previewTicker: '0.023 / sec',
    },
  },
  bn: {
    nav: {
      brand: 'Expense Autopsy',
      brandAria: 'Expense Autopsy home',
      dashboard: 'ড্যাশবোর্ড',
      expenses: 'খরচ',
      simulator: 'সিমুলেটর',
      goals: 'লক্ষ্য',
      profile: 'প্রোফাইল',
      languageLabel: 'ভাষা',
      languageNames: {
        en: 'English',
        hi: 'हिन्दी',
        ta: 'தமிழ்',
        bn: 'বাংলা',
      },
    },
    app: {
      loadingEyebrow: 'প্রোফাইল লোড হচ্ছে',
      loadingTitle: 'MongoDB থেকে আপনার সংরক্ষিত ডেটা আনা হচ্ছে',
      loadingCopy: 'অপেক্ষা করুন, আমরা আপনার প্রোফাইল, খরচ, লক্ষ্য আর SIP অবস্থা ফিরিয়ে আনছি।',
      errorEyebrow: 'স্টার্টআপ ত্রুটি',
      errorTitle: 'আপনার সংরক্ষিত প্রোফাইল লোড করা যায়নি',
    },
    landing: {
      heroPill: 'স্বয়ংক্রিয় মানি ইন্টেলিজেন্স',
      heroTitle: 'লিক ধরুন। অপচয় থামান। সম্পদ গড়ুন।',
      heroCopy:
        'আমরা খারাপ খরচের অভ্যাসকে পরিষ্কার আর্থিক সতর্কতায় বদলে দিই যাতে আপনি টাকা সঠিক দিকে ঘুরিয়ে তা বাড়তে দেখতে পারেন।',
      primaryCta: 'সেভিংস শুরু করুন',
      secondaryCta: 'ড্যাশবোর্ড দেখুন',
      liveBleedTitle: 'লাইভ টাকা লিক',
      liveBleedPill: 'এখন চলছে',
      liveBleedCopy: 'avoidable আর impulse অভ্যাস থেকে প্রতি সেকেন্ডে',
      askLabel: 'AI-style what if জিজ্ঞেস করুন',
      askPrompt: 'আমি যদি সপ্তাহে দুইবার Swiggy অর্ডার বন্ধ করি?',
      trustStrip: [
        'ছাত্রদের জন্য',
        'যুব পেশাজীবীদের জন্য',
        'প্রথমবার বিনিয়োগকারীদের জন্য',
        'wealth builders',
        'privacy-first',
      ],
      bentoEyebrow: 'ওভারভিউ',
      bentoTitle: 'লিক ধরুন। ফল সিমুলেট করুন। লাভ প্রমাণ করুন।',
      bentoDescription: 'খরচ শ্রেণিবদ্ধ করুন, অপচয় কমান, আর বিনিয়োগ শুরু করুন।',
      bentoItems: [
        ['লাইভ bleed ticker', 'অপচয়ী অভ্যাসের সাথে যুক্ত per-second update'],
        ['Classification engine', 'Essential, avoidable বা impulse এক dropdown-এ'],
        ['Future cost', 'আজকের অভ্যাসের ১০ বছরের দাম দেখুন'],
        ['What-if simulator', 'একটি বাক্য লিখুন, সঙ্গে সঙ্গে নতুন হিসাব দেখুন'],
        ['SIP redirection', 'লিক সরাসরি compounding-এ পাঠান'],
        ['Financial health', 'অভ্যাস ভালো হলে score নড়ে'],
        ['Goal tracking', 'Priority, deadline আর monthly savings'],
        ['Scenario comparison', 'দুইটি অভ্যাসের ফল পাশাপাশি দেখুন'],
      ],
      howEyebrow: 'কীভাবে কাজ করে',
      howTitle: 'চারটি সহজ ধাপ।',
      howDescription: 'কয়েক সেকেন্ডে শুরু করুন। raw data-কে financial goals-এ বদলান।',
      howSteps: [
        ['প্রোফাইল আর স্যালারি যোগ করুন', 'নাম, PIN, আয় আর শুরুর সেভিংস সেট করুন।'],
        ['খরচ ট্যাগ করুন', 'প্রতিটি recurring অভ্যাসকে সঠিক category-তে দিন।'],
        ['What-if দেখুন', 'একটি অভ্যাস বদলালে কী হয় natural language-এ দেখুন।'],
        ['লিক ঘুরিয়ে দিন', 'অপচয় হওয়া টাকা SIP আর goals-এ দিন।'],
      ],
      previewEyebrow: 'প্রোডাক্ট প্রিভিউ',
      previewTitle: 'এক জায়গায় track, simulate, আর grow করুন।',
      previewPanels: ['ড্যাশবোর্ড', 'খরচ', 'সিমুলেটর', 'ইনসাইটস'],
      metricsEyebrow: 'ফলাফল',
      metricsTitle: 'সেকেন্ডের মধ্যে বাস্তব মেট্রিক্স।',
      metricsLabels: {
        savedFromLeaks: 'লিক থেকে সেভিংস',
        leakCost: '১০ বছরের লিক খরচ',
        corpusGain: 'এখন শুরু করলে corpus gain',
        healthScore: 'হেলথ স্কোর উন্নতি',
        avoidableShare: 'কমেছে avoidable খরচ',
      },
      metricsNotes: {
        savedFromLeaks: 'বর্তমান অভ্যাস থেকে annualized',
        leakCost: 'কিছু না বদলানোর মূল্য',
        corpusGain: '১০ বছরের compounding',
        healthScore: 'classify করা হয়েছে',
        avoidableShare: 'monthly outflow-এর অংশ',
      },
      personasEyebrow: 'পারসোনা',
      personasTitle: 'ব্যক্তিগতকৃত spending insights.',
      personasPill: 'Insight',
      personas: [
        { title: 'Impulse spender', copy: 'Avoidable খরচ স্যালারির ৩০% এর বেশি।' },
        { title: 'SIP neglector', copy: 'এখনও মাসিক বিনিয়োগ সেট করা হয়নি।' },
        { title: 'Disciplined saver', copy: 'Goals track-এ আছে, waste কম।' },
        { title: 'Subscription hoarder', copy: 'খুব বেশি recurring services চলছে।' },
      ],
      testimonialsEyebrow: 'টেস্টিমোনিয়াল',
      testimonialsTitle: 'স্মার্ট spenders-এর বিশ্বাস।',
      testimonials: [
        [
          'লাইভ bleed ticker আমাকে সঙ্গে সঙ্গে দেখিয়েছে কোথায় আমার salary হারিয়ে যাচ্ছিল।',
          'প্রিয়া, সফটওয়্যার ইঞ্জিনিয়ার',
        ],
        [
          'What-if simulator যেন ম্যাজিক। ছোট সিদ্ধান্ত কীভাবে compound করে এখন বুঝি।',
          'কবীর, মার্কেটিং ডিরেক্টর',
        ],
        [
          'Expense Autopsy আমার finances-কে overwhelming থেকে manageable করে দিয়েছে।',
          'মীরা, প্রথমবার বিনিয়োগকারী',
        ],
      ],
      pricingEyebrow: 'প্রাইসিং প্ল্যান',
      pricingTitle: 'সহজ প্রাইসিং যা আপনার সাথে বাড়ে।',
      pricingDescription: 'স্পষ্ট আর সৎ প্ল্যান।',
      pricingChoose: 'প্ল্যান বেছে নিন',
      pricingPlans: [
        ['Basic', 'Free', ['Expense tracking', 'Basic analytics', 'Goal setting']],
        ['Pro', '499', ['What-if simulator', 'Custom scenarios', 'Priority goal tracking']],
        ['Premium', '999', ['Advanced routing', 'AI Insights', '1-on-1 advisor logic']],
      ],
      faqEyebrow: 'FAQ',
      faqTitle: 'প্রায় জিজ্ঞাসিত প্রশ্ন।',
      faqItems: [
        [
          'Leakage কীভাবে হিসাব করা হয়?',
          'Avoidable আর impulse খরচ যোগ করে monthly equivalent-এ বদলে compound-growth formula দিয়ে future cost বের করি।',
        ],
        [
          'ডেটা কি local থাকে?',
          'হ্যাঁ। আপনার financial workspace আপনার saved app session-এর সাথে যুক্ত থাকে, public ভাবে share হয় না।',
        ],
        [
          'What-if input কীভাবে কাজ করে?',
          'একটি lightweight parser stop, add SIP বা delay SIP-এর মতো common commands ধরে।',
        ],
        [
          'Beginners-এর জন্য কি সহজ?',
          'খুবই সহজ। Onboarding প্রথম session-কে profile, expenses, goals আর এক SIP decision-এ সীমাবদ্ধ রাখে।',
        ],
        [
          'SIP projection কীভাবে estimate করা হয়?',
          'Configurable annual return rate সহ standard monthly compounding ব্যবহার করা হয়।',
        ],
      ],
      finalEyebrow: 'আজই শুরু করুন',
      finalTitle: 'আজ থেকেই সেভিংস শুরু করুন।',
      finalCopy: 'লিক ধরুন, what-if চালান, আর আপনার টাকা বাড়তে দেখুন।',
      finalPrimary: 'আপনার expense autopsy শুরু করুন',
      finalSecondary: 'ড্যাশবোর্ডে যান',
      previewTicker: '0.023 / sec',
    },
  },
} as const

type TranslationCopy = (typeof translations)[Language]

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'hi' || stored === 'ta' || stored === 'bn' || stored === 'en') {
      return stored
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      copy: translations[language],
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
