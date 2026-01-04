"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDramaDetail, useEpisodes } from "@/hooks/useDramaDetail";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EPISODES_PER_PAGE = 30;

export default function WatchPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [quality, setQuality] = useState(720);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: detailData, isLoading: detailLoading } = useDramaDetail(bookId || "");
  const { data: episodes, isLoading: episodesLoading } = useEpisodes(bookId || "");

  useEffect(() => {
    const ep = parseInt(searchParams.get("ep") || "0", 10);
    if (ep >= 0) {
      setCurrentEpisode(ep);
      setCurrentPage(Math.floor(ep / EPISODES_PER_PAGE));
    }
  }, [searchParams]);

  const handleEpisodeChange = (index: number) => {
    setCurrentEpisode(index);
    router.push(`/watch/${bookId}?ep=${index}`);
  };

  const currentEpisodeData = useMemo(() => {
    if (!episodes) return null;
    return episodes[currentEpisode] || null;
  }, [episodes, currentEpisode]);

  const defaultCdn = useMemo(() => {
    if (!currentEpisodeData) return null;
    return (
      currentEpisodeData.cdnList.find((cdn) => cdn.isDefault === 1) ||
      currentEpisodeData.cdnList[0] ||
      null
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
    if (!availableQualities.length) return;
    if (!availableQualities.includes(quality)) {
      setQuality(availableQualities[0]);
    }
  }, [availableQualities, quality]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const getVideoUrl = () => {
    if (!currentEpisodeData || !defaultCdn) return "";
    const videoPath =
      defaultCdn.videoPathList.find((v) => v.quality === quality) ||
      defaultCdn.videoPathList.find((v) => v.isDefault === 1) ||
      defaultCdn.videoPathList[0];
    return videoPath?.videoPath || "";
  };

  const handleVideoEnded = () => {
    if (!episodes) return;
    const next = currentEpisode + 1;
    if (next < episodes.length) handleEpisodeChange(next);
  };

  if (detailLoading || episodesLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </main>
    );
  }

  if (!detailData?.data || !episodes) return null;

  const { book } = detailData.data;

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <Link href={`/detail/${bookId}`} className="flex items-center gap-2 mb-4">
          <ChevronLeft /> Kembali
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div>
            {/* VIDEO */}
            <div
              className={`bg-black overflow-hidden transition-all duration-300
                ${
                  isFullscreen
                    ? "fixed inset-0 z-50 rounded-none"
                    : "relative aspect-video rounded-2xl"
                }
              `}
            >
              <video
                ref={videoRef}
                key={`${currentEpisode}-${quality}`}
                src={getVideoUrl()}
                controls
                autoPlay
                onEnded={handleVideoEnded}
                poster={currentEpisodeData?.chapterImg}
                className="w-full h-full object-contain"
              />

              {/* FULLSCREEN BUTTON */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-black/60 text-white"
              >
                {isFullscreen ? <Minimize2 /> : <Maximize2 />}
              </button>

              {/* QUALITY */}
              <div className="absolute top-4 right-4 z-50">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg bg-black/60 text-white">
                      <Settings />
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
            </div>

            {/* INFO */}
            <div className="mt-4">
              <h1 className="text-xl font-bold">{book.bookName}</h1>
              <p className="text-sm text-muted-foreground">
                {currentEpisodeData?.chapterName}
              </p>
            </div>
          </div>

          {/* EPISODE LIST */}
          <div>
            <h2 className="font-bold mb-2">Daftar Episode</h2>
            <div className="grid grid-cols-5 gap-2">
              {episodes.map((ep) => (
                <button
                  key={ep.chapterId}
                  onClick={() => handleEpisodeChange(ep.chapterIndex)}
                  className={`aspect-square rounded ${
                    currentEpisode === ep.chapterIndex
                      ? "bg-primary text-white"
                      : "bg-muted"
                  }`}
                >
                  {ep.chapterIndex + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}                 
