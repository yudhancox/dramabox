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

const EPISODES_PER_PAGE = 30;

export default function WatchPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [quality, setQuality] = useState(720);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: detailData } = useDramaDetail(bookId || "");
  const { data: episodes } = useEpisodes(bookId || "");

  useEffect(() => {
    const ep = parseInt(searchParams.get("ep") || "0", 10);
    if (ep >= 0) setCurrentEpisode(ep);
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

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
    if (!availableQualities.includes(quality)) {
      setQuality(availableQualities[0]);
    }
  }, [availableQualities, quality]);

  const getVideoUrl = () => {
    if (!defaultCdn) return "";
    const video =
      defaultCdn.videoPathList.find((v) => v.quality === quality) ||
      defaultCdn.videoPathList[0];
    return video?.videoPath || "";
  };

  return (
    <>
      {/* VIDEO FULLSCREEN */}
      <div className="fixed inset-0 z-50 bg-black">
        <video
          ref={videoRef}
          src={getVideoUrl()}
          autoPlay
          controls
          playsInline
          className="w-screen h-screen object-contain"
          poster={currentEpisodeData?.chapterImg}
        />

        {/* BACK BUTTON */}
        <Link
          href={`/detail/${bookId}`}
          className="absolute top-4 left-4 z-50 flex items-center gap-2 text-white bg-black/60 px-3 py-2 rounded-lg"
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
      </div>
    </>
  );
}
