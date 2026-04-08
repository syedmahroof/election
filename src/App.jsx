import { useCallback, useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { domToBlob } from "modern-screenshot";
import html2canvas from "html2canvas";

const LAC_OPTIONS = [
  { value: "", label: "മണ്ഡലം തിരഞ്ഞെടുക്കുക" },
  { value: "kalpetta", label: "കല്പറ്റ (Kalpetta)" },
  { value: "mananthavady", label: "മാനന്തവാടി (Mananthavady)" },
  { value: "sulthan_bathery", label: "സുൽത്താൻ ബത്തേരി (Sulthan Bathery)" },
];

const LAC_LABELS = {
  kalpetta: "കല്പറ്റ",
  mananthavady: "മാനന്തവാടി",
  sulthan_bathery: "സുൽത്താൻ ബത്തേരി",
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
        "ചിത്രം തയ്യാറാക്കാൻ കഴിഞ്ഞില്ല. ബ്രൗസർ അപ്‌ഡേറ്റ് ചെയ്യുക, ഈ സൈറ്റിന് ബ്ലോക്കർ ഓഫാക്കുക, അല്ലെങ്കിൽ ഫോണിൽ «പങ്കുവയ്ക്കുക» ഉപയോഗിക്കുക. തുടർന്നും പ്രശ്നമുണ്ടെങ്കിൽ സ്ക്രീൻഷോട്ട് എടുക്കുക."
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
          title: "പങ്കാളിത്ത സർട്ടിഫിക്കറ്റ്",
          text: `${name.trim()} — വയനാട് 2026`,
        });
        return;
      }

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "പങ്കാളിത്ത സർട്ടിഫിക്കറ്റ്",
            text: `${name.trim()} — വയനാട് 2026`,
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
      window.alert("പങ്കുവയ്ക്കാൻ കഴിഞ്ഞില്ല. ഡൗൺലോഡ് ശ്രമിക്കുക.");
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("പേര് നിർബന്ധമാണ്.");
      return;
    }
    if (!lac) {
      setError("മണ്ഡലം തിരഞ്ഞെടുക്കുക.");
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
    <div className="flex min-h-screen flex-col font-ml">
      <header className="border-b border-primary/10 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <span className="font-ml text-lg font-bold text-primary-deep">
            കേരള നിയമസഭ
          </span>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-5 py-10">
        {!submitted ? (
          <>
            <div className="mb-8 space-y-3 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Wayanad Election 2026
              </p>
              <h1 className="font-ml text-3xl font-bold leading-tight text-primary md:text-4xl">
                കേരള നിയമസഭാ തിരഞ്ഞെടുപ്പ്2026
              </h1>
              <p className="font-ml text-base font-semibold text-slate-700">
                എന്റെ വോട്ട് • എന്റെ ശബ്ദം
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm space-y-6"
            >
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 font-ml">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-primary font-ml">
                  പൂർണ്ണ നാമം
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary placeholder:text-slate-400 focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-primary font-ml">
                  ഇമെയിൽ വിലാസം
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary placeholder:text-slate-400 focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lac" className="block text-sm font-semibold text-primary font-ml">
                  മണ്ഡലം (LAC)
                </label>
                <select
                  id="lac"
                  value={lac}
                  onChange={(e) => setLac(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-ml text-primary focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {LAC_OPTIONS.map((o) => (
                    <option key={o.value || "placeholder"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-semibold text-primary font-ml">
                  ഫോട്ടോ അപ്‌ലോഡ്
                </span>
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => fileGalleryRef.current?.click()}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-primary font-ml shadow-sm transition hover:bg-slate-50"
                    >
                      ഗാലറിയിൽ നിന്ന്
                    </button>
                    <button
                      type="button"
                      onClick={openLiveCamera}
                      className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white font-ml shadow-sm transition hover:bg-primary/90"
                    >
                      കാമറയിൽ പിടിക്കുക
                    </button>
                    <button
                      type="button"
                      onClick={() => fileCameraRef.current?.click()}
                      className="rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm font-semibold text-gold font-ml transition hover:bg-amber-50/50"
                    >
                      ഫോൺ കാമറ ആപ്പ്
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-500 font-ml" />
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
                        className="mt-2 w-full text-center text-xs font-semibold text-red-600 font-ml hover:underline"
                      >
                        ഫോട്ടോ നീക്കം ചെയ്യുക
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
                  aria-label="കാമറ"
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
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary font-ml hover:bg-slate-50"
                      >
                        റദ്ദാക്കുക
                      </button>
                      <button
                        type="button"
                        onClick={captureFromVideo}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white font-ml hover:bg-primary/90"
                      >
                        ഫോട്ടോ എടുക്കുക
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white font-ml shadow-md transition hover:bg-primary/90"
              >
                സർട്ടിഫിക്കറ്റ് ഉണ്ടാക്കുക
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-ml text-2xl font-bold text-primary">
                നിങ്ങളുടെ സർട്ടിഫിക്കറ്റ്
              </h2>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-primary font-ml hover:bg-slate-50"
              >
                പുതിയ ഫോം
              </button>
            </div>

            <div className="flex w-full min-w-0 justify-center px-0">
              <article
                ref={certificateRef}
                className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border-[3px] border-[#c5a059] bg-gradient-to-b from-[#fffdf9] via-white to-[#eef6f1] shadow-xl"
              >
                <div className="pointer-events-none absolute inset-[6px] rounded-[1.15rem] border border-[#c5a059]/35 sm:inset-[10px] sm:rounded-[1.35rem]" />

                <div className="relative flex flex-col px-5 pb-6 pt-5 text-center sm:px-7 sm:pb-7 sm:pt-6">
                  <div className="text-center">
                    <p className="text-[9px] font-bold tracking-wide text-primary font-ml sm:text-[10px] sm:tracking-wide">
                      കേരള സർക്കാർ
                    </p>
                    <p className="font-ml text-sm font-semibold text-primary-deep sm:text-base">
                      വയനാട്
                    </p>
                  </div>

                  <p className="mx-auto mt-2 inline-flex max-w-[95%] justify-center rounded-full border border-[#c5a059]/40 bg-white/90 px-3 py-1 text-[9px] font-bold tracking-wide text-[#775a19] shadow-sm font-ml sm:mt-2.5 sm:px-4 sm:text-[10px]">
                    തിരഞ്ഞെടുപ്പ് 2026
                  </p>

                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt=""
                      className="mx-auto mt-2.5 h-[88px] w-[88px] shrink-0 rounded-full object-cover shadow-md ring-[3px] ring-[#c5a059]/35 sm:mt-3 sm:h-[100px] sm:w-[100px]"
                    />
                  ) : null}

                  <p className="relative z-10 mt-3 text-[9px] font-semibold leading-normal tracking-wide text-slate-500 font-ml sm:mt-3.5 sm:text-[10px]">
                    കേരള നിയമസഭ
                  </p>
                  <h3 className="relative z-10 mt-1.5 font-ml text-[1.05rem] font-bold leading-tight text-primary-deep sm:mt-2 sm:text-[1.35rem]">
                    പങ്കാളിത്ത സർട്ടിഫിക്കറ്റ്
                  </h3>
                  <p className="mt-2 px-2 text-[11px] italic leading-snug text-slate-500 font-ml sm:text-xs">
                    ജനാധിപത്യ ശബ്ദത്തിന് ഹൃദയം നിറഞ്ഞ നന്ദി
                  </p>

                  <div className="mx-auto mt-4 w-full max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-5 [&::-webkit-scrollbar]:hidden">
                    <p className="whitespace-nowrap px-1 text-center font-ml text-[clamp(0.88rem,3.9vw,1.6rem)] font-bold leading-none tracking-tight text-primary-deep">
                      {name.trim()}
                    </p>
                  </div>
                  <div className="mx-auto mt-2.5 h-0.5 w-20 shrink-0 rounded-full bg-gradient-to-r from-transparent via-[#c5a059] to-transparent sm:mt-3" />

                  <div className="mt-4 space-y-3 border-t border-slate-200/90 pt-4 text-left sm:mt-5 sm:space-y-3.5 sm:pt-5">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold tracking-wide text-slate-400 font-ml sm:tracking-wide">
                          നിയമസഭാ മണ്ഡലം
                        </p>
                        <p className="mt-0.5 break-words text-sm font-semibold text-primary font-ml sm:text-base">
                          {LAC_LABELS[lac]}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[9px] font-bold tracking-wide text-slate-400 font-ml sm:tracking-wide">
                          തിയതി
                        </p>
                        <p className="mt-0.5 break-words text-sm font-semibold text-primary font-ml sm:text-base">
                          ഏപ്രിൽ 9, 2026
                        </p>
                      </div>
                    </div>

                    <div className="pt-0.5">
                      <div className="mb-1.5 h-px max-w-32 bg-slate-300/90" />
                      <p className="text-[9px] font-bold tracking-wider text-primary font-ml">
                        റിട്ടേണിംഗ് ഓഫീസർ
                      </p>
                      <p className="text-[11px] font-medium text-slate-600 font-ml">
                        വയനാട് ജില്ല
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
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary font-ml shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {exporting ? "തയ്യാറാക്കുന്നു…" : "PNG ഡൗൺലോഡ്"}
              </button>
              <button
                type="button"
                onClick={shareCertificate}
                disabled={exporting}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white font-ml shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                പങ്കുവയ്ക്കുക
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 font-ml">
              മൊബൈലിലും വെബിലും സർട്ടിഫിക്കറ്റ് മുഴുവൻ കാണാം. ചില ഫോണുകളിൽ
              ഡൗൺലോഡിന് സ്റ്റോറേജ് അനുമതി ചോദിച്ചേക്കാം. ഉത്തരവാദിത്തത്തോടെ
              ടാഗ് ചെയ്യുക.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-[#e8e6e2] px-5 py-8">
        <p className="text-center text-xs text-slate-600 font-ml">
          © 2026 കേരള നിയമസഭ
        </p>
      </footer>
    </div>
  );
}
