import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandPoint {
  x: number; // Normalized 0..1 (screen mirrored)
  y: number; // Normalized 0..1
  rawX: number;
  rawY: number;
  handIndex: number;
}

export interface PalmInfo {
  isOpen: boolean;
  x: number;
  y: number;
}

export interface BothPalmsStatus {
  bothOpen: boolean;
  palms: PalmInfo[];
}

export interface FrameVisionResult {
  bladePoints: HandPoint[];
  palmStatus: BothPalmsStatus;
}

function checkIsOpenPalm(landmarks: Array<{ x: number; y: number }>): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];

  const fingerIndices = [
    { tip: 8, pip: 6 },
    { tip: 12, pip: 10 },
    { tip: 16, pip: 14 },
    { tip: 20, pip: 18 }
  ];

  let extendedFingers = 0;
  for (const f of fingerIndices) {
    const tipDist = Math.hypot(landmarks[f.tip].x - wrist.x, landmarks[f.tip].y - wrist.y);
    const pipDist = Math.hypot(landmarks[f.pip].x - wrist.x, landmarks[f.pip].y - wrist.y);
    if (tipDist > pipDist * 1.15) {
      extendedFingers++;
    }
  }

  // Thumb
  const thumbTipDist = Math.hypot(landmarks[4].x - wrist.x, landmarks[4].y - wrist.y);
  const thumbMcpDist = Math.hypot(landmarks[2].x - wrist.x, landmarks[2].y - wrist.y);
  if (thumbTipDist > thumbMcpDist * 1.12) {
    extendedFingers++;
  }

  return extendedFingers >= 4;
}

interface ActiveTrack {
  id: number;
  x: number;
  y: number;
  lastTimestamp: number;
}

export class HandTrackerService {
  private handLandmarker: HandLandmarker | null = null;
  private isModelLoaded = false;
  private lastVideoTime = -1;
  private lastProcessTimestamp = -1;
  private lastResult: HandLandmarkerResult | null = null;
  private activeTracks: ActiveTrack[] = [];

  public async initialize(): Promise<void> {
    if (this.isModelLoaded && this.handLandmarker) return;

    try {
      const baseUrl = window.location.origin;
      const wasmPath = `${baseUrl}/wasm`;
      const modelPath = `${baseUrl}/models/hand_landmarker.task`;

      // Try local WASM first, fallback to CDN if needed
      let vision;
      try {
        console.log('Loading MediaPipe vision WASM from:', wasmPath);
        vision = await FilesetResolver.forVisionTasks(wasmPath);
      } catch (e) {
        console.warn('Local WASM failed, falling back to CDN resolver:', e);
        vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      }

      const cdnModelPath = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

      const createLandmarker = async (mPath: string, delegate: 'GPU' | 'CPU') => {
        return await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: mPath,
            delegate: delegate
          },
          runningMode: 'VIDEO',
          numHands: 2,
          // Calibrated thresholds: prevents dropping to heavy Palm Detector
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      };

      // Try 1: Local Model + GPU
      try {
        this.handLandmarker = await createLandmarker(modelPath, 'GPU');
        console.log('MediaPipe loaded: Local Model + GPU');
      } catch (err1) {
        console.warn('Local Model + GPU failed, trying Local Model + CPU:', err1);
        // Try 2: Local Model + CPU
        try {
          this.handLandmarker = await createLandmarker(modelPath, 'CPU');
          console.log('MediaPipe loaded: Local Model + CPU');
        } catch (err2) {
          console.warn('Local Model + CPU failed, trying CDN Model + GPU:', err2);
          // Try 3: CDN Model + GPU
          try {
            this.handLandmarker = await createLandmarker(cdnModelPath, 'GPU');
            console.log('MediaPipe loaded: CDN Model + GPU');
          } catch (err3) {
            console.warn('CDN Model + GPU failed, trying CDN Model + CPU:', err3);
            // Try 4: CDN Model + CPU
            this.handLandmarker = await createLandmarker(cdnModelPath, 'CPU');
            console.log('MediaPipe loaded: CDN Model + CPU');
          }
        }
      }

      this.isModelLoaded = true;
    } catch (err) {
      console.error('All MediaPipe initialization attempts failed:', err);
      throw err;
    }
  }

  public detect(video: HTMLVideoElement, timestamp: number): HandLandmarkerResult | null {
    if (!this.handLandmarker || !this.isModelLoaded) return null;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
      return null;
    }

    // Skip redundant inferences if video hasn't progressed or if called within 18ms (~55 FPS)
    if (video.currentTime > 0 && video.currentTime === this.lastVideoTime && this.lastResult) {
      return this.lastResult;
    }
    if (this.lastProcessTimestamp > 0 && timestamp - this.lastProcessTimestamp < 18 && this.lastResult) {
      return this.lastResult;
    }

    try {
      this.lastVideoTime = video.currentTime;
      const safeTimestamp = Math.max(timestamp, this.lastProcessTimestamp + 1);
      this.lastProcessTimestamp = safeTimestamp;

      this.lastResult = this.handLandmarker.detectForVideo(video, safeTimestamp);
      return this.lastResult;
    } catch (e) {
      console.warn('Detection error:', e);
      return null;
    }
  }

  // Single-pass vision extraction: extracts both blade points and dual-palm status in 1 inference run
  public processFrame(video: HTMLVideoElement, timestamp: number): FrameVisionResult {
    const result = this.detect(video, timestamp);
    if (!result || !result.landmarks || result.landmarks.length === 0) {
      return {
        bladePoints: [],
        palmStatus: { bothOpen: false, palms: [] }
      };
    }

    const candidates: Array<{ x: number; y: number; rawX: number; rawY: number }> = [];
    const palms: PalmInfo[] = [];
    let openCount = 0;

    for (let h = 0; h < result.landmarks.length; h++) {
      const landmarks = result.landmarks[h];
      if (!landmarks || landmarks.length < 9) continue;

      // 1. Palm status (high-five detection)
      const isOpen = checkIsOpenPalm(landmarks);
      if (isOpen) openCount++;

      const pX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[17].x) * 0.25;
      const pY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[17].y) * 0.25;
      palms.push({
        isOpen,
        x: 1 - pX,
        y: pY
      });

      // 2. Blade tip candidates (index & middle fingers)
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const rawX = (indexTip.x + middleTip.x) * 0.5;
      const rawY = (indexTip.y + middleTip.y) * 0.5;
      const mirroredX = 1 - rawX;

      candidates.push({
        x: mirroredX,
        y: rawY,
        rawX,
        rawY
      });
    }

    // 3. Match candidate points to persistent tracks (prevents hand index swapping)
    this.activeTracks = this.activeTracks.filter(t => timestamp - t.lastTimestamp < 220);
    const points: HandPoint[] = [];
    const usedTrackIds = new Set<number>();

    for (const c of candidates) {
      let bestTrack: ActiveTrack | null = null;
      let minDistance = 0.35; // Maximum normalized distance (35% screen)

      for (const t of this.activeTracks) {
        if (usedTrackIds.has(t.id)) continue;
        const dist = Math.hypot(c.x - t.x, c.y - t.y);
        if (dist < minDistance) {
          minDistance = dist;
          bestTrack = t;
        }
      }

      let assignedId: number;
      if (bestTrack) {
        assignedId = bestTrack.id;
        bestTrack.x = c.x;
        bestTrack.y = c.y;
        bestTrack.lastTimestamp = timestamp;
      } else {
        const id0InUse = this.activeTracks.some(t => t.id === 0) || usedTrackIds.has(0);
        const id1InUse = this.activeTracks.some(t => t.id === 1) || usedTrackIds.has(1);

        if (c.x < 0.5) {
          assignedId = !id0InUse ? 0 : (!id1InUse ? 1 : 2);
        } else {
          assignedId = !id1InUse ? 1 : (!id0InUse ? 0 : 3);
        }

        this.activeTracks.push({
          id: assignedId,
          x: c.x,
          y: c.y,
          lastTimestamp: timestamp
        });
      }

      usedTrackIds.add(assignedId);

      points.push({
        x: c.x,
        y: c.y,
        rawX: c.rawX,
        rawY: c.rawY,
        handIndex: assignedId
      });
    }

    return {
      bladePoints: points,
      palmStatus: {
        bothOpen: openCount >= 2,
        palms
      }
    };
  }

  // Backwards compatibility wrappers
  public getBladePoints(video: HTMLVideoElement, timestamp: number): HandPoint[] {
    return this.processFrame(video, timestamp).bladePoints;
  }

  public getBothPalmsStatus(video: HTMLVideoElement, timestamp: number): BothPalmsStatus {
    return this.processFrame(video, timestamp).palmStatus;
  }

  public isReady(): boolean {
    return this.isModelLoaded;
  }
}

export const handTrackerService = new HandTrackerService();
