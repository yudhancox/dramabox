"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDramaDetail, useEpisodes } from "@/hooks/useDramaDetail";
import { ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SWIPE_THRESHOLD = 60;

export default function WatchPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [quality, setQuality] = useState(720);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  const { data: detailData } = useDramaDetail(bookId || "");
  const { data: episodes } = useEpisodes(bookId || "");

  /* ===== INIT EP FROM URL ===== */
  useEffect(() => {
    const ep = parseInt(searchParams.get("ep") || "0", 10);
    if (!isNaN(ep)) setCurrentEpisode(ep);
  }, [searchParams]);

  /* ===== LOCK SCROLL ===== */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ===== DATA ===== */
  const currentEpisodeData = useMemo(() => {
    if (!episodes) return null;
    return episodes[currentEpisode] || null;
  }, [episodes, currentEpisode]);

  const defaultCdn = useMemo(() => {
    if (!currentEpisodeData) return null;
    return (
      currentEpisodeData.cdnList.find((c) => c.isDefault === 1) ||
      currentEpisodeData.cdnList[0]
    );
  }, [currentEpisodeData]);

  const availableQualities = useMemo(() => {
    const list = defaultCdn?.videoPathList
      ?.filter((v) => v.isVipEquity === 0)
      .map((v) => v.quality)
      .filter((q): q is number => typeof q === "number");

    return Array.from(new Set(list?.length ? list : [720])).sort((a, b) => b - a);
  }, [defaultCdn]);

  useEffect(() => {
    if (availableQualities.length && !availableQualities.includes(quality)) {
      setQuality(availableQualities[0]);
    }
  }, [availableQualities, quality]);

  const getVideoUrl = () => {
    if (!defaultCdn) return "";
    const v =
      defaultCdn.videoPathList.find((x) => x.quality === quality) ||
      defaultCdn.videoPathList[0];
    return v?.videoPath || "";
  };

  /* ===== EP CHANGE ===== */
  const changeEpisode = (index: number) => {
    if (!episodes) return;
    if (index < 0 || index >= episodes.length) return;
    setCurrentEpisode(index);
    router.replace(`/watch/${bookId}?ep=${index}`);
  };

  /* ===== AUTO NEXT EP ===== */
  const handleEnded = () => {
    if (!episodes) return;
    if (currentEpisode < episodes.length - 1) {
      changeEpisode(currentEpisode + 1);
    }
  };

  /* ===== SWIPE HANDLERS ===== */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;

    if (diff > SWIPE_THRESHOLD) {
      // swipe up → next
      changeEpisode(currentEpisode + 1);
    } else if (diff < -SWIPE_THRESHOLD) {
      // swipe down → prev
      changeEpisode(currentEpisode - 1);
    }

    touchStartY.current = null;
  };

  if (!currentEpisodeData) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        key={`${currentEpisode}-${quality}`}
        src={getVideoUrl()}
        autoPlay
        controls
        playsInline
        onEnded={handleEnded}
        poster={currentEpisodeData.chapterImg}
        className="w-screen h-screen object-contain"
      />

      {/* BACK */}
      <Link
        href={`/detail/${bookId}`}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/60 text-white px-3 py-2 rounded-lg"
      >
        <ChevronLeft size={18} />
        Kembali
      </Link>

      {/* QUALITY */}
      <div className="absolute top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg bg-black/60 text-white">
              <Settings size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableQualities.map((q) => (
              <DropdownMenuItem key={q} onClick={() => setQuality(q)}>
                {q}p
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* EP INFO */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm opacity-80">
        Episode {currentEpisode + 1}
      </div>
    </div>
  );
}
