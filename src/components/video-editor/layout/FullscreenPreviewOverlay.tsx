import {
	ArrowsInSimple,
	CornersIn,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	SpeakerHigh,
	SpeakerLow,
	SpeakerX,
} from "@phosphor-icons/react";
import { type Dispatch, type RefObject, type SetStateAction, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { useVideoEditorAudio } from "../audio/useVideoEditorAudio";
import type { useEditorPlaybackControls } from "../hooks/useEditorPlaybackControls";
import type { useAppearanceState } from "../state/useAppearanceState";
import type { useTimelineState } from "../state/useTimelineState";
import type { CursorTelemetryPoint, SpeedRegion, ZoomRegion } from "../types";
import type { VideoPlaybackRef } from "../VideoPlayback";
import { EditorVideoPreview } from "./EditorVideoPreview";

interface FullscreenPreviewOverlayProps {
	isOpen: boolean;
	onClose: () => void;
	videoPath: string | null;
	previewVersion: number;
	aspectRatio: any;
	playbackRef: RefObject<VideoPlaybackRef>;
	currentTime: number;
	duration: number;
	isPlaying: boolean;
	previewVolume: number;
	setPreviewVolume: Dispatch<SetStateAction<number>>;
	appearance: ReturnType<typeof useAppearanceState>;
	timeline: ReturnType<typeof useTimelineState>;
	audio: ReturnType<typeof useVideoEditorAudio>;
	effectiveZoomRegions: ZoomRegion[];
	effectiveSpeedRegions: SpeedRegion[];
	effectiveCursorTelemetry: CursorTelemetryPoint[];
	effectiveShowCursor: boolean;
	setCurrentTime: Dispatch<SetStateAction<number>>;
	setIsPlaying: Dispatch<SetStateAction<boolean>>;
	playback: ReturnType<typeof useEditorPlaybackControls>;
	t: (key: string, fallback?: string) => string;
}

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FullscreenPreviewOverlay({
	isOpen,
	onClose,
	videoPath,
	previewVersion,
	aspectRatio,
	playbackRef,
	currentTime,
	duration,
	isPlaying,
	previewVolume,
	setPreviewVolume,
	appearance,
	timeline,
	audio,
	effectiveZoomRegions,
	effectiveSpeedRegions,
	effectiveCursorTelemetry,
	effectiveShowCursor,
	setCurrentTime,
	setIsPlaying,
	playback,
	t,
}: FullscreenPreviewOverlayProps) {
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			} else if (event.key === " ") {
				event.preventDefault();
				playback.togglePlayPause();
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				playback.handlePreviewSkipBack();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				playback.handlePreviewSkipForward();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose, playback]);

	if (!isOpen) return null;

	const handleSeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newTime = Number(event.target.value);
		setCurrentTime(newTime);
		if (playbackRef.current?.video) {
			playbackRef.current.video.currentTime = newTime;
		}
	};

	return (
		<div className="fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden bg-black/95 p-4 select-none backdrop-blur-md">
			{/* Top Header Controls */}
			<div className="z-20 flex items-center justify-between px-4 py-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold tracking-wide text-white/90">
						{t("editor.preview.fullscreenTitle", "Vista Previa a Pantalla Completa")}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="h-8 gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-medium text-white transition-all hover:bg-white/20 hover:text-white"
				>
					<CornersIn className="h-4 w-4" />
					<span>{t("editor.preview.exitFullscreen", "Salir de Pantalla Completa")}</span>
				</Button>
			</div>

			{/* Main Video Screen Area */}
			<div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
				<div className="relative max-h-full max-w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
					<EditorVideoPreview
						videoPath={videoPath}
						previewVersion={previewVersion}
						aspectRatio={aspectRatio}
						playbackRef={playbackRef}
						currentTime={currentTime}
						isPlaying={isPlaying}
						previewVolume={previewVolume}
						suspendRendering={false}
						appearance={appearance}
						timeline={timeline}
						audio={audio}
						effectiveZoomRegions={effectiveZoomRegions}
						effectiveSpeedRegions={effectiveSpeedRegions}
						effectiveCursorTelemetry={effectiveCursorTelemetry}
						effectiveShowCursor={effectiveShowCursor}
						setDuration={() => {}}
						setIsPreviewReady={() => {}}
						setCurrentTime={setCurrentTime}
						setIsPlaying={setIsPlaying}
						setError={() => {}}
						handlers={{
							onSelectZoom: () => {},
							onZoomFocusChange: () => {},
							onEditAutoCaption: () => {},
							onSelectAnnotation: () => {},
							onAnnotationPositionChange: () => {},
							onAnnotationSizeChange: () => {},
						}}
					/>
				</div>
			</div>

			{/* Floating Glassmorphism Bottom Control Bar */}
			<div className="z-20 mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-white/10 bg-neutral-900/80 p-3 shadow-2xl backdrop-blur-xl">
				{/* Interactive Time Scrubber Slider */}
				<div className="flex items-center gap-3 px-2">
					<span className="text-xs font-medium tabular-nums text-white/70">
						{formatTime(currentTime)}
					</span>
					<div className="relative flex flex-1 items-center">
						<input
							type="range"
							min={0}
							max={duration > 0 ? duration : 1}
							step={0.01}
							value={currentTime}
							onChange={handleSeekChange}
							className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-blue-500 transition-all hover:bg-white/30"
						/>
					</div>
					<span className="text-xs font-medium tabular-nums text-white/50">
						{formatTime(duration)}
					</span>
				</div>

				{/* Playback Buttons & Volume */}
				<div className="flex items-center justify-between px-2 pt-1">
					<div className="flex items-center gap-2">
						{/* Volume Control */}
						<button
							type="button"
							className="text-white/70 transition-colors hover:text-white"
							title={t("editor.playback.muteUnmute", "Silenciar / Activar Sonido")}
							onClick={() => setPreviewVolume(previewVolume <= 0.001 ? 1 : 0)}
						>
							{previewVolume <= 0.001 ? (
								<SpeakerX className="h-4 w-4" />
							) : previewVolume < 0.5 ? (
								<SpeakerLow className="h-4 w-4" />
							) : (
								<SpeakerHigh className="h-4 w-4" />
							)}
						</button>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={previewVolume}
							onChange={(e) => setPreviewVolume(Number(e.target.value))}
							className="h-1 w-20 cursor-pointer appearance-none rounded bg-white/20 accent-blue-500"
						/>
					</div>

					{/* Center Navigation Buttons */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white"
							title={t("editor.playback.skipBack", "Rebobinar 5s")}
							onClick={playback.handlePreviewSkipBack}
						>
							<SkipBack className="h-4 w-4" weight="fill" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className={`h-10 w-10 rounded-full border border-white/20 shadow-lg transition-all ${
								isPlaying
									? "bg-white/20 text-white hover:bg-white/30"
									: "bg-white text-black hover:bg-white/90"
							}`}
							onClick={playback.togglePlayPause}
							title={isPlaying ? "Pausar" : "Reproducir"}
						>
							{isPlaying ? (
								<Pause className="h-4 w-4" weight="fill" />
							) : (
								<Play className="h-4 w-4" weight="fill" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white"
							title={t("editor.playback.skipForward", "Adelantar 5s")}
							onClick={playback.handlePreviewSkipForward}
						>
							<SkipForward className="h-4 w-4" weight="fill" />
						</Button>
					</div>

					{/* Exit Fullscreen Button */}
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-9 w-9 rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white"
						title={t("editor.preview.exitFullscreen", "Salir de Pantalla Completa")}
					>
						<ArrowsInSimple className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
