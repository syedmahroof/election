import { useCallback, useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { domToBlob } from "modern-screenshot";
import html2canvas from "html2canvas";

const LAC_OPTIONS = [
  { value: "", label: "Select constituency" },
  { value: "kalpetta", label: "Kalpetta" },
  { value: "mananthavady", label: "Mananthavady" },
  { value: "sulthan_bathery", label: "Sulthan Bathery" },
];

const LAC_LABELS = {
  kalpetta: "Kalpetta",
  mananthavady: "Mananthavady",
  sulthan_bathery: "Sulthan Bathery",
};

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [lac, setLac] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const certificateRef = useRef(null);
  const fileGalleryRef = useRef(null);
  const fileCameraRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!cameraOpen) return;
    const v = videoRef.current;
    const s = streamRef.current;
    if (v && s) {
      v.srcObject = s;
      v.play().catch(() => {});
    }
  }, [cameraOpen]);

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhoto(file ?? null);
    e.target.value = "";
  };

  const openLiveCamera = async () => {
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      fileCameraRef.current?.click();
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      fileCameraRef.current?.click();
    }
  };

  const captureFromVideo = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPhoto(file);
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const certificateBasename = useCallback(() => {
    const slug =
      name
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9\u0D00-\u0D7F-]/g, "")
        .slice(0, 56) || "certificate";
    return `wayanad-certificate-${slug}`;
  }, [name]);

  const captureCertificatePng = useCallback(async () => {
    const el = certificateRef.current;
    if (!el) return null;

    const scale = Math.min(2, window.devicePixelRatio || 2);

    try {
      const blob = await domToBlob(el, {
        scale,
        type: "image/png",
        backgroundColor: "#ffffff",
        quality: 1,
        maximumCanvasSize: 16384,
      });
      if (blob && blob.size > 0) return blob;
    } catch {
      /* try next */
    }

    try {
      const blob = await toBlob(el, {
        pixelRatio: Math.min(scale, 1.5),
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipFonts: true,
      });
      if (blob && blob.size > 0) return blob;
    } catch {
      /* try next */
    }

    try {
      const canvas = await html2canvas(el, {
        scale: Math.min(scale, 1.75),
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: el.offsetWidth,
        height: el.offsetHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });
      return await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || null), "image/png", 1);
      });
    } catch {
      return null;
    }
  }, []);

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    setExporting(true);
    try {
      const blob = await captureCertificatePng();
      if (!blob) throw new Error("empty");
      triggerDownload(blob, `${certificateBasename()}.png`);
    } catch {
      window.alert(
        "Could not create the image. Try: update your browser, disable strict content blockers for this site, or use “Share” on your phone. If it keeps failing, take a screenshot of the certificate."
      );
    } finally {
      setExporting(false);
    }
  };

  const shareCertificate = async () => {
    if (!certificateRef.current) return;
    setExporting(true);
    try {
      const blob = await captureCertificatePng();
      const fname = `${certificateBasename()}.png`;
      const file = blob
        ? new File([blob], fname, { type: "image/png" })
        : null;

      if (
        file &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Participation certificate",
          text: `${name.trim()} — Wayanad 2026`,
        });
        return;
      }

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "Participation certificate",
            text: `${name.trim()} — Wayanad 2026`,
          });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      if (blob) {
        triggerDownload(blob, fname);
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      window.alert("Sharing failed. Try Download instead.");
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!lac) {
      setError("Please select a constituency.");
      return;
    }
    setSubmitted(true);
  };

  const reset = useCallback(() => {
    stopCamera();
    setSubmitted(false);
    setName("");
    setEmail("");
    setLac("");
    setPhoto(null);
    setPhotoPreview("");
    setError("");
  }, [stopCamera]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-primary/10 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <span className="text-lg font-bold text-primary-deep">
            Kerala Legislative Assembly
          </span>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-5 py-10">
        {!submitted ? (
          <>
            <div className="mb-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                Your voice · Election 2026
              </p>
              <h1 className="text-3xl font-bold leading-tight text-primary md:text-4xl">
                Your participation, proudly on record
              </h1>
              <p className="text-base leading-relaxed text-slate-600">
                Add your details and submit — your share-ready certificate
                appears instantly, framed for feeds and stories.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm space-y-6"
            >
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-primary">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="As you’d like it on the certificate"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary placeholder:text-slate-400 focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-primary">
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary placeholder:text-slate-400 focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lac" className="block text-sm font-semibold text-primary">
                  Constituency (LAC)
                </label>
                <select
                  id="lac"
                  value={lac}
                  onChange={(e) => setLac(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {LAC_OPTIONS.map((o) => (
                    <option key={o.value || "placeholder"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-semibold text-primary">
                  Photo (optional)
                </span>
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => fileGalleryRef.current?.click()}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50"
                    >
                      From gallery
                    </button>
                    <button
                      type="button"
                      onClick={openLiveCamera}
                      className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                    >
                      Use camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileCameraRef.current?.click()}
                      className="rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm font-semibold text-gold transition hover:bg-amber-50/50"
                    >
                      Native camera app
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Live preview in the browser, or your phone’s built-in camera
                    screen.
                  </p>
                  <input
                    ref={fileGalleryRef}
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="sr-only"
                  />
                  <input
                    ref={fileCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onPhotoChange}
                    className="sr-only"
                  />
                  {photoPreview ? (
                    <div className="relative mx-auto mt-4 max-w-[200px]">
                      <img
                        src={photoPreview}
                        alt=""
                        className="h-40 w-full rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="mt-2 w-full text-center text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {cameraOpen ? (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Camera"
                >
                  <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="aspect-video w-full rounded-xl bg-black object-cover"
                    />
                    <div className="mt-4 flex flex-wrap gap-2 justify-end">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={captureFromVideo}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                      >
                        Capture
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-md transition hover:bg-primary/90"
              >
                Create my certificate
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-primary">Your certificate</h2>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-slate-50"
              >
                New form
              </button>
            </div>

            <div className="flex w-full min-w-0 justify-center px-0">
              <article
                ref={certificateRef}
                className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border-[3px] border-[#c5a059] bg-gradient-to-b from-[#fffdf9] via-white to-[#eef6f1] shadow-xl"
              >
                <div className="pointer-events-none absolute inset-[6px] rounded-[1.15rem] border border-[#c5a059]/35 sm:inset-[10px] sm:rounded-[1.35rem]" />

                <div className="relative flex flex-col px-5 pb-10 pt-8 text-center sm:px-8 sm:pb-11 sm:pt-10">
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-primary sm:tracking-[0.18em]">
                      Government of Kerala
                    </p>
                    <p className="font-display text-base font-semibold text-primary-deep">
                      Wayanad
                    </p>
                  </div>

                  <p className="mx-auto mt-4 inline-flex max-w-[95%] flex-wrap justify-center rounded-full border border-[#c5a059]/40 bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#775a19] shadow-sm sm:mt-6 sm:px-5 sm:tracking-[0.22em]">
                    Election 2026
                  </p>

                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt=""
                      className="mx-auto mt-4 h-24 w-24 shrink-0 rounded-full object-cover shadow-[0_12px_32px_rgba(0,52,27,0.18)] ring-4 ring-[#c5a059]/35 sm:mt-5 sm:h-[118px] sm:w-[118px]"
                    />
                  ) : null}

                  <h3 className="font-display mt-4 text-lg font-bold leading-snug text-primary-deep sm:mt-6 sm:text-[1.65rem]">
                    Certificate of Participation
                  </h3>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:tracking-[0.2em]">
                    Kerala Legislative Assembly
                  </p>
                  <p className="mt-2 px-1 text-xs italic leading-relaxed text-slate-500">
                    With gratitude for your democratic voice
                  </p>

                  <p className="font-display mx-auto mt-6 max-w-full break-words px-2 text-[clamp(1.35rem,6vw+0.6rem,2.35rem)] font-bold leading-tight tracking-tight text-primary-deep sm:mt-8">
                    {name.trim()}
                  </p>
                  <div className="mx-auto mt-3 h-1 w-24 shrink-0 rounded-full bg-gradient-to-r from-transparent via-[#c5a059] to-transparent sm:mt-4" />

                  <div className="mt-8 space-y-6 border-t border-slate-200/90 pt-6 text-left sm:pt-8">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:tracking-[0.15em]">
                          Constituency
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-primary sm:mt-1.5 sm:text-base">
                          {LAC_LABELS[lac]}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:tracking-[0.15em]">
                          Date
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-primary sm:mt-1.5 sm:text-base">
                          April 09, 2026
                        </p>
                      </div>
                    </div>

                    {email.trim() ? (
                      <p className="break-all text-[11px] leading-snug text-slate-500">
                        {email.trim()}
                      </p>
                    ) : null}

                    <div>
                      <div className="mb-2 h-px max-w-32 bg-slate-300/90" />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-primary">
                        Returning Officer
                      </p>
                      <p className="text-[11px] font-medium text-slate-600">
                        Wayanad District
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={downloadCertificate}
                disabled={exporting}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {exporting ? "Preparing…" : "Download PNG"}
              </button>
              <button
                type="button"
                onClick={shareCertificate}
                disabled={exporting}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                Share
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">
              Full certificate is always visible on phones and desktop. Download
              may ask for storage permission on some devices. Tag responsibly.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-[#e8e6e2] px-5 py-8">
        <p className="text-center text-xs text-slate-600">
          © 2026 Kerala Legislative Assembly
        </p>
      </footer>
    </div>
  );
}
