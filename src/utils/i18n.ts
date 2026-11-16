import type { Language } from '../types/studio';

export const COPY: Record<
  Language,
  {
    brand: string;
    navSetup: string;
    navStoryboard: string;
    navProduction: string;
    primaryBuildBtn: string;
    primaryExportBtn: string;
    heroTitle: string;
    heroSubtitle: string;
    audioPanelTitle: string;
    modeTopicTab: string;
    modeAudioTab: string;
    topicLabel: string;
    topicPlaceholder: string;
    generateFromTopicBtn: string;
    generatingFromTopic: string;
    dropAudioTitle: string;
    dropAudioHint: string;
    recordMic: string;
    stopMic: string;
    loadSampleFa: string;
    loadSampleEn: string;
    analyzeWithAi: string;
    analyzingAudio: string;
    autoEditNote: string;
    characterPanelTitle: string;
    styleModeLabel: string;
    outfitLabel: string;
    outfitColorLabel: string;
    accentColorLabel: string;
    headwearLabel: string;
    eyewearLabel: string;
    themeLabel: string;
    customNotesLabel: string;
    customNotesPlaceholder: string;
    lineWeightLabel: string;
    goToStoryboard: string;
    storyboardTitle: string;
    storyboardSubtitle: string;
    addScene: string;
    buildAllConcurrent: string;
    buildingConcurrent: string;
    editTranscript: string;
    narrationLabel: string;
    headlineLabel: string;
    highlightWordLabel: string;
    thoughtBubbleLabel: string;
    durationLabel: string;
    poseLabel: string;
    emotionLabel: string;
    cameraLabel: string;
    transitionLabel: string;
    motionGraphicLabel: string;
    propLabel: string;
    outfitOverrideLabel: string;
    inheritOutfit: string;
    regenerateArt: string;
    deleteScene: string;
    liveProductionTitle: string;
    liveProductionSubtitle: string;
    playVideo: string;
    pauseVideo: string;
    restartVideo: string;
    exportVideoBtn: string;
    exportingProgress: string;
    downloadReadyBtn: string;
    concurrentGridTitle: string;
    cutsPerMin: string;
    totalDurationLabel: string;
    scenesLabel: string;
    progressLabel: string;
    noAudioWarning: string;
    noTopicWarning: string;
  }
> = {
  fa: {
    brand: 'UpVid Studio',
    navSetup: '۱. موضوع / صدا و کاراکتر',
    navStoryboard: '۲. بازبینی صحنه‌ها',
    navProduction: '۳. تولید خودکار و خروجی',
    primaryBuildBtn: 'ساخت خودکار ویدیو',
    primaryExportBtn: 'دانلود ویدیو نهایی',
    heroTitle: 'ساخت کاملاً خودکار ویدیو استیک‌من کمیک یوتیوبی با هوش مصنوعی',
    heroSubtitle:
      'فقط موضوع ویدیو رو بنویس یا ویس خودت رو بفرست؛ استودیو به صورت خودکار سناریو با هوک و مینی‌هوک‌های حرفه‌ای می‌نویسد، کاراکتر کمیک را می‌سازد و با موشن‌گرافیک و تدوین سریع تحویل می‌دهد.',
    audioPanelTitle: 'تولید از موضوع یا ورودی صدا (تدوین خودکار)',
    modeTopicTab: 'فقط موضوع بده (بدون ویس)',
    modeAudioTab: 'ارسال یا ضبط ویس',
    topicLabel: 'موضوع ویدیوی یوتیوب شما چیه؟',
    topicPlaceholder:
      'مثلاً: چرا ۹۰ درصد آدم‌ها ساعت ۳ نصف شب بدون دلیل بیدار میشن؟ (هوک مرموز + پایان‌بندی جذاب)',
    generateFromTopicBtn: 'نگارش سناریو + ساخت صدا + تدوین خودکار ویدیو',
    generatingFromTopic: 'در حال نگارش سناریو، ضبط نریشن و تدوین خودکار...',
    dropAudioTitle: 'فایل صوتی را بکشید یا انتخاب کنید',
    dropAudioHint: 'پشتیبانی از MP3, WAV, M4A, OGG, WEBM',
    recordMic: 'ضبط با میکروفون',
    stopMic: 'توقف ضبط',
    loadSampleFa: 'صدای نمونه فارسی',
    loadSampleEn: 'صدای نمونه انگلیسی',
    analyzeWithAi: 'تحلیل صدا و تدوین کاملاً خودکار ویدیو',
    analyzingAudio: 'در حال تحلیل صدا و تدوین خودکار صحنه‌ها...',
    autoEditNote:
      'تدوین، کات‌های سریع، زوم‌ها، ترنزیشن‌ها و دعوت به لایک و سابسکرایب کاملاً خودکار انجام می‌شوند.',
    characterPanelTitle: 'استایل کمیک و لباس کاراکتر استیک‌من',
    styleModeLabel: 'حالت هنری استیک‌من',
    outfitLabel: 'لباس کاراکتر',
    outfitColorLabel: 'رنگ لباس',
    accentColorLabel: 'رنگ موشن‌گرافیک',
    headwearLabel: 'کلاه / هدفون',
    eyewearLabel: 'عینک',
    themeLabel: 'سبک پس‌زمینه ویدیو',
    customNotesLabel: 'توضیحات دلخواه ظاهر و سبک',
    customNotesPlaceholder:
      'مثلاً: هودی قرمز کمیک، چشم‌های درشت پرانرژی، پس‌زمینه خیابانی...',
    lineWeightLabel: 'ضخامت جوهر خطوط',
    goToStoryboard: 'مشاهده جزئیات صحنه‌ها',
    storyboardTitle: 'بازبینی خودکار صحنه‌ها (در صورت نیاز قابل ویرایش)',
    storyboardSubtitle:
      'تمام هوک‌ها، مینی‌هوک‌ها، زوم‌ها و موشن‌گرافیک‌ها خودکار چیده شده‌اند؛ هر بخشی را بخواهید می‌توانید تغییر دهید.',
    addScene: 'افزودن صحنه جدید',
    buildAllConcurrent: 'تولید همزمان صحنه‌ها و نمایش خروجی',
    buildingConcurrent: 'در حال ساخت همزمان صحنه‌ها...',
    editTranscript: 'متن کامل سناریوی ویدیو (با هوک، مینی‌هوک و کال‌تواکشن پایانی)',
    narrationLabel: 'متن گفتار / زیرنویس',
    headlineLabel: 'تیتر بزرگ موشن‌گرافیک',
    highlightWordLabel: 'کلمه هایلایت رنگی',
    thoughtBubbleLabel: 'حباب فکر کاراکتر',
    durationLabel: 'مدت زمان (ثانیه)',
    poseLabel: 'ژست کاراکتر',
    emotionLabel: 'حالت چهره',
    cameraLabel: 'حرکت دوربین (Zoom / Pan)',
    transitionLabel: 'ترنزیشن ورودی سریع',
    motionGraphicLabel: 'لایه موشن‌گرافیک',
    propLabel: 'آبجکت / آیکون صحنه',
    outfitOverrideLabel: 'لباس اختصاصی این صحنه',
    inheritOutfit: 'لباس اصلی کاراکتر',
    regenerateArt: 'ساخت مجدد تصویر صحنه',
    deleteScene: 'حذف صحنه',
    liveProductionTitle: 'تولید همزمان تصاویر و پخش‌کننده ویدیو نهایی',
    liveProductionSubtitle:
      'صحنه‌های کمیک به صورت موازی تولید می‌شوند؛ نتیجه نهایی را با زوم، ترنزیشن و موشن‌گرافیک ببینید و دانلود کنید.',
    playVideo: 'پخش ویدیو',
    pauseVideo: 'توقف',
    restartVideo: 'از ابتدا',
    exportVideoBtn: 'رندر و دانلود ویدیو (.webm)',
    exportingProgress: 'در حال رندر ویدیو با کیفیت HD...',
    downloadReadyBtn: 'دانلود فایل ویدیو آماده',
    concurrentGridTitle: 'مانیتور زنده ساخت همزمان تصاویر و صحنه‌ها',
    cutsPerMin: 'کات در دقیقه',
    totalDurationLabel: 'مدت کل',
    scenesLabel: 'تعداد صحنه',
    progressLabel: 'پیشرفت کل',
    noAudioWarning:
      'لطفاً ابتدا یک فایل صوتی ارسال کنید، ضبط کنید یا صدای نمونه را بارگذاری کنید.',
    noTopicWarning: 'لطفاً موضوع ویدیو را بنویسید تا سناریو و ویدیو خودکار ساخته شود.',
  },
  en: {
    brand: 'UpVid Studio',
    navSetup: '1. Topic / Audio & Cast',
    navStoryboard: '2. Auto Storyboard',
    navProduction: '3. Auto Build & Export',
    primaryBuildBtn: 'Auto-Build Video',
    primaryExportBtn: 'Export Final Video',
    heroTitle: 'Fully Automated Comic Stickman YouTube Video Studio',
    heroSubtitle:
      'Enter just a video topic or drop your voiceover—UpVid writes a high-retention script with hooks, mini-hooks & subscribe CTA, renders expressive comic stickman art, and auto-edits with pro motion graphics.',
    audioPanelTitle: 'Topic Auto-Pilot or Voiceover Input',
    modeTopicTab: 'Topic Only (No Voice Needed)',
    modeAudioTab: 'Upload / Record Audio',
    topicLabel: 'What is your YouTube video about?',
    topicPlaceholder:
      'e.g. Why 90% of people wake up at 3 AM without knowing the real reason',
    generateFromTopicBtn: 'Write Script + Generate Voice + Auto-Build Video',
    generatingFromTopic: 'Writing viral script, generating voiceover & auto-editing...',
    dropAudioTitle: 'Drop audio file here or click to browse',
    dropAudioHint: 'Supports MP3, WAV, M4A, OGG, WEBM',
    recordMic: 'Record Microphone',
    stopMic: 'Stop Recording',
    loadSampleFa: 'Persian Sample Audio',
    loadSampleEn: 'English Sample Audio',
    analyzeWithAi: 'Transcribe & Auto-Build Full Video',
    analyzingAudio: 'Transcribing audio & auto-directing fast cuts...',
    autoEditNote:
      'Cuts, camera zooms, fast transitions, and Subscribe CTA end-card are edited automatically.',
    characterPanelTitle: 'Comic Stickman Style & Outfit Designer',
    styleModeLabel: 'Comic Art Style Mode',
    outfitLabel: 'Character Outfit',
    outfitColorLabel: 'Outfit Color',
    accentColorLabel: 'Motion Accent',
    headwearLabel: 'Headwear / Gear',
    eyewearLabel: 'Eyewear',
    themeLabel: 'Canvas Theme',
    customNotesLabel: 'Custom Character & Style Notes',
    customNotesPlaceholder: 'e.g. Red hoodie, big comic eyes, sketchy street backdrop...',
    lineWeightLabel: 'Ink Thickness',
    goToStoryboard: 'Inspect Auto Scenes',
    storyboardTitle: 'Auto-Directed Storyboard (Optional Overrides)',
    storyboardSubtitle:
      'Hooks, mini-hooks, zooms, fast transitions, and motion graphics are already auto-edited. Tweak any scene if desired.',
    addScene: 'Add New Scene',
    buildAllConcurrent: 'Build Scenes Concurrently',
    buildingConcurrent: 'Building scenes in parallel...',
    editTranscript: 'Full Video Script (Hook, Mini-Hooks & Subscribe/Next-Video CTA)',
    narrationLabel: 'Subtitle / Spoken Line',
    headlineLabel: 'Kinetic Headline Text',
    highlightWordLabel: 'Accent Highlight Word',
    thoughtBubbleLabel: 'Thought Bubble',
    durationLabel: 'Duration (sec)',
    poseLabel: 'Character Pose',
    emotionLabel: 'Facial Expression',
    cameraLabel: 'Camera Move (Zoom / Pan)',
    transitionLabel: 'Fast Entry Transition',
    motionGraphicLabel: 'Motion Graphic Layer',
    propLabel: 'Scene Prop / Icon',
    outfitOverrideLabel: 'Scene Outfit Override',
    inheritOutfit: 'Use Main Outfit',
    regenerateArt: 'Regenerate Scene Art',
    deleteScene: 'Delete Scene',
    liveProductionTitle: 'Concurrent Live Build & Cinema Export',
    liveProductionSubtitle:
      'Watch comic scenes render in parallel while previewing fast transitions, zoom rigs, motion graphics, and downloading your video.',
    playVideo: 'Play Video',
    pauseVideo: 'Pause',
    restartVideo: 'Restart',
    exportVideoBtn: 'Render & Download Video (.webm)',
    exportingProgress: 'Rendering HD Video...',
    downloadReadyBtn: 'Download Ready Video',
    concurrentGridTitle: 'Live Concurrent Scene Production Grid',
    cutsPerMin: 'Cuts / Min',
    totalDurationLabel: 'Duration',
    scenesLabel: 'Scenes',
    progressLabel: 'Build Progress',
    noAudioWarning: 'Please upload an audio file, record via microphone, or load a sample track first.',
    noTopicWarning: 'Please enter a video topic to auto-generate the script and video.',
  },
};
