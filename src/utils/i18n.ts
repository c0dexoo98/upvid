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
    dropAudioTitle: string;
    dropAudioHint: string;
    recordMic: string;
    stopMic: string;
    loadSampleFa: string;
    loadSampleEn: string;
    analyzeWithAi: string;
    analyzingAudio: string;
    characterPanelTitle: string;
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
  }
> = {
  fa: {
    brand: 'UpVid Studio',
    navSetup: '۱. صدا و کاراکتر',
    navStoryboard: '۲. تدوین و صحنه‌ها',
    navProduction: '۳. ساخت همزمان و خروجی',
    primaryBuildBtn: 'ساخت ویدیو استیک‌من',
    primaryExportBtn: 'دانلود ویدیو نهایی',
    heroTitle: 'تبدیل صدا به ویدیو استیک‌من یوتیوبی با تدوین و موشن‌گرافیک سریع',
    heroSubtitle:
      'فایل صوتی یا ویس خودت رو بفرست، لباس و ظاهر استیک‌من رو انتخاب کن، هر صحنه رو ویرایش کن و شاهد ساخت همزمان تصاویر، زوم‌ها و ترنزیشن‌های حرفه‌ای باش.',
    audioPanelTitle: 'ورودی صدا و تحلیل هوش مصنوعی',
    dropAudioTitle: 'فایل صوتی را بکشید یا انتخاب کنید',
    dropAudioHint: 'پشتیبانی از MP3, WAV, M4A, OGG, WEBM',
    recordMic: 'ضبط با میکروفون',
    stopMic: 'توقف ضبط',
    loadSampleFa: 'صدای نمونه فارسی',
    loadSampleEn: 'صدای نمونه انگلیسی',
    analyzeWithAi: 'تحلیل صدا و صحنه‌بندی خودکار',
    analyzingAudio: 'در حال پیاده‌سازی صدا و کارگردانی صحنه‌ها...',
    characterPanelTitle: 'طراحی لباس و ظاهر استیک‌من',
    outfitLabel: 'لباس کاراکتر',
    outfitColorLabel: 'رنگ لباس',
    accentColorLabel: 'رنگ موشن‌گرافیک',
    headwearLabel: 'کلاه / هدفون',
    eyewearLabel: 'عینک',
    themeLabel: 'سبک پس‌زمینه ویدیو',
    customNotesLabel: 'توضیحات دلخواه ظاهر و سبک',
    customNotesPlaceholder: 'مثلاً: هودی مشکی با کلاه، حرکات دست پرانرژی، مثل ویدیوهای تبیینی یوتیوب...',
    lineWeightLabel: 'ضخامت خطوط',
    goToStoryboard: 'ورود به ویرایشگر صحنه‌ها',
    storyboardTitle: 'تدوینگر صحنه به صحنه (قابل ویرایش در هر لحظه)',
    storyboardSubtitle:
      'متن روی تصویر، کلمه کلیدی، زاویه زوم، نوع ترنزیشن، ژست کاراکتر و لباس هر صحنه را ویرایش کنید.',
    addScene: 'افزودن صحنه جدید',
    buildAllConcurrent: 'شروع ساخت همزمان صحنه‌ها',
    buildingConcurrent: 'در حال ساخت همزمان صحنه‌ها...',
    editTranscript: 'متن کامل پیاده‌شده صدا',
    narrationLabel: 'متن زیرنویس / گفتار',
    headlineLabel: 'تیتر بزرگ موشن‌گرافیک',
    highlightWordLabel: 'کلمه هایلایت رنگی',
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
    liveProductionTitle: 'استودیو ساخت همزمان و رندر نهایی ویدیو',
    liveProductionSubtitle:
      'صحنه‌ها به صورت موازی و زنده تصویرسازی می‌شوند؛ همزمان پیش‌نمایش تمام‌صفحه را ببینید و خروجی ویدیو را دانلود کنید.',
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
    noAudioWarning: 'لطفاً ابتدا یک فایل صوتی ارسال کنید، ضبط کنید یا صدای نمونه را بارگذاری کنید.',
  },
  en: {
    brand: 'UpVid Studio',
    navSetup: '1. Audio & Character',
    navStoryboard: '2. Storyboard Editor',
    navProduction: '3. Live Build & Export',
    primaryBuildBtn: 'Build Stickman Video',
    primaryExportBtn: 'Export Final Video',
    heroTitle: 'Turn Voiceover Audio into High-Retention YouTube Stickman Videos',
    heroSubtitle:
      'Upload or record your narration, customize your stickman outfit and props, edit any scene at any stage, watch scenes build concurrently, and download the finished motion-graphics video.',
    audioPanelTitle: 'Voiceover Audio & AI Breakdown',
    dropAudioTitle: 'Drop audio file here or click to browse',
    dropAudioHint: 'Supports MP3, WAV, M4A, OGG, WEBM',
    recordMic: 'Record Microphone',
    stopMic: 'Stop Recording',
    loadSampleFa: 'Persian Sample Audio',
    loadSampleEn: 'English Sample Audio',
    analyzeWithAi: 'Transcribe & Auto-Direct Scenes',
    analyzingAudio: 'Transcribing audio & directing fast YouTube cuts...',
    characterPanelTitle: 'Stickman Outfit & Style Customizer',
    outfitLabel: 'Character Outfit',
    outfitColorLabel: 'Outfit Color',
    accentColorLabel: 'Motion Accent',
    headwearLabel: 'Headwear / Gear',
    eyewearLabel: 'Eyewear',
    themeLabel: 'Canvas Theme',
    customNotesLabel: 'Custom Character & Style Notes',
    customNotesPlaceholder: 'e.g. Black hoodie, energetic hand gestures, crisp explainer vibe...',
    lineWeightLabel: 'Ink Thickness',
    goToStoryboard: 'Open Storyboard Editor',
    storyboardTitle: 'Scene-by-Scene Storyboard Editor',
    storyboardSubtitle:
      'Edit kinetic headlines, highlight words, zoom/pan camera moves, fast transitions, character poses, and per-scene outfits anytime.',
    addScene: 'Add New Scene',
    buildAllConcurrent: 'Build Scenes Concurrently',
    buildingConcurrent: 'Building scenes in parallel...',
    editTranscript: 'Full Audio Transcript',
    narrationLabel: 'Subtitle / Spoken Line',
    headlineLabel: 'Kinetic Headline Text',
    highlightWordLabel: 'Accent Highlight Word',
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
      'Watch every scene illustration render in parallel while previewing the full motion-graphics timeline and exporting your downloadable video.',
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
  },
};
