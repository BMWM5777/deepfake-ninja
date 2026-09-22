export class CameraService {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isInitialized = false;

  public async start(videoElement?: HTMLVideoElement): Promise<HTMLVideoElement> {
    if (this.isInitialized && this.video) {
      return this.video;
    }

    if (videoElement) {
      this.video = videoElement;
    } else if (!this.video) {
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('muted', 'true');
      this.video.style.display = 'none';
      document.body.appendChild(this.video);
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 60, min: 30 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.autoplay = true;

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
          this.video!.play()
            .then(() => complete())
            .catch((e) => {
              console.warn('Camera video play caught:', e);
              complete();
            });
        };

        if (this.video.readyState >= 1) {
          startPlayback();
        } else {
          this.video.onloadedmetadata = () => startPlayback();
          setTimeout(complete, 1200);
        }
      });

      return this.video;
    } catch (err) {
      console.error('Camera initialization failed:', err);
      throw err;
    }
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
      this.stream.getTracks().forEach(track => track.stop());
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
