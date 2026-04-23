export const constants = {
  LEADERBOARD_KEY: "onepiece_leaderboard",
  SOUND_SETTINGS_KEY: "onepiece_sound_settings",
  DEFAULT_MASTER_VOLUME: 0.25,
  API_BASE_URL: "http://localhost:3000"
};

export const BOARD_SYMBOLS = [
    "image1.png", "image2.png", "image3.png", "image4.png", "image5.png",
    "image6.png", "image7.png", "image8.png", "image9.png", "image10.png",
    "image11.png", "image12.png", "image13.png", "image14.png", "image15.png",
    "image16.png", "image17.png", "image18.png", "image19.png", "image20.png",
    "image21.png", "image22.png", "image23.png", "image24.png", "image25.png",
    "image26.png", "image27.png", "image28.png", "image29.png", "image30.png"
];

export const gameModes = {
  easy: { timeLeft: 900, hintsLeft: 3, reshufflesLeft: 5, rows: 9, cols: 10, cellSize: 60 },
  hard: { timeLeft: 720, hintsLeft: 0, reshufflesLeft: 3, rows: 10, cols: 15, cellSize: 50 },
  insane: { timeLeft: 600, hintsLeft: 0, reshufflesLeft: 1, rows: 12, cols: 15, cellSize: 45 },
  impossible: { timeLeft: 600, hintsLeft: 0, reshufflesLeft: 0, rows: 15, cols: 20, cellSize: 40 }
};

export const state = {
  currentEntryMode: null,
  authMode: "signin",
  selectedFaction: "pirate",
  currentUser: null,

  currentBotMatch: null,
  currentGameContext: "offline",
  currentPvpMode: null,

  currentRoomMatch: null,
  roomMatchPolling: null,
  roomMatchProgressInterval: null,

  currentBoardSeed: null,
  opponentLiveScore: 0,
  opponentLiveStage: 0,
  opponentScoreInterval: null,

  board: [],
  firstSelected: null,
  secondSelected: null,

  score: 0,
  combo: 0,

  timeLeft: 0,
  timeInterval: null,
  isGameOver: false,
  isPaused: false,
  isBoardBusy: false,

  hintsLeft: 0,
  reshufflesLeft: 0,

  rows: 0,
  cols: 0,
  cellSize: 0,

  currentMode: null,
  currentModeName: null,
  insaneShiftDirection: null,

  hintCells: [],
  wrongCells: [],
  matchedCells: [],

  comboTimeOut: null,
  matchResolveTimeout: null,
  wrongResolveTimeout: null,
  hintClearTimeout: null,
  nextStageTimeout: null,

  currentPlayType: "single",
  runTotalScore: 0,
  currentStage: 1,
  stagesCleared: 0,
  runUsedSeconds: 0,

  isSoundOn: true,
  masterVolume: 0.25,
  currentBgmMode: "normal",
  currentBgmList: [],
  currentBgmIndex: -1,
  hasSwitchedToDangerBgm: false,

  friendlyQueuePolling: null,
};