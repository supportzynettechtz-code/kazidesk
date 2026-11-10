import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MonitorUp, 
  MonitorOff, 
  MessageSquare, 
  Users, 
  PhoneOff, 
  CheckCircle2, 
  Circle, 
  Send, 
  Hand, 
  Layers, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Camera,
  Eye,
  AlertCircle
} from 'lucide-react';
import { MeetingRoom, MeetingParticipant, MeetingChatMessage, Employee } from '../../types/office';

interface MeetingRoomViewProps {
  lang: 'sw' | 'en';
  room: MeetingRoom;
  currentUser: Employee;
  onSendMessage: (roomId: string, message: Omit<MeetingChatMessage, 'id' | 'timestamp'>) => void;
  onToggleAgendaItem: (roomId: string, agendaItemId: string) => void;
  onUpdateParticipantStatus: (roomId: string, participantId: string, updates: Partial<MeetingParticipant>) => void;
}

export const MeetingRoomView: React.FC<MeetingRoomViewProps> = ({
  lang,
  room,
  currentUser,
  onSendMessage,
  onToggleAgendaItem,
  onUpdateParticipantStatus,
}) => {
  // Local AV & Stage Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Dedicated View Toggle: 'screen' vs 'camera' (or 'grid' when idle)
  const [stageView, setStageView] = useState<'screen' | 'camera' | 'grid'>('grid');
  
  // Media Streams
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [hasHandRaised, setHasHandRaised] = useState(false);
  const [isPipOpen, setIsPipOpen] = useState(true);

  // Panels
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'participants' | 'agenda'>('chat');
  const [chatInput, setChatInput] = useState('');

  // Video Element Refs
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const messagesList = room.messages || [];
  const agendaList = room.agenda.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `agenda-${idx}`, title: item, isCompleted: false };
    }
    return item;
  });

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  // Handle Screen Capture API
  const handleStartScreenShare = async () => {
    try {
      setMediaError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Kivinjari chako hakitumii Screen Capture API moja kwa moja.');
      }

      // Invoke Screen Capture API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: false,
      });

      setScreenStream(stream);
      setIsScreenSharing(true);
      setStageView('screen'); // Automatically focus screen view when started

      // Handle user stopping screen share via browser native UI bar
      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          handleStopScreenShare();
        };
      }

      onUpdateParticipantStatus(room.id, currentUser.id, { isScreenSharing: true });
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setMediaError(err.message || 'Haikuweza kuanzisha screen capture.');
      }
      setIsScreenSharing(false);
    }
  };

  const handleStopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    
    // Switch back to camera if enabled, else grid
    setStageView(isCameraOn ? 'camera' : 'grid');
    onUpdateParticipantStatus(room.id, currentUser.id, { isScreenSharing: false });
  };

  // Handle User Camera (getUserMedia)
  const handleToggleCamera = async () => {
    if (isCameraOn) {
      // Turn OFF
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setIsCameraOn(false);
      if (stageView === 'camera' && !isScreenSharing) {
        setStageView('grid');
      }
    } else {
      // Turn ON
      try {
        setMediaError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          setCameraStream(stream);
        }
        setIsCameraOn(true);
        if (!isScreenSharing) {
          setStageView('camera');
        }
      } catch (err: any) {
        // Fallback: Still activate camera state with avatar preview if hardware blocked
        setIsCameraOn(true);
        if (!isScreenSharing) {
          setStageView('camera');
        }
      }
    }
  };

  // Sync Video streams to refs
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, stageView]);

  useEffect(() => {
    if (mainCameraVideoRef.current && cameraStream) {
      mainCameraVideoRef.current.srcObject = cameraStream;
    }
    if (pipCameraVideoRef.current && cameraStream) {
      pipCameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, stageView, isPipOpen]);

  // Clean up all streams on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream, cameraStream]);

  // Toggle View Switcher Handler
  const handleToggleStageView = () => {
    if (stageView === 'screen') {
      setStageView('camera');
    } else if (stageView === 'camera') {
      setStageView(isScreenSharing ? 'screen' : 'grid');
    } else {
      // currently grid
      setStageView(isScreenSharing ? 'screen' : 'camera');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    onSendMessage(room.id, {
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      text: chatInput.trim(),
    });

    setChatInput('');
  };

  return (
    <div className="space-y-4">
      {/* Meeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                {room.title}
              </h1>
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-bold">
                {room.roomCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mkutano wa Mtandaoni · Washiriki {room.participants.length} wapo hewani
            </p>
          </div>
        </div>

        {/* Top View Mode Switcher & Status */}
        <div className="flex items-center gap-2">
          {/* Dedicated View Switcher Segmented Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setStageView('grid')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                stageView === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gridi ya Wote</span>
            </button>

            <button
              onClick={() => setStageView('camera')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                stageView === 'camera'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Mtazamo: Kamera</span>
            </button>

            <button
              onClick={() => {
                if (!isScreenSharing) {
                  handleStartScreenShare();
                } else {
                  setStageView('screen');
                }
              }}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                stageView === 'screen'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isScreenSharing 
                    ? 'text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-slate-700' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MonitorUp className="w-3.5 h-3.5" />
              <span>Mtazamo: Screen</span>
            </button>
          </div>
        </div>
      </div>

      {mediaError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Conference Stage & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Main Stage */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden min-h-[460px] flex flex-col justify-between p-4 shadow-xl">
            
            {/* STAGE HEADER OVERLAY: Toggle Camera ↔ Screen and Active Status */}
            <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="bg-black/75 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold">
                    {stageView === 'screen' 
                      ? 'Live Screen Capture (Screen View)' 
                      : stageView === 'camera' 
                        ? 'Live Camera Feed (Camera View)' 
                        : 'Mkutano wa Pamoja (Grid View)'}
                  </span>
                </span>

                {isScreenSharing && (
                  <span className="bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-md animate-pulse">
                    Screen Inashare-wa
                  </span>
                )}
              </div>

              {/* Quick Toggle Button between Camera & Screen */}
              <div className="pointer-events-auto">
                <button
                  onClick={handleToggleStageView}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md text-xs font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                  title="Badili mtazamo kati ya Kamera na Screen"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {stageView === 'screen' 
                      ? 'Badili kwenda Kamera' 
                      : stageView === 'camera' 
                        ? (isScreenSharing ? 'Badili kwenda Screen' : 'Badili kwenda Gridi') 
                        : (isScreenSharing ? 'Badili kwenda Screen' : 'Badili kwenda Kamera')}
                  </span>
                </button>
              </div>
            </div>

            {/* STAGE CONTENT AREA */}
            <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800/80 mt-12 mb-3">
              
              {/* 1. SCREEN VIEW (Screen Capture API Stream) */}
              {stageView === 'screen' && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {screenStream ? (
                    <video
                      ref={(el) => {
                        screenVideoRef.current = el;
                        if (el && screenStream && el.srcObject !== screenStream) {
                          el.srcObject = screenStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full max-h-[460px] object-contain"
                    />
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <MonitorUp className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                      <h3 className="text-sm font-bold text-white">Screen Capture Hijaanzishwa</h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Bofya kitufe cha chini &quot;Shiriki Screen&quot; kuanza kuonyesha skrini yako kwenye mkutano.
                      </p>
                      <button
                        onClick={handleStartScreenShare}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                      >
                        Anza Kushare Screen Sasa
                      </button>
                    </div>
                  )}

                  {/* Picture-in-Picture (PiP) Floating Presenter Camera */}
                  {isPipOpen && (
                    <div className="absolute bottom-4 right-4 z-30 w-44 sm:w-52 aspect-video rounded-xl bg-slate-900 border-2 border-emerald-500/80 shadow-2xl overflow-hidden group">
                      {cameraStream && isCameraOn ? (
                        <video
                          ref={(el) => {
                            pipCameraVideoRef.current = el;
                            if (el && cameraStream && el.srcObject !== cameraStream) {
                              el.srcObject = cameraStream;
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-2 text-center">
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.fullName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500 mb-1"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] font-bold text-white truncate max-w-full">
                            {currentUser.fullName}
                          </span>
                        </div>
                      )}

                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setIsPipOpen(false)}
                          className="p-1 rounded bg-black/70 text-white hover:text-red-400"
                          title="Funga PiP"
                        >
                          <Minimize2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 text-white px-1.5 py-0.2 rounded font-mono">
                        Mwasilishaji (PiP)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CAMERA VIEW (Presenter / Webcam HD View) */}
              {stageView === 'camera' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                  {cameraStream && isCameraOn ? (
                    <video
                      ref={(el) => {
                        mainCameraVideoRef.current = el;
                        if (el && cameraStream && el.srcObject !== cameraStream) {
                          el.srcObject = cameraStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full max-h-[460px] object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.fullName}
                          className="w-28 h-28 rounded-full object-cover ring-4 ring-emerald-500 shadow-2xl"
                          referrerPolicy="no-referrer"
                        />
                        {isMicOn && (
                          <div className="absolute -inset-2 rounded-full ring-2 ring-emerald-400 animate-ping opacity-60" />
                        )}
                      </div>
                      <div className="text-center">
                        <h2 className="text-base font-bold text-white">{currentUser.fullName}</h2>
                        <p className="text-xs text-slate-400">{currentUser.roleTitle} · {currentUser.department}</p>
                        <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                          {isCameraOn ? 'Kamera Ipo Hewani' : 'Kamera Imezimwa (Bofya Kitufe cha Kamera Kuwasha)'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notice if Screen is sharing in background */}
                  {isScreenSharing && (
                    <div className="absolute bottom-4 left-4 z-30 bg-black/80 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-white shadow-lg">
                      <MonitorUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Screen share yako inaendelea.</span>
                      <button
                        onClick={() => setStageView('screen')}
                        className="ml-1 text-emerald-400 font-bold hover:underline"
                      >
                        Tazama Screen →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. GRID VIEW (All Participants) */}
              {stageView === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full h-full p-4 overflow-y-auto">
                  {room.participants.map(participant => (
                    <div
                      key={participant.id}
                      className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden aspect-video flex flex-col items-center justify-center p-4 group"
                    >
                      <div className="relative">
                        <img
                          src={participant.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                          alt={participant.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-700"
                          referrerPolicy="no-referrer"
                        />
                        {participant.isSpeaking && (
                          <div className="absolute -inset-1 rounded-full ring-2 ring-emerald-500 animate-pulse" />
                        )}
                      </div>

                      <div className="mt-3 text-center">
                        <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                          <span>{participant.name}</span>
                          {participant.role === 'Host' && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded">Host</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{participant.department || 'Mfanyakazi'}</div>
                      </div>

                      {/* Participant Indicators */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white">
                        {(participant.isMuted || participant.isAudioMuted) ? (
                          <MicOff className="w-3 h-3 text-red-400" />
                        ) : (
                          <Mic className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Conference Controls Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Mic Toggle */}
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-full transition-all flex items-center justify-center shadow-md ${
                    isMicOn 
                      ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
                  }`}
                  title={isMicOn ? 'Zima Maikrofoni (Mute)' : 'Washa Maikrofoni'}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={handleToggleCamera}
                  className={`p-3 rounded-full transition-all flex items-center justify-center shadow-md ${
                    isCameraOn 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                  title={isCameraOn ? 'Zima Kamera' : 'Washa Kamera'}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                {/* SCREEN CAPTURE API BUTTON */}
                <button
                  onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                    isScreenSharing
                      ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorOff className="w-4 h-4" />
                      <span>Acha Kushare Screen</span>
                    </>
                  ) : (
                    <>
                      <MonitorUp className="w-4 h-4" />
                      <span>Shiriki Screen (Screen Capture)</span>
                    </>
                  )}
                </button>

                {/* TOGGLE VIEW BUTTON (Camera vs Screen) */}
                <button
                  onClick={handleToggleStageView}
                  className="px-3.5 py-2.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
                  title="Badili kati ya Kamera na Screen"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Badili Mtazamo (Kamera ↔ Screen)</span>
                  <span className="sm:hidden">Badili Mtazamo</span>
                </button>

                {/* Raise Hand */}
                <button
                  onClick={() => setHasHandRaised(!hasHandRaised)}
                  className={`p-3 rounded-full transition-all ${
                    hasHandRaised 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Inua Mkono Kuuliza Swali"
                >
                  <Hand className="w-5 h-5" />
                </button>
              </div>

              {/* End / Leave Call */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStopScreenShare();
                    if (cameraStream) {
                      cameraStream.getTracks().forEach(t => t.stop());
                    }
                  }}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Ondoka</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Chat / Participants / Agenda */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[520px] shadow-xs">
          
          {/* Panel Selector Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1">
            <button
              onClick={() => setActiveSidePanel('chat')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeSidePanel === 'chat'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mazungumzo</span>
            </button>

            <button
              onClick={() => setActiveSidePanel('participants')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeSidePanel === 'participants'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Watu ({room.participants.length})</span>
            </button>

            <button
              onClick={() => setActiveSidePanel('agenda')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeSidePanel === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ajenda</span>
            </button>
          </div>

          {/* CHAT TAB */}
          {activeSidePanel === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden p-3">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {messagesList.map((msg: MeetingChatMessage) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendChat} className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Andika ujumbe hapa..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* PARTICIPANTS TAB */}
          {activeSidePanel === 'participants' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {room.participants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={participant.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                      alt={participant.name}
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>{participant.name}</span>
                        {participant.id === currentUser.id && (
                          <span className="text-[10px] text-slate-400">(Wewe)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{participant.department || 'Mfanyakazi'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {participant.isScreenSharing && (
                      <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">Screen</span>
                    )}
                    {(participant.isMuted || participant.isAudioMuted) ? (
                      <MicOff className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AGENDA TAB */}
          {activeSidePanel === 'agenda' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Orodha ya Majadiliano ya Mkutano:
              </div>
              {agendaList.map(item => (
                <div
                  key={item.id}
                  onClick={() => onToggleAgendaItem(room.id, item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    item.isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 line-through text-slate-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="pt-0.5">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
