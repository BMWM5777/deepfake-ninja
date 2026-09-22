export type Language = 'kk' | 'en' | 'ru';

export interface Translations {
  gameTitle: string;
  gameSubtitle: string;
  brandTagline: string;
  startGame: string;
  settings: string;
  close: string;
  cameraMode: string;
  cameraMirror: string;
  cameraMirrorDesc: string;
  cameraVoid: string;
  cameraVoidDesc: string;
  inputMode: string;
  inputHands: string;
  inputHandsDesc: string;
  inputMouse: string;
  inputMouseDesc: string;
  language: string;
  audio: string;
  soundEnabled: string;
  musicEnabled: string;
  calibrateCamera: string;
  howToPlay: string;
  ruleCutSpoofs: string;
  ruleProtectValid: string;
  ruleSlashSpeed: string;
  score: string;
  shields: string;
  combo: string;
  overdrive: string;
  threatNeutralized: string;
  deepfakeBlocked: string;
  maskNeutralized: string;
  emulatorDestroyed: string;
  validVerified: string;
  falseRejection: string;
  spoofBreach: string;
  gameOverTitle: string;
  finalScore: string;
  threatsNeutralizedCount: string;
  validProtectedCount: string;
  livenessAccuracy: string;
  playAgain: string;
  backToMenu: string;
  cameraPermissionNeeded: string;
  loadingAI: string;
  readyToSlice: string;
  detectedHands: string;
  targetIntelTitle: string;
  leaderboardTitle: string;
  boothStandTitle: string;
  pressSpaceToStart: string;
  holdPalmsToStart: string;
  rankTitle: string;
  accuracyGrade: string;
  noSessionsYet: string;
  badgeCut: string;
  badgeProtect: string;
}

export const translations: Record<Language, Translations> = {
  kk: {
    gameTitle: "Deepfake Ninja",
    gameSubtitle: "Anti-Spoofing & Liveness Detection",
    brandTagline: "DilshaM5 биометриялық қауіпсіздік зертханасы",
    startGame: "ВЕРИФИКАЦИЯНЫ БАСТАУ",
    settings: "Баптаулар",
    close: "Жабу",
    cameraMode: "Камера режимі",
    cameraMirror: "AR Кибер-айна",
    cameraMirrorDesc: "Камерадан нақты видеоңыз кибер-сеткамен көрінеді",
    cameraVoid: "Cyber Void (Терең кеңістік)",
    cameraVoidDesc: "Тек лазерлік қылыш пен қолдардың шлейфі көрінеді",
    inputMode: "Басқару әдісі",
    inputHands: "Қол қимылдары (Vision)",
    inputHandsDesc: "Веб-камера алдында қолыңызды сермеп ойнаңыз",
    inputMouse: "Тінтуір / Сенсор",
    inputMouseDesc: "Курсормен немесе экранды сипау арқылы басқару",
    language: "Тілді таңдау",
    audio: "Дыбыстық сүйемелдеу",
    soundEnabled: "Дыбыстық эффектілер (SFX)",
    musicEnabled: "Киберпанк музыкасы",
    calibrateCamera: "Камераны қосу",
    howToPlay: "Қалай ойнау керек?",
    ruleCutSpoofs: "ҚАУІПТЕРДІ КЕСІҢІЗ: 3D-маскалар, дипфейктер, виртуалды камералар",
    ruleProtectValid: "ТИІСПЕҢІЗ: ҚР Жеке куәлігі, ҚР ВНЖ, тірі бейнеселфи",
    ruleSlashSpeed: "Қылышты жылдам сермеңіз — жылдамдық қауіпті жояды!",
    score: "Ұпай",
    shields: "Қорғаныс қалқандары",
    combo: "КОМБО",
    overdrive: "LIVENESS OVERDRIVE",
    threatNeutralized: "Қауіп жойылды!",
    deepfakeBlocked: "Дипфейк бұғатталды! +150",
    maskNeutralized: "3D Маска жойылды! +100",
    emulatorDestroyed: "Камера эмуляторы жойылды! +120",
    validVerified: "Құжат расталды! +60",
    falseRejection: "ҚАТЕЛІК! Шынайы азамат бұғатталды! -1 ҚАЛҚАН",
    spoofBreach: "ЕСКЕРТУ! Шабуыл өткізілді! -1 ҚАЛҚАН",
    gameOverTitle: "Верификация есебі",
    finalScore: "Қорытынды ұпай",
    threatsNeutralizedCount: "Жойылған шабуылдар",
    validProtectedCount: "Сақталған шынайы құжаттар",
    livenessAccuracy: "Биометриялық дәлдік",
    playAgain: "Қайта бастау",
    backToMenu: "Басты мәзір",
    cameraPermissionNeeded: "Веб-камераға рұқсат беріңіз",
    loadingAI: "AI көру моделі жүктелуде...",
    readyToSlice: "Жүйе дайын! Қолыңызды сермеңіз!",
    detectedHands: "Анықталған қолдар",
    targetIntelTitle: "БИОМЕТРИЯЛЫҚ НЫСАНДАР",
    leaderboardTitle: "СЕССИЯ РЕКОРДТАРЫ",
    boothStandTitle: "DILSHAM5 CYBER LAB // TECH EXPO",
    pressSpaceToStart: "[ БОС ОРЫН ТҮЙМЕСІ НЕМЕСЕ ЕКІ АЛАҚАНДЫ КӨРСЕТІҢІЗ ]",
    holdPalmsToStart: "ЕКІ АЛАҚАН АНЫҚТАЛДЫ! БАСТАУ ҮШІН ҰСТАП ТҰРЫҢЫЗ...",
    rankTitle: "ОРЫН",
    accuracyGrade: "ҚАУІПСІЗДІК ДЕҢГЕЙІ",
    noSessionsYet: "Ағымдағы сессияда әлі ойындар жоқ. Ойнап көріңіз!",
    badgeCut: "КЕСУ",
    badgeProtect: "ҚОРҒАУ"
  },
  en: {
    gameTitle: "Deepfake Ninja",
    gameSubtitle: "Anti-Spoofing & Liveness Detection",
    brandTagline: "Powered by DilshaM5 Cyber Defense Lab",
    startGame: "START VERIFICATION",
    settings: "Settings",
    close: "Close",
    cameraMode: "Camera Mode",
    cameraMirror: "AR Cyber Mirror",
    cameraMirrorDesc: "Real-time camera feed with futuristic cyber overlay",
    cameraVoid: "Cyber Void (Dark Space)",
    cameraVoidDesc: "Clean dark background with laser blade trail only",
    inputMode: "Control Method",
    inputHands: "Hand Tracking (Vision)",
    inputHandsDesc: "Slash threats by waving your hand in front of camera",
    inputMouse: "Mouse / Touchscreen",
    inputMouseDesc: "Swipe with mouse cursor or finger on screen",
    language: "Language",
    audio: "Audio & Sounds",
    soundEnabled: "Sound Effects (SFX)",
    musicEnabled: "Cyberpunk Synth Music",
    calibrateCamera: "Enable Camera",
    howToPlay: "How to Play",
    ruleCutSpoofs: "SLASH THREATS: 3D masks, deepfakes, camera emulators",
    ruleProtectValid: "DO NOT TOUCH: KZ ID Card, KZ Residency, Live Selfie",
    ruleSlashSpeed: "Make swift slashing motions — fast slashes slice through attacks!",
    score: "Score",
    shields: "Cyber Shields",
    combo: "COMBO",
    overdrive: "LIVENESS OVERDRIVE",
    threatNeutralized: "Threat Neutralized!",
    deepfakeBlocked: "Deepfake Blocked! +150",
    maskNeutralized: "3D Mask Destroyed! +100",
    emulatorDestroyed: "Virtual Cam Terminated! +120",
    validVerified: "Document Verified! +60",
    falseRejection: "FALSE REJECTION! Genuine citizen blocked! -1 SHIELD",
    spoofBreach: "SECURITY BREACH! Attack penetrated! -1 SHIELD",
    gameOverTitle: "Verification Report",
    finalScore: "Final Score",
    threatsNeutralizedCount: "Threats Neutralized",
    validProtectedCount: "Genuine Documents Protected",
    livenessAccuracy: "Liveness Accuracy",
    playAgain: "Verify Again",
    backToMenu: "Main Menu",
    cameraPermissionNeeded: "Please allow webcam access",
    loadingAI: "Loading Vision Model...",
    readyToSlice: "System Ready! Raise your hand to slash!",
    detectedHands: "Hands Tracked",
    targetIntelTitle: "TARGET THREAT MATRIX",
    leaderboardTitle: "SESSION LEADERBOARD",
    boothStandTitle: "DILSHAM5 CYBER LAB // TECH EXPO",
    pressSpaceToStart: "[ PRESS SPACEBAR OR SHOW BOTH OPEN PALMS ]",
    holdPalmsToStart: "BOTH PALMS DETECTED! HOLD TO START...",
    rankTitle: "RANK",
    accuracyGrade: "DEFENSE RATING",
    noSessionsYet: "No completed games in this session yet. Play to set a record!",
    badgeCut: "SLICE",
    badgeProtect: "PROTECT"
  },
  ru: {
    gameTitle: "Deepfake Ninja",
    gameSubtitle: "Anti-Spoofing & Liveness Detection",
    brandTagline: "Лаборатория биометрической киберзащиты DilshaM5",
    startGame: "НАЧАТЬ ВЕРИФИКАЦИЮ",
    settings: "Настройки",
    close: "Закрыть",
    cameraMode: "Режим камеры",
    cameraMirror: "AR Кибер-зеркало",
    cameraMirrorDesc: "Реальное видео с веб-камеры с наложенной кибер-сеткой",
    cameraVoid: "Cyber Void (Тёмный фон)",
    cameraVoidDesc: "Тёмное пространство, видны только руки и лазерный клинок",
    inputMode: "Способ управления",
    inputHands: "Движения рук (Vision)",
    inputHandsDesc: "Рубите угрозы взмахами рук перед веб-камерой",
    inputMouse: "Мышь / Тачпад",
    inputMouseDesc: "Управление курсором или пальцем по экрану",
    language: "Выбор языка",
    audio: "Звуковое сопровождение",
    soundEnabled: "Звуковые эффекты (SFX)",
    musicEnabled: "Киберпанк музыка",
    calibrateCamera: "Включить камеру",
    howToPlay: "Как играть?",
    ruleCutSpoofs: "РУБИТЕ СПУФЫ: 3D-маски, дипфейки, эмуляторы камер",
    ruleProtectValid: "НЕ ТРОГАТЬ: Удостоверения личности РК, ВНЖ РК, живые селфи",
    ruleSlashSpeed: "Делайте резкие рубящие взмахи — скорость рассекает атаку!",
    score: "Счёт",
    shields: "Щиты киберзащиты",
    combo: "КОМБО",
    overdrive: "LIVENESS OVERDRIVE",
    threatNeutralized: "Угроза нейтрализована!",
    deepfakeBlocked: "Дипфейк заблокирован! +150",
    maskNeutralized: "3D-маска уничтожена! +100",
    emulatorDestroyed: "Эмулятор камеры уничтожен! +120",
    validVerified: "Документ подтвержден! +60",
    falseRejection: "ЛОЖНОЕ СРАБАТЫВАНИЕ! Заблокирован гражданин! -1 ЩИТ",
    spoofBreach: "ПРОБОЙ ЗАЩИТЫ! Спуф-атака пробила систему! -1 ЩИТ",
    gameOverTitle: "Отчёт о верификации",
    finalScore: "Итоговый счёт",
    threatsNeutralizedCount: "Нейтрализовано угроз",
    validProtectedCount: "Защищено документов РК",
    livenessAccuracy: "Точность Liveness",
    playAgain: "Повторить проверку",
    backToMenu: "В главное меню",
    cameraPermissionNeeded: "Предоставьте доступ к веб-камере",
    loadingAI: "Загрузка AI модели нейросети...",
    readyToSlice: "Система готова! Поднимите руку для удара!",
    detectedHands: "Обнаружено рук",
    targetIntelTitle: "БИОМЕТРИЧЕСКИЕ ЦЕЛИ",
    leaderboardTitle: "РЕКОРДЫ ТЕКУЩЕЙ СЕССИИ",
    boothStandTitle: "DILSHAM5 CYBER LAB // TECH EXPO",
    pressSpaceToStart: "[ НАЖМИТЕ ПРОБЕЛ ИЛИ ПОКАЖИТЕ ОБЕ ЛАДОНИ ]",
    holdPalmsToStart: "ОБЕ ЛАДОНИ ОБНАРУЖЕНЫ! УДЕРЖИВАЙТЕ ДЛЯ СТАРТА...",
    rankTitle: "МЕСТО",
    accuracyGrade: "КЛАСС ЗАЩИТЫ",
    noSessionsYet: "В текущей сессии пока нет сыгранных игр. Сыграйте для рекорда!",
    badgeCut: "РУБИТЬ",
    badgeProtect: "НЕ ТРОГАТЬ"
  }
};

export const itemTranslations: Record<Language, Record<string, string>> = {
  kk: {
    VALID_ID: "ҚР ЖЕКЕ КУӘЛІГІ",
    VALID_VNJ: "ҚР ВНЖ ҚҰЖАТЫ",
    VALID_SELFIE: "ТІРІ СЕЛФИ",
    SPOOF_MASK: "3D МАСКА ШАБУЫЛЫ",
    SPOOF_DEEPFAKE: "ЖАСАНДЫ ДИПФЕЙК",
    SPOOF_EMULATOR: "ВИРТУАЛДЫ КАМЕРА",
    BONUS_SHIELD: "CYBER OVERDRIVE"
  },
  en: {
    VALID_ID: "KZ NATIONAL ID",
    VALID_VNJ: "KZ RESIDENCE PERMIT",
    VALID_SELFIE: "LIVE SELFIE",
    SPOOF_MASK: "3D MASK ATTACK",
    SPOOF_DEEPFAKE: "AI DEEPFAKE",
    SPOOF_EMULATOR: "VIRTUAL CAMERA",
    BONUS_SHIELD: "CYBER OVERDRIVE"
  },
  ru: {
    VALID_ID: "УДОСТОВЕРЕНИЕ РК",
    VALID_VNJ: "ВНЖ РК",
    VALID_SELFIE: "ЖИВОЕ СЕЛФИ",
    SPOOF_MASK: "АТАКА 3D-МАСКОЙ",
    SPOOF_DEEPFAKE: "ИИ ДИПФЕЙК",
    SPOOF_EMULATOR: "ВИРТУАЛЬНАЯ КАМЕРА",
    BONUS_SHIELD: "CYBER OVERDRIVE"
  }
};

export function detectSystemLanguage(): Language {
  const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'kk').toLowerCase();
  if (browserLang.startsWith('kk') || browserLang.startsWith('kz')) {
    return 'kk';
  }
  if (browserLang.startsWith('ru')) {
    return 'ru';
  }
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'kk';
}
