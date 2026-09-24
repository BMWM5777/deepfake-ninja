export class CameraService {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isInitialized = false;

  public async start(videoElement?: HTMLVideoElement): Promise<HTMLVideoElement> {
    if (this.isInitialized && this.video && this.isRunning()) {
      return this.video;
    }

    if (videoElement) {
      this.video = videoElement;
    } else if (!this.video) {
      this.video = document.createElement('video');
      // Hidden offscreen without display:none to preserve Safari WebKit frame decoding
      this.video.style.position = 'fixed';
      this.video.style.top = '-9999px';
      this.video.style.left = '-9999px';
      this.video.style.width = '1px';
      this.video.style.height = '1px';
      this.video.style.opacity = '0';
      this.video.style.pointerEvents = 'none';
      this.video.style.zIndex = '-10';
      document.body.appendChild(this.video);
    }

    this.video.setAttribute('playsinline', 'true');
    this.video.setAttribute('webkit-playsinline', 'true');
    this.video.setAttribute('muted', 'true');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.autoplay = true;

    // Optimized constraints for fast MediaPipe hand tracking (256x256 input)
    // 640x480 / 854x480 provides maximum FPS and eliminates WebGL texture upload bottlenecks
    const constraintsList: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 960 },
          height: { ideal: 480, max: 540 },
          frameRate: { ideal: 60, min: 30 }
        },
        audio: false
      },
      {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let lastError: unknown = null;
    let stream: MediaStream | null = null;

    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!stream) {
      console.error('All camera constraints failed:', lastError);
      throw lastError || new Error('Camera access failed');
    }

    this.stream = stream;
    this.video.srcObject = this.stream;

    await new Promise<void>((resolve) => {
      if (!this.video) return resolve();

      let resolved = false;
      const complete = () => {
        if (resolved) return;
        resolved = true;
        this.isInitialized = true;
        resolve();
      };

      const startPlayback = () => {
        if (!this.video) return complete();
        this.video
          .play()
          .then(() => {
            // Verify frames are flowing
            if (this.video && this.video.readyState >= 2) {
              complete();
            } else {
              setTimeout(complete, 250);
            }
          })
          .catch((e) => {
            console.warn('Camera video play caught:', e);
            complete();
          });
      };

      if (this.video.readyState >= 2) {
        startPlayback();
      } else {
        this.video.onloadeddata = () => startPlayback();
        this.video.onloadedmetadata = () => startPlayback();
        // Give mobile / TV browsers up to 3000ms for permission & hardware wakeup
        setTimeout(complete, 3000);
      }
    });

    return this.video;
  }

  public getVideo(): HTMLVideoElement | null {
    return this.video;
  }

  public isRunning(): boolean {
    if (!this.video) return false;
    if (this.video.paused && this.stream) {
      this.video.play().catch(() => {});
    }
    return !!this.stream && this.video.readyState >= 2 && this.video.videoWidth > 0;
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    this.isInitialized = false;
  }
}

export const cameraService = new CameraService();
