import {
	ArrowsInSimple,
	ArrowsOutSimple,
	CaretDown,
	Check,
	CornersIn,
	Crop,
	MagicWand,
	MagnifyingGlassPlus,
	Pause,
	Play,
	Plus,
	Scissors,
	SkipBack,
	SkipForward,
	SpeakerHigh,
	SpeakerLow,
	SpeakerX,
} from "@phosphor-icons/react";
import { type Dispatch, type RefObject, type SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { useI18n } from "@/contexts/I18nContext";
import { ASPECT_RATIOS, type AspectRatio, getAspectRatioLabel } from "@/utils/aspectRatioUtils";
import type { useVideoEditorAudio } from "../audio/useVideoEditorAudio";
import type { CaptionEditTarget } from "../captionEditing";
import type { useAnnotationRegionCommands } from "../hooks/useAnnotationRegionCommands";
import type { useEditorPlaybackControls } from "../hooks/useEditorPlaybackControls";
import type { useTimelineProjection } from "../hooks/useTimelineProjection";
import type { useZoomRegionCommands } from "../hooks/useZoomRegionCommands";
import type { useAppearanceState } from "../state/useAppearanceState";
import type { useTimelineState } from "../state/useTimelineState";
import type { TimelineEditorHandle } from "../timeline/TimelineEditor";
import type { VideoPlaybackRef } from "../VideoPlayback";
import { EditorVideoPreview } from "./EditorVideoPreview";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	videoPath: string | null;
	previewVersion: number;
	aspectRatio: AspectRatio;
	setAspectRatio: Dispatch<SetStateAction<AspectRatio>>;
	previewAspectRatioValue: number;
	videoPlaybackRef: RefObject<VideoPlaybackRef>;
	timelineRef: RefObject<TimelineEditorHandle>;
	currentTime: number;
	isPlaying: boolean;
	previewVolume: number;
	setPreviewVolume: Dispatch<SetStateAction<number>>;
	suspendRendering: boolean;
	appearance: ReturnType<typeof useAppearanceState>;
	timeline: ReturnType<typeof useTimelineState>;
	audio: ReturnType<typeof useVideoEditorAudio>;
	projection: ReturnType<typeof useTimelineProjection>;
	playback: ReturnType<typeof useEditorPlaybackControls>;
	zoomCommands: ReturnType<typeof useZoomRegionCommands>;
	annotationCommands: ReturnType<typeof useAnnotationRegionCommands>;
	effectiveCursorTelemetry: ReturnType<typeof useTimelineState>["cursorTelemetry"];
	effectiveShowCursor: boolean;
	isCropped: boolean;
	handleOpenCropEditor: () => void;
	handleSaveAutoCaptionEdit: (target: CaptionEditTarget, text: string) => void;
	handleSelectAnnotation: (id: string | null) => void;
	setDuration: Dispatch<SetStateAction<number>>;
	setIsPreviewReady: Dispatch<SetStateAction<boolean>>;
	setCurrentTime: Dispatch<SetStateAction<number>>;
	setIsPlaying: Dispatch<SetStateAction<boolean>>;
	setError: Dispatch<SetStateAction<string | null>>;
};

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function EditorPreviewPanel(props: Props) {
	const {
		t,
		videoPath,
		previewVersion,
		aspectRatio,
		setAspectRatio,
		previewAspectRatioValue,
		videoPlaybackRef,
		timelineRef,
		currentTime,
		isPlaying,
		previewVolume,
		setPreviewVolume,
		suspendRendering,
		appearance,
		timeline,
		audio,
		projection,
		playback,
		zoomCommands,
		annotationCommands,
		effectiveCursorTelemetry,
		effectiveShowCursor,
		isCropped,
		handleOpenCropEditor,
		handleSaveAutoCaptionEdit,
		handleSelectAnnotation,
		setDuration,
		setIsPreviewReady,
		setCurrentTime,
		setIsPlaying,
		setError,
	} = props;

	const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const activeElement = document.activeElement;
			const isEditable =
				activeElement &&
				(activeElement.tagName === "INPUT" ||
					activeElement.tagName === "TEXTAREA" ||
					(activeElement as HTMLElement).isContentEditable);

			if (!isEditable && (event.key === "f" || event.key === "F")) {
				event.preventDefault();
				setIsFullscreenOpen((prev) => !prev);
			} else if (isFullscreenOpen && event.key === "Escape") {
				setIsFullscreenOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isFullscreenOpen]);

	const handleFullscreenSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newTime = Number(event.target.value);
		setCurrentTime(newTime);
		if (videoPlaybackRef.current?.video) {
			videoPlaybackRef.current.video.currentTime = newTime;
		}
	};

	const videoPreviewElement = (
		<EditorVideoPreview
			videoPath={videoPath}
			previewVersion={previewVersion}
			aspectRatio={aspectRatio}
			playbackRef={videoPlaybackRef}
			currentTime={currentTime}
			isPlaying={isPlaying}
			previewVolume={previewVolume}
			suspendRendering={suspendRendering}
			appearance={appearance}
			timeline={timeline}
			audio={audio}
			effectiveZoomRegions={projection.effectiveZoomRegions}
			effectiveSpeedRegions={projection.effectiveSpeedRegions}
			effectiveCursorTelemetry={effectiveCursorTelemetry}
			effectiveShowCursor={effectiveShowCursor}
			setDuration={setDuration}
			setIsPreviewReady={setIsPreviewReady}
			setCurrentTime={setCurrentTime}
			setIsPlaying={setIsPlaying}
			setError={setError}
			handlers={{
				onSelectZoom: zoomCommands.handleSelectZoom,
				onZoomFocusChange: zoomCommands.handleZoomFocusChange,
				onEditAutoCaption: handleSaveAutoCaptionEdit,
				onSelectAnnotation: handleSelectAnnotation,
				onAnnotationPositionChange: annotationCommands.handleAnnotationPositionChange,
				onAnnotationSizeChange: annotationCommands.handleAnnotationSizeChange,
			}}
		/>
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			{/* Fullscreen Overlay Mode */}
			{isFullscreenOpen && (
				<div className="fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden bg-black/95 p-4 select-none backdrop-blur-xl">
					{/* Top Header */}
					<div className="z-20 flex items-center justify-between px-4 py-2">
						<span className="text-sm font-semibold tracking-wide text-white/90">
							{t("editor.preview.fullscreenTitle", "Vista Previa a Pantalla Completa")}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsFullscreenOpen(false)}
							className="h-8 gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-medium text-white transition-all hover:bg-white/20 hover:text-white"
						>
							<CornersIn className="h-4 w-4" />
							<span>{t("editor.preview.exitFullscreen", "Salir (Tecla F)")}</span>
						</Button>
					</div>

					{/* Main Video Viewport */}
					<div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
						<div
							className="relative max-h-full max-w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl"
							style={{
								width: "auto",
								height: "100%",
								aspectRatio: previewAspectRatioValue,
								maxWidth: "100%",
								margin: "0 auto",
							}}
						>
							{videoPreviewElement}
						</div>
					</div>

					{/* Floating Control HUD */}
					<div className="z-20 mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-white/10 bg-neutral-900/90 p-3 shadow-2xl backdrop-blur-xl">
						{/* Seek Bar */}
						<div className="flex items-center gap-3 px-2">
							<span className="text-xs font-medium tabular-nums text-white/70">
								{formatTime(currentTime)}
							</span>
							<div className="relative flex flex-1 items-center">
								<input
									type="range"
									min={0}
									max={projection.timelineDuration > 0 ? projection.timelineDuration : 1}
									step={0.01}
									value={currentTime}
									onChange={handleFullscreenSeek}
									className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-blue-500 transition-all hover:bg-white/30"
								/>
							</div>
							<span className="text-xs font-medium tabular-nums text-white/50">
								{formatTime(projection.timelineDuration)}
							</span>
						</div>

						{/* Playback & Volume Buttons */}
						<div className="flex items-center justify-between px-2 pt-1">
							<div className="flex items-center gap-2">
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

							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsFullscreenOpen(false)}
								className="h-9 w-9 rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white"
								title={t("editor.preview.exitFullscreen", "Salir de Pantalla Completa")}
							>
								<ArrowsInSimple className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex min-h-0 flex-1 flex-col">
				<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
					<div className="flex flex-shrink-0 items-center justify-center gap-2 py-1.5">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 gap-1 px-2 text-xs text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
								>
									<span className="font-medium">
										{getAspectRatioLabel(aspectRatio)}
									</span>
									<CaretDown className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="center"
								className="border-foreground/10 bg-editor-surface-alt"
							>
								{ASPECT_RATIOS.map((ratio) => (
									<DropdownMenuItem
										key={ratio}
										onClick={() => setAspectRatio(ratio)}
										className="flex cursor-pointer items-center justify-between gap-3 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
									>
										<span>{getAspectRatioLabel(ratio)}</span>
										{aspectRatio === ratio ? (
											<Check className="h-3 w-3 text-[#2563EB]" />
										) : null}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<div className="h-4 w-px bg-foreground/20" />
						<Button
							variant="ghost"
							size="sm"
							onClick={handleOpenCropEditor}
							className="h-7 gap-1.5 px-2 text-xs text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
						>
							<Crop className="h-3.5 w-3.5" />
							<span className="font-medium">{t("settings.crop.title")}</span>
							{isCropped ? (
								<span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
							) : null}
						</Button>
						<div className="h-4 w-px bg-foreground/20" />
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsFullscreenOpen(true)}
							className="h-7 gap-1.5 px-2 text-xs text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
							title={t("editor.preview.fullscreen", "Pantalla Completa (Tecla F)")}
						>
							<ArrowsOutSimple className="h-3.5 w-3.5" />
							<span className="font-medium">{t("editor.preview.fullscreenLabel", "Pantalla Completa (F)")}</span>
						</Button>
					</div>
					<div
						className="flex min-h-0 w-full flex-1 items-stretch"
						style={{ flex: "1 1 auto", margin: "6px 0 0" }}
					>
						<div className="flex min-w-0 flex-1 items-center justify-center px-1">
							<div
								className="relative"
								style={{
									width: "auto",
									height: "100%",
									aspectRatio: previewAspectRatioValue,
									maxWidth: "100%",
									margin: "0 auto",
									boxSizing: "border-box",
								}}
							>
								{!isFullscreenOpen && videoPreviewElement}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="relative flex flex-shrink-0 items-center px-1 py-1">
				<div className="z-10 flex min-w-0 flex-1 items-center gap-1.5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 gap-1 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 text-[11px] text-foreground/65 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)] transition-all hover:bg-foreground/[0.08] hover:text-foreground"
							>
								<Plus className="h-3.5 w-3.5" />
								<span className="font-medium">{t("editor.toolbar.addLayer")}</span>
								<CaretDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="border-foreground/10 bg-editor-surface-alt"
						>
							<DropdownMenuItem
								onClick={() => {
									const nextTrack =
										timeline.annotationRegions.length > 0
											? Math.max(
													...timeline.annotationRegions.map(
														(region) => region.trackIndex ?? 0,
													),
												) + 1
											: 0;
									timelineRef.current?.addAnnotation(nextTrack);
								}}
								className="cursor-pointer text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
							>
								{t("timeline.annotation.label")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									const nextTrack =
										timeline.audioRegions.length > 0
											? Math.max(
													...timeline.audioRegions.map(
														(region) => region.trackIndex ?? 0,
													),
												) + 1
											: 0;
									timelineRef.current?.addAudio(nextTrack);
								}}
								className="cursor-pointer text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
							>
								{t("timeline.audio.label")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<div className="mx-1 h-4 w-px bg-foreground/10" />
					<Button
						onClick={() => timelineRef.current?.addZoom()}
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
						title={t("timeline.zoom.addZoom")}
					>
						<MagnifyingGlassPlus className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => timelineRef.current?.suggestZooms()}
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
						title={t("timeline.zoom.suggestZooms")}
					>
						<MagicWand className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => timelineRef.current?.splitClip()}
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
						title={t("editor.toolbar.splitClip")}
					>
						<Scissors className="h-4 w-4" />
					</Button>
				</div>

				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
					<div className="pointer-events-auto flex items-center gap-1.5">
						<span className="mr-1 text-[10px] font-medium tabular-nums text-muted-foreground">
							{formatTime(projection.timelinePlayheadTime)}
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
							title={t("editor.playback.skipBack")}
							onClick={playback.handlePreviewSkipBack}
						>
							<SkipBack className="h-3.5 w-3.5" weight="fill" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className={`h-7 w-7 rounded-full border border-foreground/10 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all ${isPlaying ? "bg-foreground/10 text-foreground hover:bg-foreground/20" : "bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-white/90"}`}
							onClick={playback.togglePlayPause}
							title={isPlaying ? "Pause" : "Play"}
						>
							{isPlaying ? (
								<Pause className="h-3.5 w-3.5" weight="fill" />
							) : (
								<Play className="h-3.5 w-3.5" weight="fill" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 rounded-full text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground"
							title={t("editor.playback.skipForward")}
							onClick={playback.handlePreviewSkipForward}
						>
							<SkipForward className="h-3.5 w-3.5" weight="fill" />
						</Button>
						<span className="ml-1 text-[10px] font-medium tabular-nums text-muted-foreground/70">
							{formatTime(projection.timelineDuration)}
						</span>
					</div>
				</div>

				<div className="z-10 ml-auto flex items-center gap-2">
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							className="text-muted-foreground transition-colors hover:text-foreground"
							title={t("editor.playback.muteUnmute")}
							onClick={() => setPreviewVolume(previewVolume <= 0.001 ? 1 : 0)}
						>
							{previewVolume <= 0.001 ? (
								<SpeakerX className="h-3.5 w-3.5" />
							) : previewVolume < 0.5 ? (
								<SpeakerLow className="h-3.5 w-3.5" />
							) : (
								<SpeakerHigh className="h-3.5 w-3.5" />
							)}
						</button>
						<div className="relative flex h-7 w-24 select-none items-center overflow-hidden rounded-full border border-foreground/[0.06] bg-editor-bg/80 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]">
							<div
								className="absolute inset-y-[3px] left-[3px] right-auto rounded-[10px] bg-foreground/[0.08]"
								style={{
									width:
										previewVolume > 0
											? `max(calc(${previewVolume * 100}% - 6px), 1.2rem)`
											: 0,
								}}
							/>
							<div
								className="pointer-events-none absolute bottom-[18%] top-[18%] z-10 w-0.5 rounded-full bg-foreground/95 shadow-[0_0_10px_rgba(37,99,235,0.28)]"
								style={{ left: `calc(${previewVolume * 100}% - 8px)` }}
							/>
							<span className="pointer-events-none relative z-10 pl-2 text-[10px] font-medium text-muted-foreground">
								{Math.round(previewVolume * 100)}%
							</span>
							<input
								type="range"
								aria-label={t("editor.playback.volume", "Preview volume")}
								min="0"
								max="1"
								step="0.01"
								value={previewVolume}
								onChange={(event) => setPreviewVolume(Number(event.target.value))}
								className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
