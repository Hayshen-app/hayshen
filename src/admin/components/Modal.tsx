import { useId, type MouseEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  const titleId = useId();

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
