"use client";

import { useState, useRef, Suspense } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { MessageCircle, X, Minus, Maximize2, GripHorizontal } from "lucide-react";
import { ChatInterface } from "./ChatInterface";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  return (
    <>
      {/* Full-page drag constraint layer */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      {/* Floating Action Button — always visible */}
      <motion.div
        drag
        dragControls={dragControls}
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => { hasDragged.current = false; }}
        onDrag={() => { hasDragged.current = true; }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
        style={{ touchAction: "none" }}
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!hasDragged.current) {
              setIsOpen(!isOpen);
              setIsMinimized(false);
            }
            hasDragged.current = false;
          }}
          onPointerDown={(e) => dragControls.start(e)}
          className={`
            relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-300
            ${isOpen
              ? "bg-slate-900 hover:bg-slate-800 w-12 h-12 sm:w-14 sm:h-14 ring-4 ring-slate-900/20"
              : "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 h-12 sm:h-14 shadow-blue-500/30"
            }
          `}
          title="Discussion (Glissez pour déplacer)"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-white text-xs sm:text-sm font-bold pr-1">Discussion</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Floating Chat Modal — Fully viewport responsive & scrollable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-3xl shadow-2xl border border-slate-200 bg-white"
            style={{
              right: "max(12px, calc(100vw - 100vw + 12px))",
              bottom: isMinimized ? 76 : 80,
              width: "min(500px, calc(100vw - 24px))",
              height: isMinimized ? 52 : "min(620px, calc(100vh - 96px))",
              maxHeight: "calc(100vh - 96px)",
              transition: "height 0.25s ease, bottom 0.25s ease",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0 cursor-move" onPointerDown={(e) => dragControls.start(e)}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <GripHorizontal className="w-4 h-4 text-white/50" />
                <span className="text-white font-black text-sm">Messagerie Teamflows</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
                  title={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body - Scrollable */}
            {!isMinimized && (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                <Suspense
                  fallback={
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs font-bold text-slate-500">Chargement de la discussion...</p>
                    </div>
                  }
                >
                  <ChatInterface isWidget={true} />
                </Suspense>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
