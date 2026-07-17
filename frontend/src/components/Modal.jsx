// Ortak modal kabuğu — koyu yarı saydam overlay + yumuşak açılış animasyonu.
export default function Modal({ onClose, maxWidth = "max-w-md", children }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-overlayIn items-center justify-center bg-stone-900/45 p-5 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} animate-sheetIn overflow-hidden rounded-[20px] bg-white shadow-[0_30px_70px_rgba(28,25,23,.28)]`}
      >
        {children}
      </div>
    </div>
  );
}
